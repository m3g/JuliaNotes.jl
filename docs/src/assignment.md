# Assignment and mutation

From: [Assignment and mutation](https://discourse.julialang.org/t/assignment-and-mutation/19119/4?u=leandromartinez98)

The simplest version of this Stephan Karpinksy can come up with is this:

 - Assignment changes which object a name refers to: x = ex causes the name x to refer to the value resulting from the evaluation of the expression ex. Assignment never changes the values of any objects.

 - Mutation changes the value of an object: x[i] = ex and x.f = ex both mutate the object referred to by x changing a value at index or a property with a name, respectively. Mutation never changes what objects any names in any scope refer to.

Perhaps the confusion comes from the fact that these all use the = in their syntax? They’re really totally unrelated. It’s also possible that people think of assignment as setting a named property on some implicit “scope object”. That’s probably a view that can be worked out coherently, in which case having a clear notion of what all the different “scope objects” are would be crucial but I’m not entirely sure if that’s a helpful way to think about the matter or not.

In
[summary](https://discourse.julialang.org/t/julias-assignment-behavior-differs-from-fortran/50389/45?u=leandromartinez98):

```julia
x=[2]  # x points to memory location m1
y=x    # y points to memory location m1
x=[3]  # x points to memory location m2, y still points to m1
z=x    # z points to memory location m2
x[1]=4 # m2 changes value in place, affecting all variables that point there
```


```julia-repl
julia> println(x,y,z)
[4][2][4]

```

### Another way to put it:

That admittedly is confusing at the beginning. One gets used to it, though, and after that one notes that actually there is no way out from that if one wants to have a dynamically typed language.

The fact that the language is dynamic requires that we can do 

```julia
julia> x = [1,2]
2-element Array{Int64,1}:
 1
 2

julia> x = π
π = 3.1415926535897...

```

That is completely natural, but means that `=` is just the binding of a name to a value (which might be an array, or scalar, or whatever). 

Thus, we need to be able to differentiate naming something from mutating something. Mutating is a function that acts on a mutable object. It is the `setindex!` function:

```julia
julia> x = [1,2]
2-element Array{Int64,1}:
 1
 2

julia> setindex!(x,10,1)
2-element Array{Int64,1}:
 10
  2
```

Which, by convenience (obviously) can be called with the notation:

```julia
julia> x[1] = 10
10

```

But this last `x[1] = 10` is a call to `setindex!`, not a name assignment as the other cases. (and a broadcasting of assignments, with `.=`, is just a loop calling `setindex!` for each element)



