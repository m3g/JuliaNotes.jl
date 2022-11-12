
# Tracking memory allocations

## Manually

A quick way to test allocations is to use the `@allocated` macro, which 
is available in `Base` Julia. For example:

```julia
a = @allocated begin
    Block to test
end; if a > 0 println(a) end
```
That will print something if the code block allocated something.


## Using TimerOutputs

One practical tool is [TimerOutputs](https://github.com/KristofferC/TimerOutputs.jl). Install it as usual, and use it with, for example:

```julia
using TimerOutputs
const tmr = TimerOutput();
```

In the code, flag the code lines or blocks with the `@timeit` macro. For example:

```julia
struct A
  x
end
function test(n,x)
  @timeit tmr "set y" y = Vector{A}(undef,n)
  @timeit tmr "loop" for i in 1:n
    @timeit tmr "assign y" y[i] = A(i*x)
  end
  y
end
```

Running this function fills the `tmr` object with the time and allocation results:
```julia-repl
julia> test(10,rand());

julia> tmr
 ─────────────────────────────────────────────────────────────────────
                              Time                   Allocations      
                      ──────────────────────   ───────────────────────
   Tot / % measured:        176s / 0.00%            103MiB / 0.00%    

 Section      ncalls     time   %tot     avg     alloc   %tot      avg
 ─────────────────────────────────────────────────────────────────────
 loop              2   8.34μs  72.6%  4.17μs   1.14KiB  78.5%     584B
   assign y       20   3.18μs  27.7%   159ns      320B  21.5%    16.0B
 set y             2   3.15μs  27.4%  1.58μs      320B  21.5%     160B
 ─────────────────────────────────────────────────────────────────────
```

[However](https://discourse.julialang.org/t/track-memory-allocation-not-working-correctly/57543/6), `@timeit` causes some allocations on its own. Therefore, nested calls can cause confusion. This can be verified in the example above. Removing the `"assign y"` check inside the loop results in:

```julia
 ──────────────────────────────────────────────────────────────────
                           Time                   Allocations      
                   ──────────────────────   ───────────────────────
 Tot / % measured:      9.74s / 0.00%           6.00MiB / 0.01%    

 Section   ncalls     time   %tot     avg     alloc   %tot      avg
 ──────────────────────────────────────────────────────────────────
 set y          1   1.29μs  80.6%  1.29μs      160B  50.0%     160B
 loop           1    311ns  19.4%   311ns      160B  50.0%     160B
 ──────────────────────────────────────────────────────────────────
```
Note that now the loop allocates less. Also, this result is consistent now with the `Profile` result shown below.

## Using the Profiler

To track allocations along the complete code, it is possible to use a profiler, although this generates so much information that it is somewhat confusing. [Sometimes](https://discourse.julialang.org/t/track-memory-allocation-not-working-correctly/57543) the output is not clear either, perhaps even wrong. 

For example, consider this is the code (file name here: test.jl):

```julia
struct A
  x
end

function test(n,x)
  y = Vector{A}(undef,n)
  for i in 1:n
    y[i] = A(i*x)
  end
  y
end

```

Run julia with:
```
julia --track-allocation=user
```

Within Julia, do:

```julia
julia> using Profile

julia> include("./test.jl")
test (generic function with 1 method)

julia> test(10,rand()); # gets compiled

julia> Profile.clear_malloc_data() # clear allocations

julia> test(10,rand());

```

Exit Julia, this will generate a file `test.jl.XXX.mem` (extension `.mem`), which, in this case, contains:

```julia
        -
        - struct A
        -   x
        - end
        -
        - function test(n,x)
      160   y = Vector{A}(undef,n)
        0   for i in 1:n
      160     y[i] = A(i*x)
        -   end
        0   y
        - end

```

Where the lines with non-zero numbers are the lines where allocations occur.

More information:
[Disabling allocations](https://discourse.julialang.org/t/disabling-allocations/51028/4)



