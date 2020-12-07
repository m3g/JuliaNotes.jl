# Read and write files

## Read a PDB file

To read a PDB file and return a vector of atoms of
type `Atom`, do:
```julia
atoms = readPDB("file.pdb")

```

`Atom` is the structure of data containing the atom index, name,
residue, coordinates, etc. For example, after reading a file (as shown
bellow), a list of atoms with the following structure will be generated:

```julia
julia> atoms[1]
   PDBTools.Atom with fields:
   index name resname chain   resnum  residue        x        y        z     b occup model segname index_pdb
       1    N     ALA     A        1        1   -9.229  -14.861   -5.481  0.00  1.00     1    PROT         1

```

The data in the `Atom` structure is organized as follows:
```julia
struct Atom
  index :: Int64 # The sequential index of the atoms in the file
  index_pdb :: Int64 # The index as written in the PDB file (might be anything)
  name :: String
  resname :: String
  chain :: String
  resnum :: Int64 # Number of residue as written in PDB file
  residue :: Int64 # Sequential residue (molecule) number in file
  x :: Float64
  y :: Float64
  z :: Float64
  b :: Float64
  occup :: Float64
  model :: Int64
  segname :: String # Segment name (cols 73:76)
end
```

!!! tip
    For all these reading and writting functions, a final argument can be provided
    to read or write a subset of the atoms, following the selection syntax described 
    in the [Selection](@ref selections) section. For example:
    ```julia
    protein = readPDB("file.pdb","protein")

    ```
    or
    ```julia
    arginines = readPDB("file.pdb","resname ARG")

    ```
    The only difference is that, if using Julia anonymous functions, the
    keyword is `only`:
    ```julia
    arginines = readPDB("file.pdb",only = atom -> atom.resname == "ARG")

    ```
    The same is valid for the `write` function, below. 
      
## Retrive from Protein Data Bank

Use the `wget` function to retrieve the atom data directly from the PDB database,
optionally filtering the atoms with a selection:

```
julia> atoms = wget("1LBD","name CA")
   Array{Atom,1} with 238 atoms with fields:
   index name resname chain   resnum  residue        x        y        z     b occup model segname index_pdb
       2   CA     SER     A      225        1   46.080   83.165   70.327 68.73  1.00     1       -         2
       8   CA     ALA     A      226        2   43.020   80.825   70.455 63.69  1.00     1       -         8
      13   CA     ASN     A      227        3   41.052   82.178   67.504 53.45  1.00     1       -        13
                                                       ⋮
    1847   CA     GLN     A      460      236  -22.650   79.082   50.023 71.46  1.00     1       -      1847
    1856   CA     MET     A      461      237  -25.561   77.191   51.710 78.41  1.00     1       -      1856
    1864   CA     THR     A      462      238  -26.915   73.645   51.198 82.96  1.00     1       -      1864

```

## Edit a PDB file

The `Atom` structure is mutable, meaning that the fields can be edited. For example:

```julia
julia> atoms = readPDB("file.pdb")
   Array{PDBTools.Atom,1} with 62026 atoms with fields:
   index name resname chain   resnum  residue        x        y        z     b occup model segname index_pdb
       1    N     ALA     A        1        1   -9.229  -14.861   -5.481  0.00  1.00     1    PROT         1
       2  HT1     ALA     A        1        1  -10.048  -15.427   -5.569  0.00  0.00     1    PROT         2
       3  HT2     ALA     A        1        1   -9.488  -13.913   -5.295  0.00  0.00     1    PROT         3

julia> atoms[1].segname = "ABCD"
"ABCD"

julia> atoms[1]
   PDBTools.Atom with fields:
   index name resname chain   resnum  residue        x        y        z     b occup model segname index_pdb
       1    N     ALA     A        1        1   -9.229  -14.861   -5.481  0.00  1.00     1    ABCD         1

```

Additionally, With the `edit!` function, you can directly edit or view the data in a
vector of `Atoms` in your preferred text editor. 

```julia

julia> edit!(atoms)

```

This will open a text editor, and we changed the data in the `resname` field of the first atom
to `ABC`. Saving and closing the file will update the `atoms` array:

```julia

julia> atoms[1]
   PDBTools.Atom with fields:
   index name resname chain   resnum  residue        x        y        z     b occup model segname index_pdb
       1    N     ABC     A        1        1   -9.229  -14.861   -5.481  0.00  1.00     1    PROT         1

```

## Write a PDB file

To write a PDB file use the `writePDB` function, as:

```julia
writePDB(atoms,"file.pdb")

```
where `atoms` contain a list of atoms with the `Atom` structures.

# Read and write single-atom lines 

`PDBTools.read_atom(pdb_line)`: Given a line of a PDB file containing atom data,
returns the data in a `Atom` structure. 

`PDBTools.write_atom(atom::Atom)`: Given an atom in the `Atom` structure, returns
a string formatted in the PDB format, to be written to a file. 

