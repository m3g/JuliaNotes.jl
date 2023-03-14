# Immutable, mutable and allocations 

In Julia there are mutable and immutable values (variables), and this distinction and implications are not always obvious depending on the previous programming experience. 

For instance, having past experience with Fortran, this distinction was a novelty for me. In Fortran one declares every variable, and at the moment of declaring one has the impresion of having reserved a place in the memory for that variable, even with scalar one does that. Along the Fortran code, when a different value is assigned to the label assigned to the variable, the value changes, and that can be quite simply interpreted as if the value stored in the memory position which was reserved for that variable changed. 

In Julia (and many other higher-level languages, in particular), one has to understand the difference between mutable and imutable values. The reason, from a user perspective, derives from many features of high level languages. For instance, consider the code:
```julia-repl
julia> x = 1
1

julia> x = [1, 2]
2-element Vector{Int64}:
 1
 2
```

In a statically typed language, `x` would assume the value of an `Int` in the first assignment, and one would not be able to assign that label, `x`, to a different type of value, a vector of integers, in this case. The flexibility of a dynamic language requires **labels**, like `x` here, be only that, labels assigned to values. Then, one has to understand the properties of the values, in this case either the integer number `1` or the vector `[1,2]`. 

The number `1` is an immutable value. That is, we cannot convert it into something else. In some sense that's natural. What is less natural, then, a sequence of code like this:
```julia
x = 1
x = 2
```
does not mean mutating the variable `x`, but simply assigning the label `x` to a different immutable value. The implications of this are important. For instance, consider the function `f` and its application below:
```julia-repl
julia> function f(x)
           x = x + 1
           return x
       end;

julia> x = 1
1

julia> f(x)
2

julia> x
1
```

From the structure of the function, one would be tempted to interpret that `x` was mutated inside it, and thus that the value of `x` after the application of the function would have changed. It does not, though, and this can be confusing. In this case, the point is that what was passed to the function was the *value* `1`, an immutable value, and within `f` initially the label `x` was assigned to it. 

Next, the label `x` was reassined, to the result of the value of the input `x` (`1`), plus one, and the *value* `2` was returned. The label `x` of the outer scope was simply unchanged, and continued to be assigned to the value `1`. 

This is quite different from the following code snipet:
```julia-repl
julia> function g(x)
           x[1] = 0
           return x
       end;

julia> x = [1,2]
2-element Vector{Int64}:
 1
 2

julia> g(x)
2-element Vector{Int64}:
 0
 2

julia> x
2-element Vector{Int64}:
 0
 2
```
The most fundamental difference here is that `x`, as a vector, is now a *mutable* value. That has an implication on how it is generally stored in the memory: it has an address. What is passed to the function is the address of the vector in memory. Inside `g` the vector is mutated, and the array is returned, meaning that its address in memory is returned. One can effectivelly assign a new label to the returned value:
```julia-repl
julia> x = [1,2];

julia> y = g(x);

julia> y
2-element Vector{Int64}:
 0
 2

julia> x
2-element Vector{Int64}:
 0
 2

julia> y === x
true
```
with the last line confirming that `x` and `y` are just two different labels assigned to the exact same object. 















The mutable vs. immutable thing, from the perspective of a previous Fortran user: In Fortran everything seems to have its place in memory, as I said, and everything seems to be mutable, although that might not be true in practice. Thus, there is an abstraction layer there that must be overcome. I hope what I say in what follows is not too wrong. 

One learns in this process that values can "exist" in different ways. A variable may occupy a place in one type of memory, the type of memory that we understood that existed, which is called the "heap". The variables in the heap have an address to the position in memory they occupy and, thus, the value that they assume can be changed, by modifying the content of that position in the memory. This is where mutable variables are stored.

In Fortran, from a user perspective, everything seems to be in the "heap" (although that might not be true, the compiler will decide that), in such a way that one can program as if every variable had an address in memory and its value can be modified by modifying the content of that position in the memory. Thus, everything seems to be mutable in Fortran.  Additionally, labels are assigned forever to the same positions in memory.

Now we learn that some variables might exist in other types of memory, the "stack" and (I guess) the processor cache. These types of memory are much faster than the "heap" to work with, and if a variable can be assigned to these places your code will be faster. However, the values occupying these types of memory positions do not have an address in the usual sense. You cannot change the value associated to that position in memory because that value in that position in memory is not persistent, that is, it will be discarded as soon as possible. Even if the value will be used later, it might be that it is copied somewhere else in the stack without our knowledge if that results to be the best strategy for performance. We do not control where these values are stored and, then, we cannot assign different values for these variables, because this actually does not make sense, they are only values stored somewhere in a fast access memory.

