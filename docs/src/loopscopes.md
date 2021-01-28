# Scope behavior of loops

You will find long and exhaustive threads discussing how Julia ended up
with the current scoping rules and behavior, 
and why it is a good compromise between the pros and
cons of many other alternatives. Just search for "scoping rules" in the
Discourse forum.

My perhaps didactic explanation on the choices made is below. I
understand that scopes, at least in this context, can be understood as
blocks of code that can be compiled and executed independently. One
wants the compiler to have as much information as possible concerning
the variables of that code block, such that it can specialize the code
to the types of variables inside the block. With that image in mind, we
have: 

- Ideally one would like that a loop like 

  ```julia
  s = 0.
  for i in 1:3
    s = s + i
  end
  ```
  
  worked always and modified `s` as intended. Yet, in Julia, for
  performance reasons, the `for ` loop introduces a new scope, where the
  variables may be inferred by the compiler to remain with constant types
  during the loop execution. If the variable `s` is global, that means that
  its type can be changed from outside the loop. 
  Therefore, writing a loop that makes reference to a global variable
  cannot be simply accepted without notice. 

- There is no problem in writing such a loop inside a function, because
  there the types of the variables are constant except if modified by
  some operation inside the function itself. In that case the loop
  performs well. No problems there.

- That loop written in the global scope will be problematic (slow)
  because `s` might not have a constant type. That is, since the type of 
  `s` can change outside the loop, the compiler cannot specialize the
  operations of the loop to the type of `s`. Thus, one should warn the
  user that that is not a good programming style. Previously, because of
  that, it was required that the use of the global variable was
  explicit:
  ```julia-repl
  julia> s = 0.
         for i in 1:3
           global s
           s = s + i
         end
  ```
  However, this was inconvenient, because one was not able to copy and
  paste a code from a function to the REPL. Thus, since Julia 1.5, it
  was decided that at the REPL the code without the explicit `global s` 
  declaration will work. The `s` variable is still global and the loop
  will not be efficient, but this in this context it is acceptable 
  because nobody writes critical code directly to the REPL.

- That leaves the possibility of writing such loops inside files,
  outside functions. For example, defining a file `myloop.jl` with
  that loop coded directly inside it, and executing the code in
  the global scope with: 
  ```julia-repl
  julia> include("./myloop.jl")
  ```
  A programmer can be tempted to write critical code
  inside a file in such a way and, while that is not impossible, it must
  be discouraged. Thus, the choice was to raise a Warning and an Error associated with
  the possible scoping problems of that loop if it is written as if it was
  in the global scope of that file: 
  ```julia-repl
  julia> include("./myloop.jl")
  ┌ Warning: Assignment to `s` in soft scope is ambiguous because a global
  variable by the same name exists: `s` will be treated as a new local.
  Disambiguate by using `local s` to suppress this warning or `global s`
  to assign to the existing global variable.
  └ @ ~/Drive/Work/JuliaPlay/myloop.jl:3
  ERROR: LoadError: UndefVarError: s not defined
  ```
  The warning is clear and is saying:
  don't  do that, unless you are really really aware of its
  consequences, and in that case declare `s` as global explicitly.

