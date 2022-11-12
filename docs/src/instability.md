
# Type instability and performance

To obtain a performant code it is important that the types of the variables can be inferred by the compiler. If a variable can change type in an unpredictable manner, we say that there is a *type instability*.

Type instabilities generally occur when we try to use global variables inside functions, that is, without passing these variables as parameters to the functions. Lets explain that. 

A global variable is anything defined in the *global scope*, that is outside any function or other structure that defines a scope (`let` blocks, for example). We obtain a global variable when writing, in the REPL, 
```julia-repl
julia> x = 5. 
```

or when we write in a script the same thing:
```
more script.jl
```
```julia
x = 5.
```

A variable defined in this way is type unstable because you can change its value at any time to anything. For example,

```julia-repl
julia> x = 5.
5.0

julia> x = "ABC"
"ABC"

```

Now, we will define a function that uses the value of `x` without passing `x` as a parameter. This function will sum up the elements of `x`:

```julia-repl
julia> function f()
          s = 0
          for val in x
            s = s + val
          end
          return s
       end
f (generic function with 1 method)

```

This function cannot be specialized for the type of variable that `x` is, because, as we have mentioned, `x` could be any type of variable.  This problem can be tracked with the macro `@code_warntype`: 

```julia-repl
julia> @code_warntype f()
Variables
  #self#::Core.Compiler.Const(f, false)
  s::Any
  @_3::Any
  val::Any

Body::Any
1 ─       (s = 0.0)
│   %2  = Main.x::Any
│         (@_3 = Base.iterate(%2))
│   %4  = (@_3 === nothing)::Bool
│   %5  = Base.not_int(%4)::Bool
└──       goto #4 if not %5
2 ┄ %7  = @_3::Any
│         (val = Core.getfield(%7, 1))
│   %9  = Core.getfield(%7, 2)::Any
│         (s = s + val)
│         (@_3 = Base.iterate(%2, %9))
│   %12 = (@_3 === nothing)::Bool
│   %13 = Base.not_int(%12)::Bool
└──       goto #4 if not %13
3 ─       goto #2
4 ┄       return s


```

Note that there are many `Any` in the code above, which will be highlighted in red if you run these commands in your REPL. That indicates that something is not quite right. In particular, note the line `Body::Any`: it indicates that the result of the body of that function can be of any type, in principle.    

Let us check how this function performs. We will define `x` as a vector of many components such that the time of `f(x)` is measured accurately:

```julia-repl
julia> x = rand(1000);

julia> @btime f()
  60.148 μs (3490 allocations: 70.16 KiB)
492.360646736646

```

Now, we will define a new function that receives `x` as a parameter, and besides that does exactly the same thing:

```julia-repl
julia> function g(x)
         s = zero(eltype(x))
         for val in x
           s = s + val
         end
         return s
       end

```

In this example we were obsessive by initializing `s` as `zero(eltype(x))`, which indicates that `s` is a zero of the same type of the elements of `x`. That is, if `x` is a vector of integer numbers, `s` will be `0` (integer), and if `x` is a vector of real numbers, `s` will be `0.` (real). This is not fundamental for the performance here tested, but it will eliminate all possible types of instability of the variables within that code.  

Now, if we call `g(x)` with a `x` of a specific type, that will create a `method` of that function specialized for this type of variable. For example, if we call `g` with the number `1`, which is an integer number, all operations in `g` will be performed with integers:


```julia-repl
julia> @code_warntype g(1)
Variables
  #self#::Core.Compiler.Const(g, false)
  x::Int64
  s::Int64
  @_4::Union{Nothing, Tuple{Int64,Nothing}}
  val::Int64

Body::Int64
1 ─       (s = 0)
│   %2  = x::Int64
│         (@_4 = Base.iterate(%2))
│   %4  = (@_4::Tuple{Int64,Nothing} === nothing)::Core.Compiler.Const(false, false)
│   %5  = Base.not_int(%4)::Core.Compiler.Const(true, false)
└──       goto #4 if not %5
2 ─ %7  = @_4::Tuple{Int64,Nothing}::Tuple{Int64,Nothing}
│         (val = Core.getfield(%7, 1))
│   %9  = Core.getfield(%7, 2)::Core.Compiler.Const(nothing, false)
│         (s = s::Core.Compiler.Const(0, false) + val)
│         (@_4 = Base.iterate(%2, %9))
│   %12 = (@_4::Core.Compiler.Const(nothing, false) === nothing)::Core.Compiler.Const(true, false)
│   %13 = Base.not_int(%12)::Core.Compiler.Const(false, false)
└──       goto #4 if not %13
3 ─       Core.Compiler.Const(:(goto %7), false)
4 ┄       return s

```

Note that there is no `Any` remaiing in the above code and that, in particular, the result of the body of the code is guaranteed to be an integer `Body::Int64`. 

If we call the same function with the number `3.14`, which is real, another method is generated:

```julia-repl
julia> @code_warntype g(3.14)
Variables
  #self#::Core.Compiler.Const(g, false)
  x::Float64
  s::Float64
  @_4::Union{Nothing, Tuple{Float64,Nothing}}
  val::Float64

Body::Float64
1 ─       (s = 0)
│   %2  = x::Float64
│         (@_4 = Base.iterate(%2))
│   %4  = (@_4::Tuple{Float64,Nothing} === nothing)::Core.Compiler.Const(false, false)
│   %5  = Base.not_int(%4)::Core.Compiler.Const(true, false)
└──       goto #4 if not %5
2 ─ %7  = @_4::Tuple{Float64,Nothing}::Tuple{Float64,Nothing}
│         (val = Core.getfield(%7, 1))
│   %9  = Core.getfield(%7, 2)::Core.Compiler.Const(nothing, false)
│         (s = s::Core.Compiler.Const(0, false) + val)
│         (@_4 = Base.iterate(%2, %9))
│   %12 = (@_4::Core.Compiler.Const(nothing, false) === nothing)::Core.Compiler.Const(true, false)
│   %13 = Base.not_int(%12)::Core.Compiler.Const(false, false)
└──       goto #4 if not %13
3 ─       Core.Compiler.Const(:(goto %7), false)
4 ┄       return s::Float64

```

Now all types of the function are `Float64` and the function is guaranteed to return that type of number.

This specialization was not possible when `x` was not a parameter of the function, because the *method* had to deal with any type of variables.

How the performance of these methods compare with the previous implementation that had type instabilities? Let us see:

```julia-repl
julia> x = rand(1000);

julia> @btime f()
  59.518 μs (3490 allocations: 70.16 KiB)
504.23960342930764

julia> @btime g($x)
  965.300 ns (0 allocations: 0 bytes)
504.23960342930764

```

The function `g` is about 60 times faster than `f` and, furthermore, does not allocate any memory. 

To guarantee that function are type-stable, therefore, is one of the most important things in the generation of fast code.

Global variables, therefore, must be avoided inside functions. They must be passed as parameters such that specialized methods can be built. 

Sometimes, however, the values are constants. For example, $\pi$. It would be strange to have to pass $\pi$ as a parameter to every function that uses it. Thus, $\pi$ is a constant-global, and being a constant it does not introduce type-instabilities. Custom constant global are defined with the `const` keyword, and solve the performance issue of the function `f` above.

```julia
julia> const x = rand(1000);

julia> @btime f()
  963.300 ns (0 allocations: 0 bytes)
504.11877716593017

```

Yet, in this case calling the variable `x` a constant is artificial, and in this particular case the function `f` only computes the sum of the elements of that particular `x` from now on. Thus, it is much more reasonable to pass `x` as a parameter, and let the constants be used for actual constant values, as $\pi$.         

