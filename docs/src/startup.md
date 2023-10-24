# REPL tips at startup.jl

This is my current (as of November 2023) `.julia/config/startup.jl` file:

```julia
using Revise
using BenchmarkTools
import OhMyREPL
OhMyREPL.colorscheme!("TomorrowNightBright")
import Pkg
Pkg.UPDATED_REGISTRY_THIS_SESSION[] = true
if occursin("v"*string(VERSION)[1:4],Base.active_project())
    Pkg.activate(temp=true)
end
```

- `Revise` and `BenchmarkTools` are important development tools.
- `OhMyREPL` is responsible for syntax highlighting in the REPL, and that is my preferred color scheme.

Install first these packages with:

```julia-repl
julia> import Pkg; Pkg.add(["Revise", "BenchmarkTools", "OhMyREPL"])
```

With `Pkg.UPDATE_REGISTRY_THIS_SESSION[] = true` Julia will not try to download
the latest version of every package all the time when installing a package in
a new environment. This is nice to avoid many unnecessary downloading and 
recompilation runs. 

The code
```julia
if occursin("v"*string(VERSION)[1:4],Base.active_project())
    Pkg.activate(temp=true)
end
```
will check if the active environment is the main one ("v1.10", or similar) and,
in this case, activate a temporary environment instead. 
With that adding new packages does not bloat the Main environment. 
This is very convenient for testing new
packages. Now (as of Julia 1.9) that precompiled cache files are saved, installing
packages that are already locally available is quick, and thus having a default
temporary environment is quite convenient. 

A few time ago I used, instead of `Pkg.activate(temp=true)`, 
```
insert!(LOAD_PATH, 2, mktempdir())
```
with which a temporary environment is added 
to the list of default environments. This is useful because, when installing
a package automatically after a `using Package` command, one is prompted (by chossing the `o`)
in which environment the package is to be installed. Choosing the tempororary 
one (which will be selected by default) will avoid clutering the global environment.
In combination with the above update-registry option, this avoids may recompilation
runs. But currently I prefer just always starting in a temporary environment.




