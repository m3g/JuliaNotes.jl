import Pkg
Pkg.add("Documenter")
using Documenter
using JuliaNotes
push!(LOAD_PATH,"../src/")
makedocs(
    modules=[JuliaNotes],
    sitename="JuliaNotes.jl",
    pages = [
        "Home" => "index.md",
        "Development workflow" => "workflow.md",
        "Modules and Revise" => "modules.md",
        "Scope of loops" => "loopscopes.md",
        "Benchmark" => "benchmark.md",
        "Assignment and mutation" => "assignment.md",
        "Type instability" => "instability.md",
        "Closures" => "closures.md",
        "Union splitting" => "splitting.md",
        "Tracking allocations" => "memory.md",
        "Immutable variables" => "immutable.md",
        "ERROR: No method..." => "nomethod.md",
        "Vector{Int} <: Vector{Real} is false???" => "typevariance.md",
        "Publish Docs" => "publish_docs.md",
    ]
)
deploydocs(
    repo = "github.com/m3g/JuliaNotes.jl.git",
    target = "build",
    branch = "gh-pages",
    versions = ["stable" => "v^", "v#.#" ],
)
