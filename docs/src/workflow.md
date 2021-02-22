# Workflows for developing effectivelly in Julia

Variables can be associated to different values any time:

```julia
data = [ 1, 2, 3 ]
f(data)
data = [ 2, 3, 4 ]
f(data)
```

Assuming that the data is constant, you could very directly just load a script repeatedly with the analysis and plotting/report functions, as you fiddle with the analysis functions, something as:

```julia
include("set_data.jl")
include("analyze.jl")
include("report.jl")
#--- change something in "analyze.jl"
include("analyze.jl")
include("report.jl")
```
where the `analyze.jl` and `report.jl` files include both the functions and the call to those functions using the data variables. I use that frequently for fast exploration of code.

When things get more complicated, you probably want to use `Revise` (or even before things get complicated). With `Revise` you can include your script once, and the changes will be tracked automatically. In that case, the call to the functions should be done at the REPL (not included in the scripts). Something like:

```julia
using Revise
include("set_data.jl")
includet("analyze.jl") # note the "t", for track
includet("report.jl") 

result = analyze(data)
report(result)

# Modifity the functions inside analyze.jl and report.jl
# new run will be automatically with the new versions:

result = analyze(data)
report(result)
```

Some people just use `Revise` by default. And `Revise` goes well with
modules, in which case, if you had defined a module `MyModule` in a file
`MyModule.jl`, with the functions of `analyze.jl` and `report.jl`, such
as

```julia
module MyModule
  include("analyze.jl")
  include("report.jl")
  export analyze, report
end
```

Load it with

```julia
using Revise
using MyModule # if you are in the folder where "MyModule.jl" is*
```

You will be able to modify the functions inside those files and they
will be always be automatically updated at every new call in the REPL. 

These options do not work if you redefine a constant, such as a struct or try to redefine a function as a variable. 
Then you have to restart over. I usually keep also a script which just runs the
above commands to restart the developing section when that is needed,
starting julia with `julia -i devel.jl`.

\*If you want to load the module from other folder, you need to add that folder to the `LOAD_PATH`, with:

```julia
 push!(LOAD_PATH,"/path/to/MyModule")
```


Further discussion on this topic: 
[Julia REPL flow coming from Matlab](https://discourse.julialang.org/t/julia-repl-flow-coming-from-matlab/50499/1)

