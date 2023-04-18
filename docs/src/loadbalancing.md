# A small note on parallel load balancing

When running a parallel calculation, it is a good idea to divide the workload into chunks
of known size. We have developed a simple package, [`ChunkSplitters.jl`](https://github.com/m3g/ChunkSplitters.jl) to perform such splitting.

Now we will consider a heavily unbalanced workload. To simulate that, first we create a function that occupies the processor for a known amount of time given an input. Like a `sleep` function, but that actually does some work and doesn't let the processor free:

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

For example, let us sum the numbers from 1 to 100 (`sum(1:100) = 5050`) but introducing the call to `sleep_for` at each iteration:

```julia-repl
julia> function sum_1_to_100()
           s = 0
           for i in 1:100
               sleep_for(i*0.01)
               s += i
           end
           return s
       end

julia> @time sum_1_to_100()
 55.092355 seconds
5050
```

The function takes about `50.5` seconds, as expected. It is slow, and we want to parallelize it. However, the workload is very uneven, as the `sleep_for` for `i == 1` takes `0.01 s`, and for `i == 100` it takes `1 s`. 

We will now write a parallel version of this sum, using the Julia `Base` `@threads` macro. We have initialized julia with `julia -t 10`, such that 10 threads are available:

```julia-repl
julia> function sum_1_to_100_threads()
           s = zeros(nthreads())
           @threads for i in 1:100
               sleep_for(i*0.01)
               s[threadid()] += i
           end
           return sum(s)
       end

julia> @time sum_1_to_100_threads()
 12.323428 seconds (265 allocations: 9.047 KiB)
5050.0
```
We have used `threadid()` here, which is not a recommended pattern, but, anyway, the function is about `50/12 ≈ 4.2` times faster, with 10 threads. Can we do better? 

Let us try to use `@spawn` instead:

```julia-repl
julia> function sum_1_to_100_spawn()
           s = zeros(nthreads())
           @sync for i in 1:100
               @spawn begin
                   sleep_for(i*0.01)
                   s[threadid()] += i
               end
           end
           return sum(s)
       end

julia> @time sum_1_to_100_spawn()
  7.154327 seconds (2.98 k allocations: 193.717 KiB, 0.65% compilation time)
5050.0
```

So `@spawn` did a better job, because while `@threads` assigns the workload to each in advance, `@spawn` does not, and will use the available threads as they become free. We can see that by counting the number of threads that executed each part of the code:  

```julia-repl
julia> function sum_1_to_100_spawn()
           s = zeros(nthreads())
           n = zeros(Int, nthreads())
           @sync for i in 1:100
               @spawn begin
                   sleep_for(i*0.01)
                   s[threadid()] += i
                   n[threadid()] += 1
               end
           end
           return sum(s), n
       end

julia> @time sum_1_to_100_spawn()
  7.171380 seconds (3.87 k allocations: 245.462 KiB, 0.85% compilation time)
(5050.0, [9, 12, 12, 11, 11, 10, 10, 8, 10, 7])
```

Which shows an uneven distribution of tasks per thread, which is different from what `@threads` does:

```julia
julia> function sum_1_to_100_threads()
           s = zeros(nthreads())
           n = zeros(Int, nthreads())
           @threads for i in 1:100
                sleep_for(i*0.01)
                s[threadid()] += i
                n[threadid()] += 1
           end
           return sum(s), n
       end

julia> @time sum_1_to_100_threads()
 12.191271 seconds (10.82 k allocations: 746.766 KiB, 1.40% compilation time)
(5050.0, [10, 10, 10, 10, 10, 10, 10, 10, 10, 10])
```

Now we use the `ChunkSplitters.jl` package to gain more control on what is going on.
First, we make the number of tasks (chunks) independent of the number of threads, by adding a `nchunks` parameter to the function. Second, we allow the function to choose from two types of chunking: `:batch`, in which the chunks are sequential in the range, or `:scatter`, in which the chunks perform alternating tasks: 

```julia-repl
julia> using ChunkSplitters 
       function sum_1_to_100_chunks(;nchunks=nthreads(), chunk_type=:batch)
           s = zeros(nchunks)
           n = zeros(Int, nchunks)
           @threads for (i_range, i_chunk) in chunks(1:100, nchunks, chunk_type)
               for i in i_range
                   sleep_for(i*0.01)
                   s[i_chunk] += i
                   n[i_chunk] += 1
               end
           end
           return sum(s), n
       end
```

First, we run with the `:batch` type of chunk, and we note a similar result as that of base `@threads`:

```julia-repl
julia> @time sum_1_to_100_chunks(;chunk_type=:batch)
 12.254445 seconds (70 allocations: 6.344 KiB)
(5050.0, [10, 10, 10, 10, 10, 10, 10, 10, 10, 10])
```

If, instead, we use the `:scatter` distribution, the time becomes close to that of the `@spawn` option, but with an even number of tasks per thread:

```julia-repl
julia> @time sum_1_to_100_chunks(;chunk_type=:scatter)
  7.763550 seconds (63 allocations: 6.125 KiB)
(5050.0, [10, 10, 10, 10, 10, 10, 10, 10, 10, 10])
```


















