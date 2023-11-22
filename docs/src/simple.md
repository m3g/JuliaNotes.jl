# How to write *simple* yet *performant* Julia code

!!! note
    There is nothing original in this text. You can find all the tips and much more in the usual [performance tips](https://docs.julialang.org/en/v1/manual/performance-tips/) available in the Julia standard documentation page. This is, nevertheless, a guide to new users that are perhaps confused with too much information. 

!!! warning
    The claims and suggestions in this text are to be taken with a grain of salt. Experienced Julia users may well use other features of the language to code, and do not follow the following guidelines. Yet, it is the personal opinion of the author that new Julia users should more or less follow the advice provided here.

    Additionally, the suggestions here are not exhaustive. As one learns the language, it is natural that new coding patterns, features and tricks will be used. 

## Motivation

Julia is a high-level language with a very powerful and expressive syntax. It can be used to write code as fast as C, C++, Rust, or Fortran. However, benchmarks games make coders on all languages use and abuse all sort of tricks or low-level strategies to obtain the fastest code possible. Many times this makes the codes obscure, and outsiders have the impression that writing code with good performance is something difficult that requires and extreme level of specialization. That is not the case in Julia (and, for what is worth, not in Fortran either, in which the author has some experience). Julia can be performant and at the same time simple, and the user should not be distracted by the language while improving what is most important: the algorithms. Following some simple rules, while keeping the code clean and simple, is enough to obtain Julia code that runs close to optimal speed.  

## Summary: the rules

### What you need:

1. Write the code that requires performance in functions.
2. Make these functions self-contained. They work on input data (parameters) only, and return the result.
3. Create your data and data containers outside the functions, pass them as parameters
4. Learn when and how new arrays are created, and avoid that in loops.

### What you don't need:

5. Never use global variables inside your functions. Ever. None.
6. You don't need macros. Certainly not writing one. Using one, in very exceptional cases.
7. You don't need complicated code. Improve your algorithm.

## The functions

A function is a code block that given a set of input values, the parameters, return one or more results computed
from those parameters. In Julia it is fundamental to write performance critical code as functions, as these are the units 
that compiled and specialized for the input given. Making the functions self-contained, meaning that they work on the 
input data *only* is what allows much of the specialization and performance.

```julia
function gravitational_energy(x, m; G = 9.8135)
    u = 0.0
    for i in eachindex(x)
        for j in i+1:lastindex(x)
            u += m[i] * m[j] / norm(x[i] - x[j])
        end
    end
    return G * u
end
```










