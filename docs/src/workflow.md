# Nice workflows for using and developing Julia 1.9+

This a brief description of some nice development workflows for Julia, particularly for versions 1.9 or greater. This workflows are usually fairly personal, so many other useful ones may exist. 

## juliaup

The [juliaup](https://github.com/JuliaLang/juliaup) tool allows an easy handling of Julia installations and versioning. In short, if you are using Linux, install `juliaup` with:
```bash
curl -fsSL https://install.julialang.org | sh
```
then, close the terminal, start it again. The `juliaup` and `julia` executables will be available in your path. By default, `juliaup` installs the latest stable version of Julia, which as of the writing of this text was 1.8.5. We want to work with the upcoming 1.9 series, so we start by installing it:
```bash
juliaup add 1.9
```
which will currently install, as of today, the 1.9.0-rc1 version of Julia. Then, lets make it the default Julia:
```bash
juliaup default 1.9
```

## Revise and startup.jl

`Revise.jl` is a fundamental tool for Julia development and use. It allows one to track changes to files and, thus, to very effectively develop new functions, tune plots, etc, by editing an script in parallel to an active Julia section. Thus, add revise to your main environment:
```julia-repl
julia> ] add Revise
```
(remembering that the `]` will take you to the package manager prompt: `(@v1.9) pkg>`).

Next, let us guarantee that `Revise` is always loaded on startup. Add it to (or create the file) 
```
~/.julia/config/startup.j
```
and to it the line
```julia
using Revise
```
which will make `Revise` to be loaded on each Julia startup. 

#### Why Revise

With Revise loaded, it is possible to edit/develop scripts simply modifying the script and re-running functions in an open Julia section. For example, given the script that 
generates some data and then plots it:

```julia
using Plots
function my_data(n)
    data = randn(n)
    return data
end
function my_plot(data)
    plt = plot(data; label="My data"; linewidth=1)
    return plt
end
```

If we save the script in a `myplot.jl` file, and within Julia, we `includet` (note the `t`! - for "track"):
```julia-repl
julia> includet("./myplot.jl")

julia> data = my_data(1000);

julia> my_plot(data)
```
we generate the plot. Then, without leaving the Julia REPL, we can change any property of the data or the plot in the script, save the file, and re-run the functions changed, and they will reflect automatically the updates to the file. 

The video below illustrates such a feature, by changing the line width of the plot, and executing again the `my_plot` function. 

```@raw html
<center>
<iframe width="733" style="height:400px" src="https://www.youtube.com/embed/GeldXJ-cgHM" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</center>
```

!!! note
    The video illustrates the use of Revise from within VSCode, which is also a recommended tool for an effective workflow, but is not required here nor will be discussed in this text. In any case, if you are using it, install the Julia extension.

!!! note
    The example above illustrates some advantages of splitting Julia code into functions. With that layout, the function `my_plot` can be repeatedly executed
    at the REPL, tracking the changes made on the file. The same could be done with the data-generation function, for example, if the data has to be reloaded
    from different files, for example. Note, additionally, that it is good to structure Julia code in functions for performance reasons (functions get compiled
    to efficient native code), although in this example that is a essentially irrelevant. 

## Environments

Julia 1.9 makes it particularly appealing to use environments for specific tasks, because the compiled code of the libraries gets stored in a environment-specific manner, making the load times of the libraries quicker than in previous Julia versions. Besides, the use of environments allows one to obtain completely reproducible setups. Let us take the previous script, 
but we will load another large package `DataFrames`, and use it to store the sample data we are creating:

```julia
using Plots
using DataFrames
function my_data(n)
    data = DataFrame(:x => randn(n))
    return data
end
function my_plot(data)
    plt = plot(data.x; label="My data", linewidth=1)
    return plt
end
```

Since `Plots` and `DataFrames` are relatively heavy packages, they take a while to install and compile. We will do that within an new environment. First, create a directory that will contain the environment files. We choose to save the environments within a `~/.JuliaEnvironments` directory, but that is completely optional, environments are stored in regular directories:
```bash
mkdir ~/.JuliaEnvironments 
mkdir ~/.JuliaEnvironments/mydataplots
```
The `mydataplots` is the directory where the environment files will be automatically created. 

Then, start Julia and 
```julia-repl
julia> ] # go to pkg prompt

(@v1.9) pkg> activate ~/.JuliaEnvironments/mydataplots
  Activating new project at `~/.JuliaEnvironments/mydataplots`

(mydataplots) pkg>
```
and note that the `pkg>` prompt reflects that the `mydataplots` environment is activated. We now add the necessary packages, which can take some minutes, depending on the internet connection and speed of the computer:
```julia-repl 
(mydataplots) pkg> add Plots, DataFrames
   Resolving package versions...
   ...
```
after the installation is finished, let us simulate the use of the packages for the first time, which may trigger additional compilation. Type `backspace` to go back to the Julia prompt, and do:
```julia-repl
julia> using Plots, DataFrames
[ Info: Precompiling Plots [91a5bcdd-55d7-5caf-9e0b-520d859cae80]
[ Info: Precompiling DataFrames [a93c6f00-e57d-5684-b7b6-d8193f3e46c0]

```
which may also take some time (it it well possible that the packages don't get precompiled, again, on this first `using`, but sometimes they are because
of dependency version updates).

That's all. You can quite Julia, and let us move to the directory of the working script:
```bash
cd ~/Documents/mytestscript
```
Here we have the `script.jl` containing the code shown above, using `Plots` and `DataFrames`, as example packages.  

Now start Julia, and activate the `mydataplots` environment, with:
```julia-repl
julia> ] # go to pkg prompt

(@v1.9) pkg> activate /home/user/.JuliaEnvironments/mydataplots/
  Activating project at `~/.JuliaEnvironments/mydataplots`

(mydataplots) pkg>
```
type `backspace` go back to the Julia prompt, and include the script (here with `includet`, assuming that `Revise` is loaded by default):
```julia-repl
julia> includet("./myscript.jl")
```
This should take now a couple of seconds. And the responsiveness of the function should be good:
```julia-repl
julia> @time data = my_data(1000)
  0.002078 seconds (33 allocations: 18.031 KiB, 94.87% compilation time)
1000×1 DataFrame
  Row │ x          
      │ Float64    
──────┼────────────
    1 │ -2.41804
    2 │ -0.51387
    3 │  0.953752
    4 │  0.738998
    5 │  0.973528
  ⋮   │     ⋮
  997 │  0.707327
  998 │  0.200788
  999 │ -0.84872
 1000 │ -1.49911
   991 rows omitted
```

and

```
julia> @time my_plot(data)
  0.635311 seconds (2.83 M allocations: 172.703 MiB, 9.92% gc time, 99.49% compilation time: 72% of which was recompilation)
```
Thus, in a few seconds, the script can be completely run, avoiding usual delays of recompilation of the packages involved, which happened often in previous versions of Julia.

Now, let us automate the activation of the environment, by adding to the top of the script the following first line:
```julia
import Pkg; Pkg.activate("/home/user/.JuliaEnvironments/mydataplots") # added line
using Plots
... # script continues
```

Now, when including the script, it will automatically activate that environment, and use the packages installed for it. It is even possible to just execute the script from the command-line with an acceptable performance, where the script now, shown below, contains the execution of the functions and saving the plot to a figure:
```bash
user@m3g:~/Documents/mytestscript% time julia myscript.jl 
  Activating project at `~/.JuliaEnvironments/mydataplots`

real	0m5,172s
...
```

The complete script is, now:
```julia
import Pkg; Pkg.activate("/home/user/.JuliaEnvironments/mydataplots")
using Plots
using DataFrames
function my_data(n)
    data = DataFrame(:x => randn(n))
    return data
end
function my_plot(data)
    plt = plot(data.x; label="My data", linewidth=1)
    return plt
end
data = my_data(1000)
plt = my_plot(data)
savefig(plt,"plot.png")
```

Of course, you can use the same environment for all scripts that require the
same set of packages, with the same benefits. 

!!! note
    It is not impossible that you get some recompilation of the packages
    from time to time if, in particular, new packages are loaded in the
    same environment. However, once the packages of the environment are
    stable, precompilation should only occur when trying to use the same
    environment in different version of Julia.























