# Closures and anonymous functions

Closures are an important part of the Julia syntax, and permeate many of
the codes in Julia. They will appear most commonly with the syntax of anonymous functions.

For example, a simple example of the use of closures is the `findfirst`
function, which returns the element of an array which first matches a
condition:

```julia-repl
julia> x = [ 0, π/4, π/2, π ]
4-element Array{Float64,1}:
 0.0
 0.7853981633974483
 1.5707963267948966
 3.141592653589793

julia> findfirst( x -> sin(x) > 0.5, x )
2
```

The `x -> sin(x) > 0.5` is an anonymous function, which one can read as
"given `x` return `sin(x) > 0.5`", which in this case can be `true` or
`false`. That function, `x -> sin(x) > 0.5` is, therefore, a *callable
object*, which returns different values for each given `x`, much as a
any other function. These *callable objects* are named *closures*. 

## Basic syntax

Consider the following function:

```julia
a = 5
f(x,a) = a*x

```
An anonymous function which, given `x`, returns the result of `f(x,a)`,
is written as

```julia
x -> f(x,a) 
```

The anonymous function can be bound to a variable,
```julia
g = x -> f(x,a)
```

and `g` will be a function that, given `x`, returns `f(x,a)`. This
definition is similar to
```julia
g(x) = f(x,a)
```

Except that in the latter case the label `g` is bound to the function
in definitive:

```julia-repl
julia> g(x) = f(x,a)
g (generic function with 1 method)

julia> g = 2
ERROR: invalid redefinition of constant g
```

While in the former case `g` can be redefined at will, as it is only a
label bound to the address of an anonymous function:

```julia-repl
julia> g = x -> f(x,a)
#1 (generic function with 1 method)

julia> g = 2
2
```

We could, also, use `g = x -> f(x,a,b,c)`, but this option will be less
preferred as it is just a wacky way to write `g(x) = f(x,a,b,c)`.  

Anonymous functions for functions with multiple parameters can also be
defined, with, for example,

```
(x,y) -> f(x,y,a,b,c)
```

## Use case

As exemplified for the `findfirst` function, the most important use for
closures is passing functions as arguments to other functions, in
particular when the function needs additional data to be evaluated.
Consider the following toy example which reproduces a common scenario in
which closures appear:

Let us suppose we have a package which implements a solver for an
optimization problem. That is, the solver receives a function and an
initial point, and returns the minimizer of that function. A typical call
for such a solver would be
```julia
x = solver(f,x0)
```
where `f` is the function to be minimized and `x0` the initial guess.
Within the solver code you will find calls to `f` of the form `f(x)`.

If `f` is a function like `f(x) = x^2 + 2x - 3`, we can just define the
function and call the solver with `f`.  

However, what if `f` depends on data? For example, if `f` was defined
as:
```
f(x,a,b,c) = a*x^2 + b*x + c
```
The solver does not explicitly support calls to `f` with general arguments,
because that would be cumbersome. How can we then call the solver with a
function which will be interpreted by the solver as `f(x)` but actually
*closes over* the parameters `a`, `b`, and `c`? That is what closures
are for.

## Example

For example, lets pretend that our solver only evaluates the function
`f` and returns:

```julia-repl
julia> function solver(f,x)
          y = f(x)
          return y
       end
solver (generic function with 1 method)
```

Some alternative ways to write a closure exist. The most common are:
```julia-repl
julia> g(x) = f(x,a,b,c)
```
In which case one can do, now:
```julia-repl
julia> a = 1; b = 2; c = 3;

julia> x = 5.;

julia> solver(g,x)
38.0

```

Alternatively, one could use an anonymous function:
```julia-repl
julia> solver(x -> f(x,a,b,c),x)
38.0

```

## Scope of variables

In the examples of the previous section, the parameters `a`, `b`, and
`c` of the function `f` were defined in the global scope will cause
type-instability problems. In the definition of the closure as 
```julia
g(x) = f(x,a,b,c)

```
this is quite evident, as `g` does not receive the parameters as
arguments (the purpose of the closure was that) and thus `g` is using
those parameters from the global scope.

