
# Benchmarking

## Simple functions

In general, function can be benchmarked with the `BenchmarkTools` package:

```julia
using BenchmarkTools
@btime f($x)

```
or
```
@benchmark f($x)
```

It is important to interpolate the variables of the input function, with the `$`. This is because the macros will then expand the variables into their values on parsing the expression, and the time for that operation does not affect the benchmark anymore.   

The macros `@btime` and `@benchmark` generally sample the execution of the function multiple times. Each sample is composed of many function evaluations, and many samples are performed. Care must be taken if you see times smaller than a few tenths of nano-seconds. You might be being tricked by compiler optimizations. For example,

```julia-repl
julia> function mysum(x,n)
           s = 0
           for i in 1:n
               s += x
           end
           s
       end

julia> @btime mysum(1,10)
  1.750 ns (0 allocations: 0 bytes)
10

julia> @btime mysum(1,10_000_000)
  1.750 ns (0 allocations: 0 bytes)
10000000

```
clearly the second execution is not doing anything more than the first.  The compiler has realized that doing that loop is not optimal and just performs a multiplication.  

## Functions that modify their arguments

Since for each benchmark the function is executed multiple times, things can become tricky if the time required for the execution is dependent on the values of the arguments. These will be changed by the benchmark itself, affecting the outcome.  

For example, the function below receives to vectors, `x` and `n` as parameters, and modifies the two vectors. 

```julia-repl
function f!(x,n)
  n[1] = n[1] + 1
  x[n[1]] = 0
end
```

A normal execution of this function would be:

```julia-repl
julia> n = [1];

julia> x = [1,2];

julia> f!(x,n);

julia> x
2-element Array{Int64,1}:
 1
 0

julia> n
1-element Array{Int64,1}:
 2

```

The function has modified the vectors and, particular, the vector `n` has now the element `2`. If we now execute the same function again, we get an error, because inside the function the element `n[1]` will assume the value of `3`, and the vector `x` only has two positions:

```julia-repl
julia> f!(x,n)
ERROR: BoundsError: attempt to access 2-element Array{Int64,1} at index [3]

```

Therefore, this function cannot be executed twice in a row without redefinding the vector `n` with `n[1]=1`. This creates a difficulty for running bechmarks:

```julia-repl
julia> n = [1];

julia> x = [1,2];

julia> @btime f!(x,n)
ERROR: BoundsError: attempt to access 2-element Array{Int64,1} at index [3]

```

This is the same error as before, since `@btime` tried to execute the function multiple times consecutively. 

To address that, we need to explicitly specify that we need each sample of the benchmark to have a single function evaluation, and that the vectors need to be reinitialized before each sample:

```julia-repl
julia> @btime f!($x,n) setup=(n=[1]) evals=1
  51.000 ns (0 allocations: 0 bytes)
2-element Array{Int64,1}:
 1
 0

```

The `setup` command defines what has to be initialized, and that initialization does not affect the benchmark. The `eval=1` statement defines that each sample will contain a single function evaluation. 

Note that, in this case, the `n` parameter of the function is not interpolated (it does not has the `$`). 

If more than one parameter has to be defined upon initialization, the following syntax is necessary: 

```julia-repl
julia> @btime f!($x,n,m) setup=(n=[1]; m=[3,4,5]) evals=1

```



