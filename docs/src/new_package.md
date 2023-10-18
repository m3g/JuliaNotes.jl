
# How to create a new package

### Create the github repository

Create an *EMPTY* repository on github, with your package name followed by `.jl`. For example: 
```
https://github.com/lmiq/MyPackage.jl
```

### Use `PkgTemplates` to create the minimal package structure:

```julia
using PkgTemplates
tpl = Template(user="lmiq", julia=v"1.9", plugins=[Git(ssh=true)])
tpl("MyPackage")
```

This will create the `.julia/dev/MyPackage` directory with the content inside. 

### Push the content to the repository for the first time 

Navigate to the package directory, and push the content:

```
cd ~/.julia/dev/MyPackage
git push --set-upstream origin main
```
(`main` was `master` in older github repositories)

(From: [this thread](https://discourse.julialang.org/t/upload-new-package-to-github/56783/14)). Another useful post, with some additional information on how to create the package using the Github Desktop, is available [here](https://discourse.julialang.org/t/trouble-publishing-my-first-package-to-github/93293/5?u=lmiq). 
