# Dealing with mixed-type arrays

To be explained.

```julia
using BenchmarkTools
abstract type Material end

struct Material1 <: Material
  m :: Float64
end

struct Material2 <: Material
  m :: Float64
end

struct HitPoint{T <: Material}
  p :: Float64
  r :: Float64
  m :: T
end

hit(p::HitPoint) = p.r*p.p*p.m.m

for type in subtypes(Material)
  eval(:((p::HitPoint{$type})() = p.r*p.p*p.m.m))
end

function hits_naive(hitpoints)
  s = 0.
  for p in hitpoints 
    s += hit(p)
  end
  s
end

function hits_splitting(hitpoints)
  s = 0.
  for p in hitpoints 
    if p isa HitPoint{Material1}
      s += hit(p)
    elseif p isa HitPoint{Material2}
      s += hit(p)
    end
  end
  s
end

function hits_functors(hitpoints)
  s = 0.
  for p in hitpoints 
    s += p()
  end
  s
end


using BenchmarkTools

n = 1000
hitpoints = [ rand(Bool) ? HitPoint(rand(),rand(),Material1(rand())) : 
              HitPoint(rand(),rand(),Material2(rand())) for i in 1:n ]

println(" Mixed types: ")
print("naive:");@btime hits_naive($hitpoints)
print("split:");@btime hits_splitting($hitpoints)
print("funct:");@btime hits_functors($hitpoints)

hitpoints_single = HitPoint{Material1}[ HitPoint(rand(),rand(),Material1(rand())) for i in 1:n ]

println(" Single type: ")
print("naive:");@btime hits_naive($hitpoints_single)
print("split:");@btime hits_splitting($hitpoints_single)
print("funct:");@btime hits_functors($hitpoints_single)

```

Results:

```julia-repl
julia> include("./splitting2.jl")
 Mixed types:
naive:  36.732 μs (2000 allocations: 31.25 KiB)
split:  5.519 μs (0 allocations: 0 bytes)
funct:  1.228 μs (0 allocations: 0 bytes)
 Single type:
naive:  3.792 μs (0 allocations: 0 bytes)
split:  3.818 μs (0 allocations: 0 bytes)
funct:  991.750 ns (0 allocations: 0 bytes)
120.4941832560873

```

