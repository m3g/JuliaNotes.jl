
# Vector{Int} <: Vector{Real} is false?? 

[Covariance and etc.](https://en.m.wikipedia.org/wiki/Covariance_and_contravariance_(computer_science)) mean so many things outside computer science that it took me a while to get what people meant when explaining covariance, contravariance, invariance, etc, in the context of Julia type system.

I prefer to explain the relation between the container types, probably not as comprehensively, but at least simply, by noting that:

First, we have to differentiate two things:

a) An array that *can only* contain numbers of type `Float64`

b) An array that *can* contain real numbers of different types (mixed `Float64` and `Int64`, for example).

Vectors of type (b) are not a subtype of vectors of type (a), of course, because vectors of type (a) cannot contain an `Int64`, for example. This is clear and translates to:
```julia
Vector{Real} <: Vector{Float64} == false
```

Less clear is that an array of type (a) is also not a subtype of an array of type (b). This is because an array of type (a) *has constraint* that vectors of type (b) do not. Thus, a vector of type (a) is not a subtype of vectors of type (a), and this translates to the more unnatural
```julia
Vector{Float64} <: Vector{Real} == false
```

Second, the usual confusion is that `Vector{Real}` is intuitively thought as *all types of vectors that contain real numbers*. Well, this is the wrong way of reading that. As pointed above, `Vector{Real}` is the type of a concrete vector that *is able* to contain any type of real number. Thus, this does not include the vectors that *cannot*  contain `Int64`s, for instance. 

We need a notation for the *set of vectors* that may contain real numbers, restricted or not by type. The notation might sound arbitrary, but we need one, and it is `Vector{<:Real}`. Since this is the notation that encompasses different types of vectors, it is an *abstract type*, contrary to the other two above, which are *concrete types*.

No actual vector is, therefore, of type `Vector{<:Real}`. To be very redundant:

```julia-repl
julia> Real[1,2.0,π,Float32(7)] isa Vector{<:Real}
false
```

But all vectors  that contain only real numbers, are subtypes of `Vector{<:Real}`:

```julia-repl
julia> typeof(Real[1,2.0,π,Float32(7)]) <: Vector{<:Real}
true

julia> typeof(Int[1,2,3]) <: Vector{<:Real}
true
```

When one uses `Vector{<:Real}` we are referring a *set* of types. The final confusion that may arise, is, for example, that:

```julia-repl
julia> Int64[1,2,3] isa Vector{<:Int64}
false
```

This is `false` because `Vector{<:Int64}` is the *set* of types of vectors that contain only `Int64` numbers. It is not a concrete type of vector, even if the set contains only one type which is `Vector{Int64}`. 

Of course:
```julia-repl
julia> typeof(Int64[1,2,3]) <: Vector{<:Int64}
true
```



