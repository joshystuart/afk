---
source: RchGrav/claudebox
kind: issue
number: 2
state: closed
url: https://github.com/RchGrav/claudebox/issues/2
author: micheledicosmo
comments: 1
created_at: 2025-06-11T14:21:14Z
updated_at: 2025-06-16T08:18:16Z
---

# First run error `./claudebox: line 218: declare: -A: invalid option`

Error when running claudebox:

`./claudebox: line 218: declare: -A: invalid option`

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: First run error `./claudebox: line 218: declare: -A: invalid option` — Bash 3.2 / `set -u` / `local` misuse / array expansion bugs break install and entrypoints on macOS and strict shells.
