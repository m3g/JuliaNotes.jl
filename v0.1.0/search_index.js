var documenterSearchIndex = {"docs":
[{"location":"instability/#Type-instability-and-performance","page":"Type instability","title":"Type instability and performance","text":"","category":"section"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"To obtaina a peformant code it is important that the types of the variables can be inferred by the compiler. If a variable can change type in an unpredictable manner, we say that there is a type instability.","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"Type instabilities generally occur when we try to use global variables inside functions, that is, without passing these variables as parameters to the functions. Lets explain that. ","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"A global variable is anything defined in the global scope, that is outside any function or other structure that defines a scope (let blocks, for example). We obtain a global variable when writing, in the REPL, ","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"julia> x = 5. ","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"or when we write in a script the same thing:","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"more script.jl","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"x = 5.","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"A variable defined in this way is type unstable because you can change its value at any time to anything. For example,","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"julia> x = 5.\n5.0\n\njulia> x = \"ABC\"\n\"ABC\"\n","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"Now, we will define a function that uses the value of x without passing x as a parameter. This function will sum up the elements of x:","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"julia> function f()\n          s = 0\n          for val in x\n            s = s + val\n          end\n          return s\n       end\nf (generic function with 1 method)\n","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"This function cannot be specialized for the type of variable that x is, because, as we have mentioned, x could be any type of variable. This problem can be tracked with the macro @code_warntype: ","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"julia> @code_warntype f()\nVariables\n  #self#::Core.Compiler.Const(f, false)\n  s::Any\n  @_3::Any\n  val::Any\n\nBody::Any\n1 ─       (s = 0.0)\n│   %2  = Main.x::Any\n│         (@_3 = Base.iterate(%2))\n│   %4  = (@_3 === nothing)::Bool\n│   %5  = Base.not_int(%4)::Bool\n└──       goto #4 if not %5\n2 ┄ %7  = @_3::Any\n│         (val = Core.getfield(%7, 1))\n│   %9  = Core.getfield(%7, 2)::Any\n│         (s = s + val)\n│         (@_3 = Base.iterate(%2, %9))\n│   %12 = (@_3 === nothing)::Bool\n│   %13 = Base.not_int(%12)::Bool\n└──       goto #4 if not %13\n3 ─       goto #2\n4 ┄       return s\n\n","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"Note that there are many Any in the code above, which will be highlighted in red if you run these commands in your REPL. That indicates that something is not quite right. In particular, note the line Body::Any: it indicates that the result of the body of that function can be of any type, in principle.    ","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"Let us check how this function performs. We will define x as a vector of many components such that the time of f(x) is measured accurately:","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"julia> x = rand(1000);\n\njulia> @btime f()\n  60.148 μs (3490 allocations: 70.16 KiB)\n492.360646736646\n","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"Now, we will define a new function that receives x as a parameter, and besides that does exactly the same thing:","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"julia> function g(x)\n         s = zero(eltype(x))\n         for val in x\n           s = s + val\n         end\n         return s\n       end\n","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"In this example we were obsessive by initializing s as zero(eltype(x)), which indicates that s is a zero of the same type of the elements of x. That is, if x is a vector of integer numbers, s will be 0 (integer), and if x is a vector of real numbers, s will be 0. (real). This is not fundamental for the performance here tested, but it will eliminate all possible types of instability of the variables within that code.  ","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"Now, if we call g(x) with a x of a specific type, that will create a method of that function specialized for this type of variable. For example, if we call g with the number 1, which is an integer number, all operations in g will be performed with integers:","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"julia> @code_warntype g(1)\nVariables\n  #self#::Core.Compiler.Const(g, false)\n  x::Int64\n  s::Int64\n  @_4::Union{Nothing, Tuple{Int64,Nothing}}\n  val::Int64\n\nBody::Int64\n1 ─       (s = 0)\n│   %2  = x::Int64\n│         (@_4 = Base.iterate(%2))\n│   %4  = (@_4::Tuple{Int64,Nothing} === nothing)::Core.Compiler.Const(false, false)\n│   %5  = Base.not_int(%4)::Core.Compiler.Const(true, false)\n└──       goto #4 if not %5\n2 ─ %7  = @_4::Tuple{Int64,Nothing}::Tuple{Int64,Nothing}\n│         (val = Core.getfield(%7, 1))\n│   %9  = Core.getfield(%7, 2)::Core.Compiler.Const(nothing, false)\n│         (s = s::Core.Compiler.Const(0, false) + val)\n│         (@_4 = Base.iterate(%2, %9))\n│   %12 = (@_4::Core.Compiler.Const(nothing, false) === nothing)::Core.Compiler.Const(true, false)\n│   %13 = Base.not_int(%12)::Core.Compiler.Const(false, false)\n└──       goto #4 if not %13\n3 ─       Core.Compiler.Const(:(goto %7), false)\n4 ┄       return s\n","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"Note that there is no Any remaiing in the above code and that, in particular, the result of the body of the code is guaranteed to be an integer Body::Int64. ","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"If we call the same function with the number 3.14, which is real, another method is generated:","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"julia> @code_warntype g(3.14)\nVariables\n  #self#::Core.Compiler.Const(g, false)\n  x::Float64\n  s::Float64\n  @_4::Union{Nothing, Tuple{Float64,Nothing}}\n  val::Float64\n\nBody::Float64\n1 ─       (s = 0)\n│   %2  = x::Float64\n│         (@_4 = Base.iterate(%2))\n│   %4  = (@_4::Tuple{Float64,Nothing} === nothing)::Core.Compiler.Const(false, false)\n│   %5  = Base.not_int(%4)::Core.Compiler.Const(true, false)\n└──       goto #4 if not %5\n2 ─ %7  = @_4::Tuple{Float64,Nothing}::Tuple{Float64,Nothing}\n│         (val = Core.getfield(%7, 1))\n│   %9  = Core.getfield(%7, 2)::Core.Compiler.Const(nothing, false)\n│         (s = s::Core.Compiler.Const(0, false) + val)\n│         (@_4 = Base.iterate(%2, %9))\n│   %12 = (@_4::Core.Compiler.Const(nothing, false) === nothing)::Core.Compiler.Const(true, false)\n│   %13 = Base.not_int(%12)::Core.Compiler.Const(false, false)\n└──       goto #4 if not %13\n3 ─       Core.Compiler.Const(:(goto %7), false)\n4 ┄       return s::Float64\n","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"Now all types of the function are Float64 and the function is guaranteed to return that type of number.","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"This specialization was not possible when x was not a parameter of the function, because the method had to deal with any type of variables.","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"How the performance of these methods compare with the previous implementation that had type instabilities? Let us see:","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"julia> x = rand(1000);\n\njulia> @btime f()\n  59.518 μs (3490 allocations: 70.16 KiB)\n504.23960342930764\n\njulia> @btime g($x)\n  965.300 ns (0 allocations: 0 bytes)\n504.23960342930764\n","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"The function g is about 60 times faster than f and, furthermore, does not allocate any memory. ","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"To guarantee that function are type-stable, therefore, is one of the most important things in the generation of fast code.","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"Global variables, therefore, must be avoided inside functions. They must be passed as parameters such that specialized methods can be built. ","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"Sometimes, however, the values are constants. For example, pi. It would be strange to have to pass pi as a parameter to every function that uses it. Thus, pi is a constant-global, and being a constant it does not introduce type-instabilities. Custom constant global are defined with the const keyword, and solve the performance issue of the function f above.","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"julia> const x = rand(1000);\n\njulia> @btime f()\n  963.300 ns (0 allocations: 0 bytes)\n504.11877716593017\n","category":"page"},{"location":"instability/","page":"Type instability","title":"Type instability","text":"Yet, in this case calling the variable x a constant is artificial, and in this particular case the function f only computes the sum of the elements of that particular x from now on. Thus, it is much more reasonable to pass x as a parameter, and let the constants be used for actual constant values, as pi.         ","category":"page"},{"location":"immutable/#Immutable-and-mutable-variables","page":"Immutable variables","title":"Immutable and mutable variables","text":"","category":"section"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"The mutable vs. immutable thing, from the perspective of a previous Fortran user: In Fortran everything seems to have its place in memory, as I said, and everything seems to be mutable, although that might not be true in practice. Thus, there is an abstraction layer there that must be overcome. I hope what I say in what follows is not too wrong. ","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"One learns in this process that values can \"exist\" in different ways. A variable may occupy a place in one type of memory, the type of memory that we understood that existed, which is called the \"heap\". The variables in the heap have an address to the position in memory they occupy and, thus, the value that they assume can be changed, by modifying the content of that position in the memory. This is where mutable variables are stored.","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"In Fortran, from a user perspective, everything seems to be in the \"heap\" (although that might not be true, the compiler will decide that), in such a way that one can program as if every variable had an address in memory and its value can be modified by modifying the content of that position in the memory. Thus, everything seems to be mutable in Fortran. Additionally, labels are assigned forever to the same positions in memory.","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"Now we learn that some variables might exist in other types of memory, the \"stack\" and (I guess) the processor cache. These types of memory are much faster than the \"heap\" to work with, and if a variable can be assigned to these places your code will be faster. However, the values occupying these types of memory positions do not have an address in the usual sense. You cannot change the value associated to that position in memory because that value in that position in memory is not persistent, that is, it will be discarded as soon as possible. Even if the value will be used later, it might be that it is copied somewhere else in the stack without our knowledge if that results to be the best strategy for performance. We do not control where these values are stored and, then, we cannot assign different values for these variables, because this actually does not make sense, they are only values stored somewhere in a fast access memory.","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"Thus we learn that in a loop like:","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"s = 0.\nfor i in 1:3\n   x = 2*i\n   s = s + x\nend","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"x might not be allocated in memory at all. It might occupy a temporary place in the fast stack memory or, even, only in the processor cache. In general we don't know what is going on with x, and we should not care about that, the people that implemented the compilers are much smarter than us and implemented most likely the best choice. Perhaps it will be stored in the slow \"heap\" memory, with an address, particularly if it was a huge array instead of a simple scalar, but it doesn't mater. (in this case probably it is just inlined, but the idea is the same)","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"A Fortran user is surprised that a loop like that does not allocate anything. We learn that everything has its place in memory, even the counter of the loop, so that code should at least allocate some values. Yet, now we discover that these allocations \"do not count\", because are fast allocations in these non-addressed types of memory.","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"But we have to learn that for the compiler have freedom to choose what to do with x, the content of x cannot change. Thus, it must be immutable. In the loop above, it doesn't even make sense calling x the same variable at each loop iteration. It is just a temporary value assigned to some fast memory position that will be used and discarded. ","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"Therefore, if we write","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"x = 1 \nx = 2","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"the two x are probably just two completely independent values stored in these fast memories. Both the \"first x\" and the \"second x\" are immutable. Actually what is immutable is the Integer values 1 and 2, and x is only a temporary label to one or other of this values. The first x will be discarded when convenient without we knowing where it was stored, if it was stored at all. ","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"Yet, if we write","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"x = Vector{Int}(undef,1)\nx[1] = 1\nx[1] = 2","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"we are assuming that for some reason you want to access the same position in memory repeatedly, and this must be stored in the slower heap memory, where things have real addresses. This x is a mutable object, you can actually change the content associated with the position it occupies in memory explicitly. ","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"Later we learn that vectors can also be immutable (why not? If a number can be stored in these fast memories, why not a bunch of numbers?). And we can use StaticArrays where small vectors behave the same as any other immutable value, like a number. This means that:","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"julia> function f()\n         s = 0.\n         for i in 1:1000\n           x = SVector{3,Float64}(i, sqrt(i), i^2)\n           for j in 1:3\n             s = s + x[j]\n           end\n         end\n         s\n       end\nf (generic function with 1 method)\n\njulia> f()\n3.343550974558874e8\n\njulia> @allocated f()\n0\n","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"Wait, that function that generates 1000 vectors of dimension 3 does not allocate anything? Yet it doesn't, because these static arrays are immutable, so they only exist in the fast memory positions which are temporary. Knowing this allows a bunch of code optimizations which are very cool, and a very pretty syntax if you are dealing with particle simulations. For instance, you can do:","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"julia> x = [ SVector{3,Float64}(1,1,1) for i in 1:3 ]; # positions of 3 particles\n\njulia> function update_positions!(x)\n         for i in 1:length(x)\n           y = 2*x[i] # whatever needed\n           x[i] = y \n         end\n       end\nupdate_positions! (generic function with 1 method)\n\njulia> update_positions!(x)\n\njulia> x\n10-element Array{SArray{Tuple{3},Float64,1,3},1}:\n [2.0, 2.0, 2.0]\n [2.0, 2.0, 2.0]\n [2.0, 2.0, 2.0]\n\njulia> @allocated update_positions!(x)\n0","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"The update_positions! function is mutating the elements of x (x is mutable), but the elements of x are themselves immutable static vectors. This is, the line y = 2*x[i] is just creating a new static vector, and x[i] = y is not actually modifying the values of the positions in memory of the elements of x[i] as we would think (or it might be, that is just not your problem), and all that does not involve any access to the slow heap  memory of the computer. Thus you can deal with a vector as fast you can deal with a scalar. ","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"The possibilities to improve the performance of a numerical code increase. I have been able to write faster codes in Julia than in Fortran now, but that depends on some adaptation with that new way of thinking and with the new possibilities involved.","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"Just to add one thing. There is nothing mysterious about StaticArrays. They are convenient immutable structures, which you could have defined yourself, with the same allocation results:","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"julia> struct P\n         x :: Float64\n         y :: Float64\n         z :: Float64\n       end\n\njulia> function update_positions!(x)\n         for i in 1:length(x)\n           y = P( 2*x[i].x, 2*x[i].y, 2*x[i].z )\n           x[i] = y   \n         end\n       end\nupdate_positions! (generic function with 1 method)\n\njulia> x = [ P(1.0,1.0,1.0) for i in 1:100 ];\n\njulia> update_positions!(x);\n\njulia> @allocated update_positions!(x)\n0\n","category":"page"},{"location":"immutable/","page":"Immutable variables","title":"Immutable variables","text":"Further information: Fortran compilers","category":"page"},{"location":"memory/#Tracking-memory-allocations","page":"Tracking allocations","title":"Tracking memory allocations","text":"","category":"section"},{"location":"memory/#Manually","page":"Tracking allocations","title":"Manually","text":"","category":"section"},{"location":"memory/","page":"Tracking allocations","title":"Tracking allocations","text":"A practical way to track memory allocations manually is using:","category":"page"},{"location":"memory/","page":"Tracking allocations","title":"Tracking allocations","text":"a = @allocated begin\n    Block to test\nend; if a > 0 println(a) end","category":"page"},{"location":"memory/","page":"Tracking allocations","title":"Tracking allocations","text":"That will print something if the code block allocated something.","category":"page"},{"location":"memory/#Using-the-Profiler","page":"Tracking allocations","title":"Using the Profiler","text":"","category":"section"},{"location":"memory/","page":"Tracking allocations","title":"Tracking allocations","text":"To track allocations along the complete code, it is possible to use a profiler, although this generates so much information that it is somewhat confusing.","category":"page"},{"location":"memory/","page":"Tracking allocations","title":"Tracking allocations","text":"For example, consider this is the code (file name here: test.jl):","category":"page"},{"location":"memory/","page":"Tracking allocations","title":"Tracking allocations","text":"struct A\n  x\nend\n\nfunction test(n,x)\n  y = Vector{A}(undef,n)\n  for i in 1:n\n    y[i] = A(i*x)\n  end\n  y\nend\n","category":"page"},{"location":"memory/","page":"Tracking allocations","title":"Tracking allocations","text":"Run julia with:","category":"page"},{"location":"memory/","page":"Tracking allocations","title":"Tracking allocations","text":"julia --track-allocation=user","category":"page"},{"location":"memory/","page":"Tracking allocations","title":"Tracking allocations","text":"Within Julia, do:","category":"page"},{"location":"memory/","page":"Tracking allocations","title":"Tracking allocations","text":"julia> using Profile\n\njulia> include(\"./test.jl\")\ntest (generic function with 1 method)\n\njulia> test(10,rand()); # gets compiled\n\njulia> Profile.clear_malloc_data() # clear allocations\n\njulia> test(10,rand());\n","category":"page"},{"location":"memory/","page":"Tracking allocations","title":"Tracking allocations","text":"Exit Julia, this will generate a file test.jl.XXX.mem (extension .mem), which, in this case, contains:","category":"page"},{"location":"memory/","page":"Tracking allocations","title":"Tracking allocations","text":"        -\n        - struct A\n        -   x\n        - end\n        -\n        - function test(n,x)\n      160   y = Vector{A}(undef,n)\n        0   for i in 1:n\n      160     y[i] = A(i*x)\n        -   end\n        0   y\n        - end\n","category":"page"},{"location":"memory/","page":"Tracking allocations","title":"Tracking allocations","text":"Where the lines with non-zero numbers are the lines where allocations occur.","category":"page"},{"location":"memory/","page":"Tracking allocations","title":"Tracking allocations","text":"More information: Disabling allocations","category":"page"},{"location":"workflow/#Workflows-for-developing-effectivelly-in-Julia","page":"Development workflow","title":"Workflows for developing effectivelly in Julia","text":"","category":"section"},{"location":"workflow/","page":"Development workflow","title":"Development workflow","text":"Variables can be associated to different values any time:","category":"page"},{"location":"workflow/","page":"Development workflow","title":"Development workflow","text":"data = [ 1, 2, 3 ]\nf(data)\ndata = [ 2, 3, 4 ]\nf(data)","category":"page"},{"location":"workflow/","page":"Development workflow","title":"Development workflow","text":"Assuming that the data is constant, you could very directly just load a script repeatedly with the analysis and plotting/report functions, as you fiddle with the analysis functions, something as:","category":"page"},{"location":"workflow/","page":"Development workflow","title":"Development workflow","text":"include(\"set_data.jl\")\ninclude(\"analyze.jl\")\ninclude(\"report.jl\")\n#--- change something in \"analyze.jl\"\ninclude(\"analyze.jl\")\ninclude(\"report.jl\")","category":"page"},{"location":"workflow/","page":"Development workflow","title":"Development workflow","text":"where the analyze.jl and report.jl files include both the functions and the call to those functions using the data variables. I use that frequently for fast exploration of code.","category":"page"},{"location":"workflow/","page":"Development workflow","title":"Development workflow","text":"When things get more complicated, you probably want to use Revise (or even before things get complicated). With Revise you can include your script once, and the changes will be tracked automatically. In that case, the call to the functions should be done at the REPL (not included in the scripts). Something like:","category":"page"},{"location":"workflow/","page":"Development workflow","title":"Development workflow","text":"using Revise\ninclude(\"set_data.jl\")\nincludet(\"analyze.jl\") # note the \"t\", for track\nincludet(\"report.jl\") \n\nresult = analyze(data)\nreport(result)\n\n# Modifity the functions inside analyze.jl and report.jl\n# new run will be automatically with the new versions:\n\nresult = analyze(data)\nreport(result)","category":"page"},{"location":"workflow/","page":"Development workflow","title":"Development workflow","text":"Some people just use Revise by default. And Revise goes well with modules, in which case, if you had defined a module MyModule in a file MyModule.jl, with the functions of analyze.jl and report.jl, such as","category":"page"},{"location":"workflow/","page":"Development workflow","title":"Development workflow","text":"module MyModule\n  include(\"analyze.jl\")\n  include(\"report.jl\")\n  export analyze, report\nend","category":"page"},{"location":"workflow/","page":"Development workflow","title":"Development workflow","text":"Load it with","category":"page"},{"location":"workflow/","page":"Development workflow","title":"Development workflow","text":"using Revise\nusing MyModule # if you are in the folder where \"MyModule.jl\" is*","category":"page"},{"location":"workflow/","page":"Development workflow","title":"Development workflow","text":"You will be able to modify the functions inside those files and they will be always be automatically updated at every new call in the REPL. ","category":"page"},{"location":"workflow/","page":"Development workflow","title":"Development workflow","text":"These options do not work if you redefine a data structure. Then you have to restart over. I usually keep also a script which just runs the above commands to restart the developing section when that is needed, starting julia with julia -i devel.jl.","category":"page"},{"location":"workflow/","page":"Development workflow","title":"Development workflow","text":"*If you want to load the module from other folder, you need to add that folder to the LOAD_PATH, with:","category":"page"},{"location":"workflow/","page":"Development workflow","title":"Development workflow","text":" push!(LOAD_PATH,\"/path/to/MyModule\")","category":"page"},{"location":"workflow/","page":"Development workflow","title":"Development workflow","text":"Further discussion on this topic:  Julia REPL flow coming from Matlab","category":"page"},{"location":"publish_docs/#How-to-deploy-the-documentation-of-a-project","page":"Publish Docs","title":"How to deploy the documentation of a project","text":"","category":"section"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"The following workflow works for packages registered in the Julia general registry.","category":"page"},{"location":"publish_docs/#Create-the-TagBot.yml-file","page":"Publish Docs","title":"Create the TagBot.yml file","text":"","category":"section"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"/home/user/.julia/dev/Project/.github/workflows/TagBot.yml","category":"page"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"and add the content provided here: TagBot.yml example","category":"page"},{"location":"publish_docs/#Use-DocumenterTools-to-generate-the-keys","page":"Publish Docs","title":"Use DocumenterTools to generate the keys","text":"","category":"section"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"import DocumenterTools\nDocumenterTools.genkeys()","category":"page"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"which will output something like:","category":"page"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"julia> DocumenterTools.genkeys()\n[ Info: add the public key below to https://github.com/$USER/$REPO/settings/keys with read/write access:\n\nssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDIIDDRX8DyLG... CCKQPTNei1Ng8b5d+a1ldnVSkgB0= Documenter\n\n[ Info: add a secure environment variable named 'DOCUMENTER_KEY' to https://travis-ci.com/$USER/$REPO/settings (if you deploy using Travis CI) or https://github.com/$USER/$REPO/settings/secrets (if you deploy using GitHub Actions) with value:\n\nLS0tLS1CRUdJTiBPUEVOU1NIIFBSSV... MGtyNng2VWR6WTFxckg1bkUyVGU2ajU3TUdveXpZL1EzTApoNGlqbE5NSWJTOFA2K2JNUkYxVFVCUzdQbC9mZDlTZWJKYTlKdWpMamtnNWRiblJFSkpESmpDTzNzSjZ4d0VCUmV2WmJSCnZtV2lkWkVnQnlPUFVsQUFBQUNrUnZZM1Z0Wlc1MFpYST0KLS0tLS1FTkQgT1BFTlNTSCBQUklWQVRFIEtFWS0tLS0tCg==","category":"page"},{"location":"publish_docs/#Add-the-keys-to-the-github-repository","page":"Publish Docs","title":"Add the keys to the github repository","text":"","category":"section"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"Warning: <s>Be careful to not introduce newlines or any other strange character when copying and pasting the keys. In particular, the secret must be all in one line. That was part of the problem.</s> fixed now by Chistopher","category":"page"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"The first key, starting with ssh-rsa must be copied as a new \"Deploy key` in the project, at (Currently at:","category":"page"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"Settings -> Deploy keys -> Add deploy key","category":"page"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"and the second key has to be copied to:","category":"page"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"Settings -> Secrets -> New repository secret ","category":"page"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"with the name DOCUMENTER_KEY.","category":"page"},{"location":"publish_docs/#Deployment-of-the-docs-of-a-previous-version","page":"Publish Docs","title":"Deployment of the docs of a previous version","text":"","category":"section"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"I went to the registered commit, which always have the following information, for example:","category":"page"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"git tag -a v0.4.11 -m \"<description of version>\" fbeec6a00adbd15053d297542e8354c457b2a610\ngit push origin v0.4.11","category":"page"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"and created a new tag adding +doc1 to the tag:","category":"page"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"git tag -a v0.4.11+doc1 -m \"v0.4.11\" fbeec6a00adbd15053d297542e8354c457b2a610\ngit push origin v0.4.11+doc1","category":"page"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"Then I had to go to the github page -> tags, and publish that release manually.","category":"page"},{"location":"publish_docs/","page":"Publish Docs","title":"Publish Docs","text":"Further discussion: Latest version of docs not published","category":"page"},{"location":"assignment/#Assignment-and-mutation","page":"Assignment and mutation","title":"Assignment and mutation","text":"","category":"section"},{"location":"assignment/","page":"Assignment and mutation","title":"Assignment and mutation","text":"From: Assignment and mutation","category":"page"},{"location":"assignment/","page":"Assignment and mutation","title":"Assignment and mutation","text":"The simplest version of this Stephan Karpinksy can come up with is this:","category":"page"},{"location":"assignment/","page":"Assignment and mutation","title":"Assignment and mutation","text":"Assignment changes which object a name refers to: x = ex causes the name x to refer to the value resulting from the evaluation of the expression ex. Assignment never changes the values of any objects.\nMutation changes the value of an object: x[i] = ex and x.f = ex both mutate the object referred to by x changing a value at index or a property with a name, respectively. Mutation never changes what objects any names in any scope refer to.","category":"page"},{"location":"assignment/","page":"Assignment and mutation","title":"Assignment and mutation","text":"Perhaps the confusion comes from the fact that these all use the = in their syntax? They’re really totally unrelated. It’s also possible that people think of assignment as setting a named property on some implicit “scope object”. That’s probably a view that can be worked out coherently, in which case having a clear notion of what all the different “scope objects” are would be crucial but I’m not entirely sure if that’s a helpful way to think about the matter or not.","category":"page"},{"location":"assignment/","page":"Assignment and mutation","title":"Assignment and mutation","text":"In summary:","category":"page"},{"location":"assignment/","page":"Assignment and mutation","title":"Assignment and mutation","text":"x=[2]  # x points to memory location m1\ny=x    # y points to memory location m1\nx=[3]  # x points to memory location m2, y still points to m1\nz=x    # z points to memory location m2\nx[1]=4 # m2 changes value in place, affecting all variables that point there","category":"page"},{"location":"assignment/","page":"Assignment and mutation","title":"Assignment and mutation","text":"julia> println(x,y,z)\n[4][2][4]\n","category":"page"},{"location":"#JuliaCookBook","page":"Home","title":"JuliaCookBook","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"A collection of explanations and tips to make the best use of Julia. Many answers are extracts from solutions provided to user questions in the Julia Discourse. ","category":"page"}]
}
