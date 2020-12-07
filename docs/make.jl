import Pkg
Pkg.add("Documenter")
using Documenter
using JuliaCookBook
push!(LOAD_PATH,"../src/")
makedocs(
    modules=[JuliaCookBook],
    sitename="JuliaCookBook.jl",
    pages = [
        "Home" => "index.md",
        "Workflow" => "workflow.md",
    ]
)
deploydocs(
    repo = "github.com/m3g/JuliaCookBook.git",
    target = "build",
    branch = "gh-pages",
    versions = ["stable" => "v^", "v#.#" ],
)
