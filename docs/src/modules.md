
# Modules and Revise

The most practical way to develop code in Julia, particularly when the code becomes more complex, is to write `modules` and use the `Revise` package.

To install the `Revise` package, do:
```julia
julia> ] add Revise
```

The workflow is, then:

### Create a function

Create a file with a function, for example: `f.jl`

```julia
function f(x)
  y = 2*x
  return y
end
```

### Create a module

Create a file called, for example, `MyModule.jl`, in which you define a module of the same name. Include the files with your function definitions in this module:

```julia
module MyModule
  export f
  include("./f.jl")  
end
```

The `export f` command makes the `f` function visible from outside the module. That is, later when you load the module with `using MyModule` you will be able to directly call `f(x)` instead of having to type `MyModule.f(1)`. Exporting or not functions is optional.

### Develop using `Revise`

Now, start Julia and load the module with the following commands:

```julia
using Revise
push!(LOAD_PATH,"/path/to/MyModule")
using MyModule
```

(it is a good idea to put these commands in a file, lets say `devel.jl`, to load it with `julia -i devel.jl` every time you start a development section). 

This will load the module with its functions. Since the module was loaded after `Revise`, the changes to the files included in that module will be tracked and updated automatically. 

That means that:
 
```julia
julia> using Revise

julia> push!(LOAD_PATH,"/path/to/MyModule")

julia> using MyModule

julia> f(1)
2
```

Now, if I modify the file `f.jl` such that the function multiplies the value of `x` by 5, and save it, we have:

```julia
julia> f(1)
5

```

Thus, the REPL section can be kept open and I can change and modify my package functions without having to load all the packages all the time.  The only situation, for now, that will require the restart of Julia is the redefinition of a `struct`, which for complicated reasons `Revise` is not able to track appropriately and update the state of the Julia section. 

