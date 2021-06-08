
# How to create a new package

## Create the github repository

Create the repository on github. For example `https://github.com/lmiq/MyPackage.jl`. When creating it, add one file, for example the README.md (the content will be discarded).

## Use `PkgTemplates` to create the minimal package structure:

```julia
using PkgTemplates
tpl = Template(user="lmiq")
tpl("MyPackage")
```

This will create the `.julia/dev/MyPackage` directory with the content inside. 

## Clone the github repository somewhere else: 
```
cd ~/Downloads
git clone https://github.com/lmiq/MyPackage.jl
```

## Replace the .git directory on `.julia/dev/MyPackage`

Remove the `.git` directory from the `.julia/dev/MyPackage` folder and replace it with the `.git` from `Downloads/MyPackage.jl`:
```
rm -rf ~/.julia/dev/MyPackage/.git
cp -r ~/Downloads/MyPackage/.git ~/.julia/dev/MyPackage
```

## Push the package to the repository:
```
cd ~/.julia/dev/MyPackage
git add -A
git commit -m "first commit"
git push
```

You can safely delete the `~/Downloads/MyPackage.jl` directory.




