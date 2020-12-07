# Atom properties

Some simple atom properties can be retrieved using special functions, which
operate on atoms of the type `Atom`. For example:

```julia
julia> atoms = readPDB("./file.pdb");

julia> atoms[1]
   PDBTools.Atom with fields:
   index name resname chain   resnum  residue        x        y        z     b occup model segname index_pdb
       1   OW     SOL     X        1        1   54.370   45.310   33.970  0.00  0.00     1       -         1

julia> mass(atoms[1])
14.0067

julia> name(atoms[1])
"Nitrogen"

julia> atomic_number(atoms[1])
7

julia> element(atoms[1])
"N"

```
