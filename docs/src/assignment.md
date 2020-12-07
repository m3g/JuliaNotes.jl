# Assignment and mutation

From: [Assignment and mutation](https://discourse.julialang.org/t/assignment-and-mutation/19119/4?u=leandromartinez98)

The simplest version of this Stephan Karpinksy can come up with is this:

 - Assignment changes which object a name refers to: x = ex causes the
   name x to refer to the value resulting from the evaluation of the
   expression ex. Assignment never changes the values of any objects.

 - Mutation changes the value of an object: x[i] = ex and x.f = ex both
   mutate the object referred to by x changing a value at index or a
   property with a name, respectively. Mutation never changes what objects
   any names in any scope refer to.

Perhaps the confusion comes from the fact that these all use the = in
their syntax? They’re really totally unrelated. It’s also possible that
people think of assignment as setting a named property on some implicit
“scope object”. That’s probably a view that can be worked out
coherently, in which case having a clear notion of what all the
different “scope objects” are would be crucial but I’m not entirely sure
if that’s a helpful way to think about the matter or not.

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



