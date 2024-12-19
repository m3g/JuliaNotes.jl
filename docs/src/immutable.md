# Immutable and mutable variables

## Immutability and mutability

In Julia there are mutable and immutable values (variables), and this distinction and implications are not always obvious depending on one's previous programming experience. 

For instance, having past experience with Fortran, this distinction was a novelty for me. In Fortran one declares every variable, and at the moment of declaring one has the impresion of having reserved a place in the memory for that variable, even with scalar one does that. Along the Fortran code, when a different value is assigned to the label assigned to the variable, the value changes, and that can be quite simply interpreted as if the value stored in the memory position which was reserved for that variable changed. 

From a Fortran user perspective, this result, for example, is quite astonishing:
```julia-repl
julia> function add_one(x)
           x = x + 1
           return x
       end;

julia> x = 1
1

julia> add_one(x)
2

julia> x
1
```
That codes appears to be mutating the value associated to the variable `x` but, nevertheless, the value of `x` is the outer scope does not change. 

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
does not mean mutating the variable `x`, but simply assigning the label `x` to a different immutable value. 

The implications of this are important, as was shown in the `add_one` function above.
From the structure of the function, one would be tempted to interpret that `x` was mutated inside it, and thus that the value of `x` after the application of the function would have changed. It does not, though, and this can be confusing. In this case, the point is that what was passed to the function was the *value* `1`, an immutable value, and within `add_one` initially the label `x` was assigned to it. 

Next, in the line 
```julia
x = x + 1
```
the label `x` was reassigned, to the result of the value of the input `x` (`1`), plus one, and the *value* `2` was returned. The label `x` of the outer scope was simply unchanged, and continued to be assigned to the value `1`. 

If we wanted to assign the label `x` of the outer scope of the function to the output of `add_one`, we would need to do that explicitly:
```julia
x = add_one(x)
```

Those considerations become initially more confusing when one sees the following code snippet:
```julia-repl
julia> function add_one(x::Vector{Int})
           x[1] = x[1] + 1 
           return x
       end;

julia> x = [1,2]
2-element Vector{Int64}:
 1
 2

julia> add_one(x)
2-element Vector{Int64}:
 2
 2

julia> x
2-element Vector{Int64}:
 2
 2
```
The most fundamental difference here is that `x`, as a `Vector{Int}`, that is, a vector of integers. That vector is *mutable*. That has an implication on how it is generally stored in the memory: it has an address. What is passed to the function is the address of the vector in memory. Inside `add_one` the vector is mutated, and the array is returned, meaning that its address in memory is returned. One can effectivelly assign a new label to the returned value:
```julia-repl
julia> x = [1,2];

julia> y = add_one(x);

julia> y
2-element Vector{Int64}:
 2
 2

julia> x
2-element Vector{Int64}:
 2
 2

julia> y === x
true
```
And the last line, comparing `y` and `x` with `===` confirms that these two labels are assigned to the exact same object.

## Heap and Stack memory

The distinction between mutable and immutable objects have important distinctions when it comes to performance. These distinctions are associated to the assumptions that the compiler can make about the behavior of these variables and, thus, about how they can be stored in the memory.

In particular, there are two major ways in which values (numbers, objects, arrays), can be stored in memory: in the *heap* or in the *stack*. Very roughly, the *heap* is the most flexible form of storing objects, and probably the one that maps more clearly into our naive intuitions about how memory works. In the *heap* the objects have addresses, which point to the actual positions in the memory where the objects are located. For example, 
```julia
x = [1,2]
```
is an array with that (normally) has an address in the *heap* memory, pointing to where the array starts. When we mutate one element of this array, we explicitly change the bit content at the physical memory position where the array is stored. This is fine, but it is **slow**, there are too many indirections in this process.

In the *stack* memory, the objects, and values, have a more loose sense. The stack, although physically the same, is a bunch of continuous memory reserved to be used by a program in an efficient manner. In particular, Fortran codes that do not use manual memory allocation will reserve all the memory required for the code in the *stack*. A continuous block of memory is reserved, and thus the accesses to the memory is fast, except that it brings some limitations in the use of the available computer memory (*stack overflow* errors are pretty common in old Fortran code).

The stack memory can be used very efficiently, in particular because the processor can directly access the values without the indirection associated to the address of those values. A function can write data to the *stack* memory quickly, at the end of the last used position (piling the data), use the memory, and finally just release the memory by informing the system the limits of that memory block used. In summary, this is fast, and as much as possible one would want that the *stack* model of memory is used for critical operations instead of heap memory. 

## Relation to mutability and immutability

This properties of memory management become somewhat linked to the mutability and immutability of variables in Julia. This is not a strict relation (as we will see), but it is rule of thumb that is important in the design of fast Julia code: 

- In general, new *mutable* values are stored in the *heap*, and new *immutable* values are stored in the *stack*. 

One reason for this behavior is that mutable values, in particular most arrays, can change in size. If they can change in size, significant memory rearrangements cannot be ruled out by the compiler, and thus the array storage starts with an address (a pointer), which can be adjusted if the content of the array has to be moved from one physical position in the memory to another position. For that the program has to request a memory space to the system, which takes time. This is all *heap*  memory flexibility in action.

On the other side, immutable values have a fixed memory size, and thus the compiler can reserve a block of memory for the value in the *stack*, use it, and release it when the lifetime of the object is over. Still more flexibility and optimizations are possible since the specific reserved block can be discarded in favor of a new *stack* allocation if that turns out to be the most efficient strategy for the specific set of operations in hand. 

