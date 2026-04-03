---
source: RchGrav/claudebox
kind: pull_request
number: 16
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/16
author: sgrimm
head: rebuild-var
base: main
created_at: 2025-06-19T21:53:05Z
updated_at: 2025-06-20T02:42:22Z
---

# Fix unbound variable on &#34;rebuild&#34; command

Running `claudebox rebuild` failed because the image name was being
referenced before it was calculated. Do the calculation earlier.

## Summary by Sourcery

Bug Fixes:

- Resolve unbound variable error in the rebuild command by precomputing the image name

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: Fix unbound variable on &#34;rebuild&#34; command
