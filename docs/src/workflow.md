# Nice workflows for using and developing Julia 1.9+

This a brief description of some nice development workflows for Julia, particularly for versions 1.9 or greater. This workflows are usually fairly personal, so many other useful ones may exist. 

## juliaup

The [juliaup](https://github.com/JuliaLang/juliaup) tool alows an easy handling of Julia instalations and versioning. In short, if you are using Linux, install `juliaup` with:
```bash
curl -fsSL https://install.julialang.org | sh
```
then, close the terminal, start it again. The `juliaup` and `julia` executables will be available in your path. By default, `juliaup` installs the latest stable version of Julia, which as of the writting of this text was 1.8.5. We want to work with the upcoming 1.9 series, so we start by installing it:
```bash
juliaup add 1.9
```bash
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

With Revise loaded, it is possible to edit/develop scripts simply modifying the script and re-runing functions in an open Julia section. For example, given the script that 
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
(from within VSCode, which is also a recomended tool for an efective workflow, but is not required here nor will be discussed in this text).

```@raw html
<center>
<iframe width="500" style="height:315px" src="https://www.youtube.com/embed/GeldXJ-cgHM" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</center>
```

!!! note
    The example above illustrates some advantages of splitting Julia code into functions. With that layout, the function `my_plot` can be repeadedly executed
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

Since `Plots` and `DataFrames`


  11 dependencies successfully precompiled in 70 seconds. 133 already precompiled.




