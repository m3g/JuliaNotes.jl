# REPL tips at startup.jl

This is my current (as of September 2023) `.julia/config/startup.jl` file:

```
using Revise, BenchmarkTools
import OhMyREPL
import Pkg
Pkg.UPDATED_REGISTRY_THIS_SESSION[] = true
insert!(LOAD_PATH, 2, mktempdir())
OhMyREPL.colorscheme!("TomorrowNightBright")
```

- `Revise` and `BenchmarkTools` are important development tools.
- `OhMyREPL` is responsible for syntax highlighting in the REPL. 

Install first these packages with:

```julia-repl
julia> import Pkg; Pkg.add(["Revise", "BenchmarkTools", "OhMyREPL"])
```

With `Pkg.UPDATE_REGISTRY_THIS_SESSION[] = true` Julia will not try to download
the latest version of every package all the time when installing a package in
a new environment. This is nice to avoid many unnecessary downloading and 
recompilation runs. 

With `insert!(LOAD_PATH, 2, mktempdir())`, a temporary environment is added 
to the list of default environments. This is useful because, when installing
a package automatically after a `using Package` command, one is prompted (by chossing the `o`)
in which environment the package is to be installed. Choosing the tempororary 
one (which will be selected by default) will avoid clutering the global environment.
In combination with the above update-registry option, this avoids may recompilation
runs.

The last line is my preferred color scheme.



