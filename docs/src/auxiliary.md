# Some auxiliary functions to quickly retrieve some data 

## Get the protein sequence

To obtain a list of the residue names of the protein with three- and one-letter codes, use
```julia
julia> seq = getseq("file.pdb")
76×2 Array{String,2}:
 "VAL"  "V"
 "LYS"  "K"
 ⋮      
 "ARG"  "R"
 "GLY"  "G"

```

!!! note
    If there is some non-standard protein residue in the sequence,
    inform the `getseq` function by adding a selection:
    ```julia
    julia> getseq("file.pdb","protein or resname NEW")
    76×2 Array{String,2}:
     "VAL"  "V"
     "NEW"  "N"
     ⋮      
     "ARG"  "R"
     "GLY"  "G"
    ```

The `getseq` function can of course be used on an `Atom` list, accepts selections as the
last argument, as well as the reading and writing functions:

```julia
atoms = readPDB("file.pdb")
seq = getseq(atoms,"chain A")

```

## Obtain arrays with coordinates

All atoms:

```julia
julia> x = coor(atoms)
3×1463 Array{Float64,2}:
  -9.229  -10.048 …    6.408    6.017
 -14.861  -15.427    -12.034  -10.967
  -5.481   -5.569     -8.343   -9.713

```

Or use selections to retrieve the coordinates of subsets of atoms:

C``\alpha`` coordinates:

```julia
julia> xCA = coor(atoms,"name CA")
3×104 Array{Float64,2}:
  -8.483   -5.113  …  12.552   9.196 
 -14.912  -13.737      0.892  -0.734 
  -6.726   -5.466     -3.466  -4.108 

```

By default, the output arrays are column based (the x, y and z coordinates of each
atom are in each row). If you want a row-based output, add `column_based = false` to
the input parameters of `coor`: `coor(atoms,column_based=false)`

## Maximum and minimum coordinates of the atoms

Use `maxmin(atoms)`, or `maxmin(atoms,"resname CA")`, for example:

```julia
julia> m = maxmin(atoms,"chain A")

 Minimum atom coordinates: xmin = [-41.5, -41.526, -41.517]
 Maximum atom coordinates: xmax = [41.583, 41.502, 41.183]
 Length in each direction: xlength = [83.083, 83.028, 82.7]

```

`m` is a structure containing the three vectors with minimum and maximum
coordinates, and lengths.