Thus we learn that in a loop like:
```julia
s = 0.
for i in 1:3
   x = 2*i
   s = s + x
end
```

`x` might not be allocated in memory at all. It might occupy a temporary place in the fast stack memory or, even, only in the processor cache. In general we don't know what is going on with `x`, and we should not care about that, the people that implemented the compilers are much smarter than us and implemented most likely the best choice. Perhaps it will be stored in the slow "heap" memory, with an address, particularly if it was a huge array instead of a simple scalar, but it doesn't mater. (in this case probably it is just inlined, but the idea is the same)

A Fortran user is surprised that a loop like that does not *allocate* anything. We learn that everything has its place in memory, even the counter of the loop, so that code should at least allocate some values.  Yet, now we discover that these allocations "do not count", because are fast allocations in these non-addressed types of memory.

But we have to learn that for the compiler have freedom to choose what to do with `x`, the content of `x` cannot change. Thus, it must be immutable. In the loop above, it doesn't even make sense calling `x` the *same* variable at each loop iteration. It is just a temporary value assigned to some fast memory position that will be used and discarded. 

Therefore, if we write
```julia
x = 1 
x = 2
```
the two `x` are probably just two completely independent values stored in these fast memories. Both the "first x" and the "second x" are immutable. Actually what is immutable is the Integer values 1 and 2, and `x` is only a temporary label to one or other of this values. The first `x` will be discarded when convenient without we knowing where it was stored, if it was stored at all. 

Yet, if we write
```julia
x = Vector{Int}(undef,1)
x[1] = 1
x[1] = 2
```
we are assuming that for some reason you want to access the same position in memory repeatedly, and this must be stored in the slower heap memory, where things have real addresses. This `x` is a mutable object, you can actually change the content associated with the position it occupies in memory explicitly. 

Later we learn that vectors can also be immutable (why not? If a number can be stored in these fast memories, why not a bunch of numbers?). And we can use StaticArrays where small vectors behave the same as any other immutable value, like a number. This means that:

```julia
julia> function f()
         s = 0.
         for i in 1:1000
           x = SVector{3,Float64}(i, sqrt(i), i^2)
           for j in 1:3
             s = s + x[j]
           end
         end
         s
       end
f (generic function with 1 method)

julia> f()
3.343550974558874e8

julia> @allocated f()
0

```

Wait, that function that generates 1000 vectors of dimension 3 does not *allocate* anything? Yet it doesn't, because these static arrays are immutable, so they only exist in the fast memory positions which are temporary. Knowing this allows a bunch of code optimizations which are very cool, and a very pretty syntax if you are dealing with particle simulations. For instance, you can do:

```julia
julia> x = [ SVector{3,Float64}(1,1,1) for i in 1:3 ]; # positions of 3 particles

julia> function update_positions!(x)
         for i in 1:length(x)
           y = 2*x[i] # whatever needed
           x[i] = y 
         end
       end
update_positions! (generic function with 1 method)

julia> update_positions!(x)

julia> x
10-element Array{SArray{Tuple{3},Float64,1,3},1}:
 [2.0, 2.0, 2.0]
 [2.0, 2.0, 2.0]
 [2.0, 2.0, 2.0]

julia> @allocated update_positions!(x)
0
```

The `update_positions!` function is mutating the *elements* of `x` (`x` is mutable), but the elements of `x` are themselves immutable static vectors. This is, the line `y = 2*x[i]` is just creating a new static vector, and `x[i] = y` is not actually modifying the values of the positions in memory of the elements of `x[i]` as we would think (or it might be, that is just not your problem), and all that does not involve any access to the slow *heap*  memory of the computer. Thus you can deal with a vector as fast you can deal with a scalar. 

The possibilities to improve the performance of a numerical code increase. I have been able to write faster codes in Julia than in Fortran now, but that depends on some adaptation with that new way of thinking and with the new possibilities involved.

Just to add one thing. There is nothing mysterious about StaticArrays.  They are convenient immutable structures, which you could have defined yourself, with the same allocation results:

```julia
julia> struct P
         x :: Float64
         y :: Float64
         z :: Float64
       end

julia> function update_positions!(x)
         for i in 1:length(x)
           y = P( 2*x[i].x, 2*x[i].y, 2*x[i].z )
           x[i] = y   
         end
       end
update_positions! (generic function with 1 method)

julia> x = [ P(1.0,1.0,1.0) for i in 1:100 ];

julia> update_positions!(x);

julia> @allocated update_positions!(x)
0

```

Further information:
[Fortran compilers](https://discourse.julialang.org/t/julias-assignment-behavior-differs-from-fortran/50389/49?u=leandromartinez98)



