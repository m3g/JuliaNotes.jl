# A note on parallel load balancing  

When running a parallel calculation, it is a good idea to divide the workload into chunks
of known size. We have developed a simple package, [`ChunkSplitters.jl`](https://github.com/m3g/ChunkSplitters.jl) to perform such splitting. Here we make some considerations on why it should be used and how to cope with highly uneven parallel workloads. 

## Using @threads and @spawn

To simulate a highly uneven workload, first we create a function that occupies a processor for a known amount of time given an input. Like a `sleep` function, but that actually does some work and doesn't let the processor free:

```julia-repl
julia> function work_for(;time=1, cycles_for_one_second=4*10^7)
           x = 0.0
           for i in 1:time*cycles_for_one_second
               x += abs(sin(log(i)))
           end
           return x
       end

julia> @time work_for(time=0.5)
  0.507590 seconds
1.1355518913947988e7
```
with that number of cycles the function takes roughly 1 second in my laptop if `time == 1`. By changing the input `time` we can now create very uneven workloads in a parallel run.

For example, let us sum `N = 120` random numbers but introducing the call to `work_for` at each iteration, with a time proportional to the index of the iteration (`time = i*dt`):

```julia-repl
julia> using BenchmarkTools 

julia> function sum_N(;N=120, dt=0.001)
           s = 0
           for i in 1:N
               work_for(time=i*dt)
               s += rand()
           end
           return s
       end

julia> @btime sum_N()
  8.144 s (0 allocations: 0 bytes)
68.66902947218264
```

The function takes about `8` seconds. It is slow, and we want to parallelize it. However, the workload is very uneven, as the `work_for` call for `i == 1` takes `0.001 s`, and for `i == 120` it takes `0.12 s`. 

We will now write a parallel version of this sum, using the Julia `Base` `@threads` macro. We have initialized julia with `julia -t 12`, such that 12 threads are available. We will also count the number of tasks executed by each thread, accumulated in the `n` array:

```julia-repl
julia> using Base.Threads 

julia> function sum_N_threads(;N=120, dt=0.001)
           s = zeros(nthreads())
           n = zeros(Int, nthreads())
           @threads for i in 1:N
               work_for(time=i*dt)
               s[threadid()] += rand()
               n[threadid()] += 1
           end
           return sum(s), n
       end

julia> @btime sum_N_threads()
  1.422 s (80 allocations: 7.47 KiB)
(50.43661472139146, [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10])
```

The function is about `7-8` times faster, with 12 threads. Note, also, that each thread as responsible for exactly 10 tasks, and this is not optimal given the uneven workload involved.

!!! note
    We have used `threadid()` here, which is not a recommended pattern, because in 
    some situations thread migration can cause concurrency problems. In fact, this
    is main reason for the existence of `ChunkSplitters.jl`, but here we will 
    discuss the additional gains associated with a finer control of the parallelization.
    
Let us try to use `@spawn` instead:

```julia-repl
julia> function sum_N_spawn(;N=120, dt=0.001)
           s = zeros(nthreads())
           n = zeros(Int, nthreads())
           @sync for i in 1:N
               @spawn begin
                   work_for(time=i*dt)
                   s[threadid()] += rand() 
                   n[threadid()] += 1 
               end
           end
           return sum(s), n
       end

julia> @btime sum_N_spawn()
  961.869 ms (628 allocations: 64.86 KiB)
(62.64823839506871, [11, 11, 9, 9, 10, 9, 12, 10, 10, 10, 8, 11])
```

So `@spawn` did a better job, because while `@threads` assigns the workload to each thread in advance, `@spawn` does not, and will use the available threads as they become free. 

Nevertheless, `@spawn` has launched a different task for each workload, and that is reflected in the greater number of allocations it involved. We can see this more clearly if the number of tasks is much greater (`N=100*120`, but we reduce `dt` to keep reasonable running times):

With `@threads`:

```julia-repl
julia> @btime sum_N_threads(N=120*10^2, dt=1e-7)
  1.389 s (75 allocations: 7.31 KiB)
(5945.862883176399, [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000])
```

and now with `@spawn`: 

```julia-repl
julia> @btime sum_N_spawn(N=100*120, dt=1e-7)
  911.976 ms (65901 allocations: 6.45 MiB)
(6010.25758204897, [996, 942, 1023, 1019, 984, 1027, 989, 995, 989, 1016, 994, 1026])
```

The `@spawn` strategy still gains in execution time, but we note that the memory allocated by it increased significantly, which can be an issue for the parallelization of large collections. On the other side, `@threads` allocates only a minimal set of auxiliary buffers.

Can we have the best of both worlds?

## Using ChunkSplitters

`ChunkSplitters` provides an additional control over the chunking of the tasks, and can be used with `@threads` or `@spawn` as the underlying parallel protocol.

The function above will be implemented initially with `@threads` as:

```julia-repl
julia> using ChunkSplitters

julia> function sum_N_chunks(;N=120, dt=0.001, nchunks=nthreads(), chunk_type=:batch)
           s = zeros(nchunks)
           n = zeros(Int, nchunks)
           @threads for (i_range, i_chunk) in chunks(1:N, nchunks, chunk_type)
               for i in i_range
                   work_for(time=i*dt)
                   s[i_chunk] += rand()
                   n[i_chunk] += 1
               end
           end
           return sum(s), n
       end
```

We can now choose the number of chunks in which the workload is divided (by default `nchunks=nthreads()`), and each chunk will be assigned to one thread. A range of indexes of the collection `1:N` will be stored in `i_range` and associated with the chunk `i_chunk`. We get rid, with this, of the use of `threadid()`, which is nice, because thread migration cannot affect our result anymore.

We initially use the `:batch` chunking type, which will just divide the workload consecutively. This will be similar to what `@threads` does, and since there is a correlation between index and cost of the task, this is not optimal:

```julia-repl
julia> @btime sum_N_chunks(N=100*120, dt=1e-7)
  1.463 s (77 allocations: 7.56 KiB)
(6035.277380219111, [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000])
```

We have, now the option to create chunks scattered through the workload, and that can be effective to distribute the workload better given the known correlation of index and cost:

```julia-repl
julia> @btime sum_N_chunks(N=100*120, dt=1e-7, chunk_type=:scatter)
  898.642 ms (77 allocations: 7.56 KiB)
(6073.279878329541, [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000])
```

Note that, in this specific case, the `:scatter` chunking is optimal, because it will assign the tasks in an alternating fashion to the threads. Associated with the small allocation cost, the result can be faster than `@spawn`ing the tasks on demand. 

We can also use `@spawn` with `ChunkSplitters`, with:

```julia-repl
julia> function sum_N_chunks(;N=120, dt=0.001, nchunks=nthreads(), chunk_type=:batch)
           s = zeros(nchunks)
           n = zeros(Int, nchunks)
           @sync for (i_range, i_chunk) in chunks(1:N, nchunks, chunk_type)
               @spawn for i in i_range
                   work_for(time=i*dt)
                   s[i_chunk] += rand()
                   n[i_chunk] += 1
               end
           end
           return sum(s), n
       end
```

Which gives us with the `:batch` chunking mode a suboptimal performance, because the workload is divided by thread in advance:

```julia-repl
julia> @btime sum_N_chunks(N=100*120, dt=1e-7, chunk_type=:batch)
  1.457 s (117 allocations: 8.66 KiB)
(5974.13618602343, [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000])
```

We can, nevertheless, use a different strategy here, which is to increase the number of chunks, thus reducing the individual cost of each task. The number of spawned tasks can now be controlled by the `nchunks` parameter:

```julia-repl
julia> @btime sum_N_chunks(N=100*120, dt=1e-7, nchunks=144, chunk_type=:batch)
  907.016 ms (1037 allocations: 88.39 KiB)
(5993.798439269024, [84, 84, 84, 84, 84, 84, 84, 84, 84, 84  …  83, 83, 83, 83, 83, 83, 83, 83, 83, 83])
```

Here we are in the middle ground between a simple `@spawn` strategy which launches a different task for each calculation, and a `@thread` strategy which launches `nthreads()` tasks. Yet, note that the memory allocated is much less than with the simple use of `@spawn`. 

We can, of course, use the `:scatter` chunking here as well:

```julia-repl
julia> @btime sum_N_chunks(N=100*120, dt=1e-7, chunk_type=:scatter)
  958.821 ms (112 allocations: 8.50 KiB)
(5981.069201763822, [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000])
```
which, compared to the `:batch` chunking, is faster, but it does not perform necessarily better in this example than the combination of `:scatter` and `@threads`, because here this choice promotes the ideal load balancing. 