For example, in our `add_one` function, slightly modified here for clarifying the argument:
```julia
function add_one(x::Int)
    y = x + 1
    return y
end
```
there are two values involved. The immutable input value of `x`, and the also immutable value of `y` resulting from adding one to the input value.

Naively, one would could think that `y` requires a new position in memory, with a new address. Yet, this value of known bit size can be stored in the *stack* (in such a simple example the memory used can be even a processor cache, which is even faster), making the operation must faster than if we explicitly required a new memory place with an address bound. We can emulate requiring a new memory address for the `y` value with this code:
```julia
function add_one_allocate(x)
    y = [ x + 1 ]
    return y
end
```
In this example, `y` will be returned as a `Vector{Int}`, with a single element equal to `x + 1`. Let us see how these functions perform:
```julia-repl
julia> @btime add_one(1)
  0.880 ns (0 allocations: 0 bytes)
2

julia> @btime add_one_allocate(1)
  15.060 ns (1 allocation: 64 bytes)
1-element Vector{Int64}:
 2
```
Not only creating `y` in the second case "counts" as an allocation (because it is a *heap* allocation), but the code is much, much slower. This is "correct", and necessary here, since the compiler cannot know if `y` will be resized thereafter, such that it has to create a *heap* address to the object and request system memory for that. It cannot guarantee that `y` will fit the *stack*, which it can for immutable value resulting from the first function.  

Thus, it is a general rule-of-thumb that working with immutable values is faster than with mutable ones, particularly in what concerns creating those values in intermediate computation states, where the values can be eventually discarded.

## Static arrays 

The main property of immutable values is their fixed size. Thus, it is possible to perform fast computations with arrays if they are also fixed in size. The `StaticArrays` package brings this feature to Julia.

In many senses, a static array is no different from any other specific type of number, `Int`, `Float64`, for examples. Its representation in memory is a continuous block of memory of fixed size, except that it may contain more "numbers" (or other values). 

Static arrays allow programming patterns like this:
```julia-repl
julia> function f()
           s = 0.
           for i in 1:1000
               x = SVector{3,Float64}(i, sqrt(i), i^2)
               for j in 1:3
                   s = s + x[j]
               end
           end
           s
       end;

julia> @btime f()
  2.601 μs (0 allocations: 0 bytes)
3.343550974558874e8
```
Wait, that function that generates 1000 vectors of dimension 3 does not *allocate* anything? Yet it doesn't, because these static arrays have fixed size, so they only exist in the fast memory positions which are temporary. Knowing this allows a bunch of code optimizations which are very cool, and a very pretty syntax if you are dealing with particle simulations. For instance, you can do:
```julia-repl
julia> x = [ SVector{3,Float64}(1,1,1) for i in 1:3 ]; # positions of 3 particles

julia> function update_positions!(x)
           for i in eachindex(x)
               y = 2*x[i] # whatever needed
               x[i] = y 
           end
       end;

julia> update_positions!(x)

julia> x
10-element Array{SArray{Tuple{3},Float64,1,3},1}:
 [2.0, 2.0, 2.0]
 [2.0, 2.0, 2.0]
 [2.0, 2.0, 2.0]

julia> @allocated update_positions!(x)
0
```
Thus, even if we need to create temporary intermediate arrays, this can be done quickly, without *heap* allocations, and with a syntax that resembles the arithmetics of vectors very naturally. As an additional advantage, the function above functions just as well if the input `x` array is an array of scalars or static vectors of any other dimension. 

Since it is the fixed size that allows these optimizations, can't we have *mutable* arrays, with fixed size, that get also stack-allocated? In fact, we can, whenever the compiler can prove that no *heap* memory operation is required in the lifetime of the objects. Indeed, the `StaticArrays` package implements *mutable* arrays with static size, the `MVector`s, which can be used, for example, with this pattern:
```julia-repl
julia> function update_positions!(x)
           for i in eachindex(x)
               y = MVector(x[i])
               y[1] = 2.0
               x[i] = SVector(y)
           end
       end;

julia> x = [ SVector{3,Float64}(1,1,1) for i in 1:3 ]; # positions of 3 particles

julia> update_positions!(x)

julia> x
3-element Vector{SVector{3, Float64}}:
 [2.0, 1.0, 1.0]
 [2.0, 1.0, 1.0]
 [2.0, 1.0, 1.0]

julia> @btime update_positions!($x)
  2.628 ns (0 allocations: 0 bytes)
```

What we did there is to copy the static arrays of `x` into a mutable static array of fixed size `y`, in `y = MVector(x[i])`. Next, we mutated the first component of `y`, and finally updated the value of `x[i]` with the mutated array, converted back to a static vector. The compiler could prove, there, that none of the mutable values *escaped* the scope of the function, and could optimize the code such that only *stack* memory used. This resulted in fast and non-allocating code.

The possibilities to improve the performance of a numerical code increase.

## Immutable structs

There is nothing mysterious about StaticArrays. They are just convenient immutable structures, which you could have defined yourself, with the same allocation results:

```julia-repl
julia> struct P
           x::Float64
           y::Float64
           z::Float64
       end

julia> function update_positions!(x)
           for i in eachindex(x)
               y = P( 2*x[i].x, 2*x[i].y, 2*x[i].z )
               x[i] = y   
           end
       end;

julia> x = [ P(1.0,1.0,1.0) for i in 1:100 ];

julia> update_positions!(x);

julia> @allocated update_positions!(x)
0
```

Further information:
[Fortran compilers](https://discourse.julialang.org/t/julias-assignment-behavior-differs-from-fortran/50389/49?u=leandromartinez98)



