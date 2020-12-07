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
        "Development workflow" => "workflow.md",
        "Publish Docs" => "publish_docs.md",
        "Tracking allocations" => "memory.md",
        "Immutable variables" => "immutable.md",
        "Assignment and mutation" => "assignment.md",
        "Type instability" => "instability.md",
    ]
)
deploydocs(
    repo = "github.com/m3g/JuliaCookBook.git",
    target = "build",
    branch = "gh-pages",
    versions = ["stable" => "v^", "v#.#" ],
)
