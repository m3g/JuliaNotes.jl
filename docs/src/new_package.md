
# How to create a new package

### Create the github repository

Create an *EMPTY* repository on github, with your package name followed by `.jl`. For example: 
```
https://github.com/lmiq/MyPackage.jl
```

### Use `PkgTemplates` to create the minimal package structure:

```julia
using PkgTemplates
tpl = Template(user="lmiq")
tpl("MyPackage")
```

This will create the `.julia/dev/MyPackage` directory with the content inside. 

### Push the content to the repository for the first time 

Navigate to the package directory, and push the content:

```
cd ~/.julia/dev/MyPackage
git push --set-upstream origin master
```

(From: [this thread](https://discourse.julialang.org/t/upload-new-package-to-github/56783/14))