Using the anonymous functions the scope of the parameters is the same,
even if this is less evident. In
```julia
solver(x -> f(x,a,b,c), x) 

```
the anonymous function `x -> f(x,a,b,c)` was parsed at the *calling*
scope, not at the scope of the solver. Therefore, except for not having
a name, it behaves exactly as the former `g(x)`, thus the parameters are
non-constant globals and will introduce type instabilities and
performance penalties.  

The parameters of the closure have to be, therefore, made constant for
the code to be type-stable and performant. This can be done by declaring
them as constant,
```julia-repl
julia> const a, b, c = 1, 2, 3;

julia> solver(x -> f(x,a,b,c), x)
38.0

```
or wrapping the call to the solver in a function that receives the data
as parameters, in which case the
scope of the data will be the scope of the calling function of the
solver, not the global scope:
```julia-repl
julia> function h(x,a,b,c) 
         return solver(x -> f(x,a,b,c),x)
       end
h (generic function with 1 method)

julia> h(x,a,b,c)
38.0

```
(one could have written `h(x,a,b,c) = solver(x->f(x,a,b,c),x)`, but the
syntax above is more explicit in the fact that `h` has its own scope of
variables). 

# Take away

Passing functions as argument to other functions, in particular if the
evaluation of data is required, is practical with the use of closures.
This occurs very frequently in the context of calls to solvers, but very
frequently also in the Julia base language, for example in the search
and sorting, functions, among many others. One has to keep in mind that
the closures are parsed at the calling scope, such that critical code
for performance must always be wrapped into functions, to guarantee the
constant types of the parameters. Let us just reinforce this point with
an example.

# Example of type-instability 

Let us write a function that operates on a vector, returning a some
"potential energy" associated to some computation on pair of elements
of the vector:

```julia-repl
julia> function u(f,x)
         u = 0.
         for i in 1:length(x)-1
            for j in i+1:length(x)
              u += f(x[i],x[j])
            end
         end
         u
       end
u (generic function with 1 method)

```

Let use define `f` as 

```julia-repl
julia> f(x,y,a,b) = a*x - b*y
f (generic function with 1 method)

```

And we will use a closure to pass the tuple `(x,y)` to `f(x,y,a,b)`,
inside `u`: 

```julia-repl
julia> a = 5; b = 7;

julia> u( (x,y) -> f(x,y,a,b), x )
-567899.3283195692

```

An analysis of the stability of the types will indicate
type-instabilities, associated with the global scope of the parameters
`a` and `b`: 

```julia-repl
julia> @code_warntype u( (x,y) -> f(x,y,a,b), x )
Variables
  #self#::Core.Compiler.Const(u, false)
...
  x::Array{Float64,1}
  u::Any
  @_5::Union{Nothing, Tuple{Int64,Int64}}
...
Body::Any
1 ─       (u = 0.0)
...
│   %22 = u::Any
│   %23 = Base.getindex(x, i)::Float64
│   %24 = Base.getindex(x, j)::Float64
│   %25 = (f)(%23, %24)::Any
│         (u = %22 + %25)
...

```

If, alternatively, one defines an enclosing function for the call to the
energy function,

```julia-repl
julia> h(x,a,b) =  u( (x,y) -> f(x,y,a,b), x )
h (generic function with 1 method)

```

The type-instabilities are resolved, because the scope in which the
closure is parsed is now the local scope of `h` and, thus, all variables
have constant types:  

```julia-repl
julia> @code_warntype h(x,a,b)
Variables
  #self#::Core.Compiler.Const(h, false)
  x::Array{Float64,1}
  a::Int64
  b::Int64
  #18::var"#18#19"{Int64,Int64}

Body::Float64
1 ─ %1 = Main.:(var"#18#19")::Core.Compiler.Const(var"#18#19", false)
│   %2 = Core.typeof(a)::Core.Compiler.Const(Int64, false)
│   %3 = Core.typeof(b)::Core.Compiler.Const(Int64, false)
│   %4 = Core.apply_type(%1, %2, %3)::Core.Compiler.Const(var"#18#19"{Int64,Int64}, false)
│        (#18 = %new(%4, a, b))
│   %6 = #18::var"#18#19"{Int64,Int64}
│   %7 = Main.u(%6, x)::Float64
└──      return %7

```

In this simple example you won't see any measurable performance penalty associated
to this type-instability, but certainly that can arise in other
examples. 








 



