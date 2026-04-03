---
source: RchGrav/claudebox
kind: pull_request
number: 12
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/12
author: RchGrav
head: xwwkag-codex/fix-command-pipeline-issue-with-claude
base: main
created_at: 2025-06-18T03:48:12Z
updated_at: 2025-06-23T05:39:57Z
---

# Fix flag handling in claudebox script

## Summary

- parse and strip security flags before passing args to Claude
- keep default flags enabled for update/config commands
- include default and parsed flags when launching Docker

## Testing

- `shellcheck claudebox`
- `bash -n claudebox`

---

https://chatgpt.com/codex/tasks/task_e_68521a6ba6148321a7881ab0d9cc070f

## Summary by Sourcery

Fix how the claudebox script processes command-line flags by parsing and stripping security options, preserving defaults for specific commands, and passing the resulting flags when launching the Docker container.

Bug Fixes:

- Parse and strip security flags before forwarding arguments to Claude

Enhancements:

- Preserve default flags for update and config commands
- Include both default and user-provided flags when starting the Docker container

Tests:

- Add shellcheck and Bash syntax validation for the claudebox script

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: Fix flag handling in claudebox script
