
# Tracking memory allocations

## Manually

A practical way to track memory allocations manually is using:

```julia
a = @allocated begin
    Block to test
end; if a > 0 println(a) end
```
That will print something if the code block allocated something.


## Using the Profiler

To track allocations along the complete code, it is possible to use a
profiler, although this generates so much information that it is
somewhat confusing.

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

```
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



