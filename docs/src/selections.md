# [Selection functions](@id selections)

A simple selection syntax is provided. Use it with, for example: 

```julia
atoms = select(atoms,"protein and resnum < 30")
```

## General selections 

Accepted Boolean operators: `and`, `or`, and `not`. 

The accepted keywords for the selection are: 

| Keyword    | Options               | Input value | Example       | 
|:----------:|:---------------------:|:-----------:|:-------------:|
| `index`    | `=`,`>`,`<`,`<=`,`>=` | Integer     | `index <= 10` |
| `index_pdb`| `=`,`>`,`<`,`<=`,`>=` | Integer     | `index_pdb <= 10` |
| `name`     |                       | String      | `name CA`     |
| `element`  |                       | String      | `element N`   |
| `resname`  |                       | String      | `resname ALA` |
| `resnum`   | `=`,`>`,`<`,`<=`,`>=` | Integer     | `resnum = 10` |
| `residue`  | `=`,`>`,`<`,`<=`,`>=` | Integer     | `residue = 10`|
| `chain`    |                       | String      | `chain A`     |
| `model`    |                       | Integer     | `model 1`     |
| `b`        | `=`,`>`,`<`,`<=`,`>=` | Real        | `b > 0.5`     |
| `occup`    | `=`,`>`,`<`,`<=`,`>=` | Real        | `occup >= 0.3`|
| `segname`  |                       | String      | `segname PROT`|
|            |                       |             |               |

!!! note
    `resnum` is the residue number as written in the PDB file, while `residue`
    is the residue number counted sequentially in the file.

    `index_pdb` is the number written in the "atom index" field of the PDB file,
    while `index` is the sequential index of the atom in the file. 


## Special macros: proteins, water

Just use these keywords to select the residues matching the properties
desired. 

Examples:
```julia
aromatic = select(atoms,"aromatic")

```
```julia
aromatic = select(atoms,"charged")

```

Available keywords:

| Keywords      |               |               |
|:-------------:|:-------------:|:-------------:|
| `water`       |               |               |
| `protein`     | `backbone`    | `sidechain`   |
| `acidic`      | `basic`       |               |
| `aliphatic`   | `aromatic`    |               |
| `charged`     | `neutral`     |               |
| `polar`       | `nonpolar`    |               |
| `hydrophobic` |               |               |
|               |               |               |

!!! note  
    The properties refer to protein residues and will return `false`
    to every non-protein residue. Thus, be careful with the use of `not`
    with these selections, as they might retrieve non-protein atoms.


### Retrieving indexes only 

If only the indexes of the atoms are of interest, a specific function
will directly return them:

```julia
indexes = selindex(atoms,"protein and name CA")

```

!!! note
    All indexing is 1-based. Thus, the first atom of the structure is atom 1.

## Use Julia anonymous functions directly

Selections can be done using Julia anonymous functions directly, providing a greater
control over the selection and, possibly, the use of user defined selection 
functions. For example:

```julia
atoms = select(atoms, by = atom -> atom.x < 10.)

```
With that, selections can become really complex, as:
```julia
sel = atom -> (atom.x < 10. && atom.resname == "GLY") || (atom.name == "CA") 
atoms = select(atoms, by = sel )

```






