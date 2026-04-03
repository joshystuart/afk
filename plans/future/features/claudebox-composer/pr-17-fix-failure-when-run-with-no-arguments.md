---
source: RchGrav/claudebox
kind: pull_request
number: 17
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/17
author: sgrimm
head: no-args
base: main
created_at: 2025-06-19T21:53:17Z
updated_at: 2025-06-20T03:43:33Z
---

# Fix failure when run with no arguments

Running `claudebox` with no arguments was failing with an unbound
variable error because the start script was trying to test the value
of the first command-line argument.

## Summary by Sourcery

Bug Fixes:

- Add a conditional check to prevent unbound variable errors when running without any arguments

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: Fix failure when run with no arguments
