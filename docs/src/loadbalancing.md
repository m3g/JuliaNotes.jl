# A small note on parallel load balancing and thread safety

When running a parallel calculation, it is a good idea to divide the workload into chunks
of known size. We have developed a simple package, [`ChunkSplitters.jl`](https://github.com/m3g/ChunkSplitters.jl) to perform such splitting. Here we make some considerations on why it should be used and how to cope with highly uneven parallel workloads. 

To simulate a highly uneven workload, first we create a function that occupies the processor for a known amount of time given an input. Like a `sleep` function, but that actually does some work and doesn't let the processor free:

```julia-repl
julia> function sleep_for(time=1; cycles_for_one_second=4*10^7)
           x = 0.0
           for i in 1:time*cycles_for_one_second
               x += abs(sin(log(i)))
           end
           return x
       end

julia> @time sleep_for(0.5)
  0.507590 seconds
1.1355518913947988e7
```
with that number of cycles the function takes roughly 1 second in my laptop if `time == 1`. By changing the input `time` we can now create very uneven workloads in a parallel run.

For example, let us sum `N = 100` random numbers but introducing the call to `sleep_for` at each iteration:

```julia-repl
julia> using BenchmarkTools 

julia> import Random: shuffle

julia> function sum_N(;N=100)
           tasks = shuffle(1:N)
           s = 0
           for i in tasks
               sleep_for(i*0.001)
               s += rand()
           end
           return s
       end

julia> @btime sum_N()
  5.819 s (1 allocation: 896 bytes)
50.60627901297448
```

The function takes about `5` seconds, as expected. It is slow, and we want to parallelize it. However, the workload is very uneven, as the `sleep_for` for `i == 1` takes `0.001 s`, and for `i == 100` it takes `0.1 s`. 

We will now write a parallel version of this sum, using the Julia `Base` `@threads` macro. We have initialized julia with `julia -t 12`, such that 12 threads are available:

```julia-repl
julia> function sum_N_threads(;N=100)
           tasks = shuffle(1:N)
           s = zeros(nthreads())
           @threads for i in tasks
               sleep_for(i*0.001)
               s[threadid()] += rand()
           end
           return sum(s)
       end

julia> @btime sum_N_threads()
  767.060 ms (76 allocations: 7.69 KiB)
52.35711885302541
```

We have used `threadid()` here, which is not a recommended pattern, but, anyway, the function is about `7-8` times faster, with 12 threads. Can we do better? 

Let us try to use `@spawn` instead:

```julia-repl
julia> function sum_N_spawn(;N=100)
           s = zeros(nthreads())
           @sync for i in 1:N
               @spawn begin
                   sleep_for(i*0.001)
                   s[threadid()] += rand() 
               end
           end
           return sum(s)
       end

julia> @btime sum_N_spawn()
  725.864 ms (626 allocations: 54.36 KiB)
51.513141160574285
```

So `@spawn` did a better job, because while `@threads` assigns the workload to each thread in advance, `@spawn` does not, and will use the available threads as they become free. We can see that by counting the number of threads that executed each part of the code:  

```julia-repl
julia> function sum_N_spawn(;N=100)
           tasks = shuffle(1:N)
           s = zeros(nthreads())
           n = zeros(Int, nthreads())
           @sync for i in tasks
               @spawn begin
                   sleep_for(i*0.001)
                   s[threadid()] += rand()
                   n[threadid()] += 1 
               end
           end
           return sum(s), n
       end

julia> sum_N_spawn()
(48.60916688417408, [7, 6, 10, 8, 7, 6, 8, 8, 8, 13, 11, 8])
```

Which shows an uneven distribution of tasks per thread, which is different from what `@threads` does, which we illustrate here by dividing 120 tasks into the 12 available threads:

```julia-repl
julia> function sum_N_threads(;N=100)
           tasks = shuffle(1:N)
           s = zeros(nthreads())
           n = zeros(Int, nthreads())
           @threads for i in tasks
               sleep_for(i*0.001)
               s[threadid()] += rand()
               n[threadid()] += 1 
           end
           return sum(s), n
       end

julia> sum_N_threads(N=120)
(62.52592069759371, [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10])
```

Therefore, using `@spawn` seems a better choice for uneven workloads. But what happens if too much tasks are spawned? Let us see, by making each cycle faster, but increasing radically the number of tasks:

```julia-repl
julia> function sum_N_spawn(;N=10^4) # changed here 10^4
           tasks = shuffle(1:N)
           s = zeros(nthreads())
           n = zeros(Int, nthreads())
           @sync for i in tasks
               @spawn begin
                   sleep_for(i*1e-7) # changed here to 1e-7
                   s[threadid()] += rand()
                   n[threadid()] += 1 
               end
           end
           return sum(s), n
       end

julia> @btime sum_N_spawn()
  610.315 ms (53903 allocations: 5.34 MiB)
(4982.465368590981, [820, 847, 806, 841, 829, 813, 873, 839, 842, 857, 820, 813])
```

The tasks are still not homogeneous, but there are much more tasks to launch. Let us see how `@threads` behave now:

```julia-repl
julia> function sum_N_threads(;N=10^4) # changed here 10^4
           tasks = shuffle(1:N)
           s = zeros(nthreads())
           n = zeros(Int, nthreads())
           @threads for i in tasks
               sleep_for(i*1e-7) # changed here to 1e-7
               s[threadid()] += rand()
               n[threadid()] += 1 
               
           end
           return sum(s), n
       end

julia> @btime sum_N_threads()
  626.183 ms (78 allocations: 85.33 KiB)
(5016.910999246582, [834, 833, 834, 833, 833, 833, 834, 833, 834, 833, 833, 833])
```

Now the performance difference is much smaller, because the workload unbalance is less important. However, we note that `@threads` allocates much less memory than `@spawn`. 

Can we have the best of both worlds?


## Using ChunkSplitters

What `ChunkSplitters` does is to give you the complete control of the chunking of the tasks, independently of the use of `@threads` or `@spawn` as the underlying parallel protocol.

The function above will be implemented as:

```julia-repl
julia> using ChunkSplitters

julia> function sum_N_chunks(N=10^5; nchunks=nthreads(), chunk_type=:scatter)
           s = zeros(nchunks)
           n = zeros(Int, nchunks)
           @sync for (i_range, i_chunk) in chunks(1:N, nchunks, chunk_type)
               @spawn for i in i_range
                   sleep_for(i*1e-7)
                   s[i_chunk] += rand()
                   n[i_chunk] += 1
               end
           end
           return sum(s), n
       end
```

We can now choose the number of chunks to be processed by each spawned task. A range of indexes of the collection `1:N` will be stored in `i_range` and associated to the chunk `i_chunk`. We get rid, with this of the use of `threadid()`, which is also nice, because thread migration cannot affect our result anymore.

Since we know that there is a correlation between task cost and index, we use `:scatter` as the chunking strategy, which will distribute the tasks to each thread in an alternating fashion. We get, now:

```julia-repl
julia> @time sum_N_chunks()
 67.668140 seconds (80 allocations: 7.453 KiB)
(49922.78555989177, [8334, 8334, 8334, 8334, 8333, 8333, 8333, 8333, 8333, 8333, 8333, 8333])
```

Such that we have obtained the same performance of `@spawn`, but allocating `7.5KiB` instead of `58Mb`. But did we miss the advantage of `@spawn` of using empty threads, since the tasks associated to each thread are defined in advance? Not necessarily, because we are not restricted to use `nchunks=nthreads()`. Indeed, we can do, now:

```julia-repl
julia> @time sum_N_chunks(;nchunks=144)
 68.080054 seconds (895 allocations: 86.188 KiB)
(49867.13229871132, [695, 695, 695, 695 …  694, 694, 694, 694])
```

Which here has a similar performance (because the `:scatter` splitter already takes care of the unbalanced workload), but still allocated a minimal fraction of what `@spawn` does.


