
# ERROR: MethodError: no method matching....

This is a common error message, which is related to one of the most fundamental characteristics of the Julia language: multiple dispatch.  Multiple dispatch is the specialization of a function to every one of its arguments.  

For example, if we define the following function:

```julia-repl
julia> f(x,y) = 2*x + y
f (generic function with 1 method)
```

We have a function that can receive different types of variables (such as scalar integers or floats, or vectors, etc.). This function will be specialized for each type of variables on input. The `@code_typed` macro displays what the codes becomes after the type-specialization of the variables. For example, with integers, we have:

```julia-repl
julia> @code_typed f(1,1)
CodeInfo(
1 ─ %1 = Base.mul_int(2, x)::Int64
│   %2 = Base.add_int(%1, y)::Int64
└──      return %2
) => Int64
```

Note that the function calls `Base.mul_int` and `Base.add_int`, which are specialized functions to multiply and add integer numbers. 

If we call the same function with real numbers, we have, first a conversion of the number `2` from integer to float, and then specialized functions are called to multiply and add these floating point numbers:

```julia-repl
julia> @code_typed f(1.0,1.0)
CodeInfo(
1 ─ %1 = Base.sitofp(Float64, 2)::Float64
│   %2 = Base.mul_float(%1, x)::Float64
│   %3 = Base.add_float(%2, y)::Float64
└──      return %3
) => Float64
```

Therefore, the code of `f(x,y)` was specialized, at execution time, to different types of variables, and will produce fast compiled versions of the code in each case. 

We can define functions for which we restrict the types of variables accepted. For example, let us define a function that only accepts numbers, but not vectors:

```julia-repl
julia> g(x::Number,y::Number) = 2*x + y
g (generic function with 1 method)

julia> g(1,1)
3

julia> g(1.0,1.0)
3.0

```
For now the function is exactly the same as the previous `f(x,y)`.

The function `f(x,y)` could, however, accept vectors as parameters:

```julia-repl
julia> x = [1,1]; y = [2,2];

julia> f(x,y)
2-element Array{Int64,1}:
 4
 4

```

However, `g(x,y)` is called with vectors as arguments, we now have an error:    


```julia-repl
julia> g(x,y)
ERROR: MethodError: no method matching g(::Array{Int64,1}, ::Array{Int64,1})
Stacktrace:
 [1] top-level scope at REPL[9]:1

```

The error is quite explicit: there is no definition of the function `g` which is intended to accept arrays as parameters.   

Therefore, if you got one error of this type in your program, that means that some function is being call with the wrong arguments. That might mean the argument of the incorrect type, or the wrong number of arguments. For example:

```julia-repl
julia> f(x)
ERROR: MethodError: no method matching f(::Array{Int64,1})
Closest candidates are:
  f(::Any, ::Any) at REPL[1]:1
Stacktrace:
 [1] top-level scope at REPL[10]:1

```

Debug your code to find where this error occurs, and check each parameter being fed to the function. Compare it with the definitions of the methods of that function, if necessary. The methods of a function can be listed, for example, with:

```julia-repl
julia> methods(g)
# 1 method for generic function "g":
[1] g(x::Number, y::Number) in Main at REPL[4]:1

```

Why, then, one would restrict the type of variable a function can receive? There are two reasons for that: 1) Make the code clearer to the user, by specifying the type of variable that a function is expected to receive and 2) Anticipate an error.  For example, the function `f` can receive two vectors because the sum of two vectors is well defined.  However, the sum of a vector with a scalar is not. Therefore,

```julia-repl
julia> x = [1,1]; y = 2;

julia> f(x,y)
ERROR: MethodError: no method matching +(::Array{Int64,1}, ::Int64)
For element-wise addition, use broadcasting with dot syntax: array .+
scalar

```
We get a method error here because the sum of a scalar with an array is not defined. We could have anticipated that error in our function by accepting only numbers (as in our definition of `g`), only vectors, or, more interestingly, only elements of the same type:

```julia-repl
julia> h(x::T, y::T) where T = 2*x + y
h (generic function with 1 method)

```
Now `T` is a parametric type, and we only require that `x` and `y` are
of the same type `T`. Now, we have:

```julia-repl
julia> h(1,1)
3

julia> x = [1,1]; y = [2,2];

julia> h(x,y)
2-element Array{Int64,1}:
 4
 4

julia> x = [1,1]; y = 2;

julia> h(x,y)
ERROR: MethodError: no method matching h(::Array{Int64,1}, ::Int64)

```

We only get an error if the two types are different, in which case the addition is not defined. And the error occurs not in the call to the `+` function, as with the function `f`, but in the call to `h`, anticipating the error and, perhaps, facilitating the debugging of the program. 

Alternativelly, we could have defined a new method to the function `g`, accepting only vectors:

```julia-repl
julia> g(x::Vector, y::Vector) = 2*x + y
g (generic function with 2 methods)

```

Note that `g` has now *two* methods:

```julia-repl
julia> methods(g)
# 2 methods for generic function "g":
[1] g(x::Number, y::Number) in Main at REPL[4]:1
[2] g(x::Array{T,1} where T, y::Array{T,1} where T) in Main at
REPL[21]:1

```

One of these methods only accepts scalars, the other only accepts arrays. The most specific method for the type of variable being provided to the function will be used. This can be seen, for example, with the function `f`. Currently, it has only one method without any type specification:  

```julia-repl
julia> methods(f)
# 1 method for generic function "f":
[1] f(x, y) in Main at REPL[1]:1

```

Of course the function `f` cannot receive strings. However, we can define a new method for `f` which does receive strings:  

```julia-repl
julia> f(x::String, y::String) = "$x $x $y"
f (generic function with 2 methods)

julia> f("abc","def")
"abc abc def"

```

We defined a method for `f` which does more or less what one would expect from `2x + y` with strings, and this method is now invoked if `f` receives two strings as input, despite the other method being completely general. That is, the most specific method was invoked. 

More interestingly, we can define a method for `f` which actually performs what one could expect from the syntax associated to the addition of a vector and a scalar (which, if meaning anything, probably should mean summing the scalar to every element of the vector):

```julia-repl
julia> f(x::Vector, y::Number) = 2*x .+ y
f (generic function with 3 methods)

julia> x = [1,1]; y=2
2

julia> f(x,y)
2-element Array{Int64,1}:
 4
 4

```

Note the `.` in the definition of the sum, which is the `broadcast` operator, which implies that the sum will be performed for every element of `x`. 

Of course, it is always recommended to define methods that perform conceptually the same thing, but with different types of variables, for the same function.  
