
# How to deploy the documentation of a project using TagBot and Documenter

**1. Create a file:** 

```
/home/user/.julia/dev/Project/.github/workflows/TagBot.yml
```
and add the content provided here: [TagBot.yml example](https://github.com/JuliaRegistries/TagBot/blob/master/README.md)

**2. Use `DocumenterTools` to generate the keys, with**

```
import DocumenterTools
DocumenterTools.genkeys()
```

which will output something like:

```
julia> DocumenterTools.genkeys()
[ Info: add the public key below to https://github.com/$USER/$REPO/settings/keys with read/write access:

ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDIIDDRX8DyLG... CCKQPTNei1Ng8b5d+a1ldnVSkgB0= Documenter

[ Info: add a secure environment variable named 'DOCUMENTER_KEY' to https://travis-ci.com/$USER/$REPO/settings (if you deploy using Travis CI) or https://github.com/$USER/$REPO/settings/secrets (if you deploy using GitHub Actions) with value:

LS0tLS1CRUdJTiBPUEVOU1NIIFBSSV... MGtyNng2VWR6WTFxckg1bkUyVGU2ajU3TUdveXpZL1EzTApoNGlqbE5NSWJTOFA2K2JNUkYxVFVCUzdQbC9mZDlTZWJKYTlKdWpMamtnNWRiblJFSkpESmpDTzNzSjZ4d0VCUmV2WmJSCnZtV2lkWkVnQnlPUFVsQUFBQUNrUnZZM1Z0Wlc1MFpYST0KLS0tLS1FTkQgT1BFTlNTSCBQUklWQVRFIEtFWS0tLS0tCg==
```

**3. Add the keys to the github repository:**

*Warning:* <s>Be careful to not introduce newlines or any other strange character when copying and pasting the keys. In particular, the secret must be all in one line. That was part of the problem.</s> fixed now by Chistopher

The first key, starting with `ssh-rsa ` must be copied as a new "Deploy key` in the project, at (Currently at:

`Settings -> Deploy keys -> Add deploy key`

and the second key has to be copied to:

`Settings -> Secrets -> New repository secret` 

with the name `DOCUMENTER_KEY`.

**4. If something went wrong with the deployment of the docs of a previous version:**

I went to the registered commit, which always have the following information, for example:

```
git tag -a v0.4.11 -m "<description of version>" fbeec6a00adbd15053d297542e8354c457b2a610
git push origin v0.4.11
```

and created a new tag adding `+doc1` to the tag:

```
git tag -a v0.4.11+doc1 -m "v0.4.11" fbeec6a00adbd15053d297542e8354c457b2a610
git push origin v0.4.11+doc1
```

Then I had to go to the github page -> tags, and publish that release manually.

Further discussion:
[Latest version of docs not published](https://discourse.julialang.org/t/latest-version-of-docs-not-published-github-actions-tagbot/50634/1)

