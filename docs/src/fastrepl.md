# Cool and fast loading REPL

This was a suggestion from Michael Fiano in a Zulip chat. It makes the startup
really fast, and with a nice setup for `OhMyREPL`. Install the packages first:

```julia
julia> import Pkg

julia> Pkg.add(["Revise", "OhMyREPL", "Crayons", "BenchmarkTools"])
```

And add the following to the `~/.julia/config/startup.jl`:

```julia
Base.atreplinit() do repl
    @eval begin
        @async @eval using Revise
        @async @eval using BenchmarkTools
        import OhMyREPL as OMR
        import Crayons as C
        promptfn() = "(" * splitpath(Base.active_project())[end-1] * ") julia> "
        OMR.input_prompt!(promptfn)
        OMR.colorscheme!("OneDark")
        OMR.enable_pass!("RainbowBrackets", false)
        OMR.Passes.BracketHighlighter.setcrayon!(C.Crayon(foreground=:blue))
    end
end
```

From [this thread](https://julialang.zulipchat.com/#narrow/stream/137791-general/topic/Neat.20and.20obvious.20in.20retrospect.20trick.20to.20start.20a.20REPL.20faster/near/294079628
) (probably the link will be broken).
