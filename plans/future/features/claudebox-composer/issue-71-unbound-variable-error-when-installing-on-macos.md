---
source: RchGrav/claudebox
kind: issue
number: 71
state: open
url: https://github.com/RchGrav/claudebox/issues/71
author: hcoura
comments: 10
created_at: 2025-09-09T20:31:39Z
updated_at: 2026-02-12T16:38:09Z
---

# unbound variable error when installing on macos

just did the install instructions, during ./claudebox.run I get the following:

`.../.claudebox/source/lib/cli.sh: line 22: all_args[@]: unbound variable`

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: unbound variable error when installing on macos — Bash 3.2 / `set -u` / `local` misuse / array expansion bugs break install and entrypoints on macOS and strict shells.
