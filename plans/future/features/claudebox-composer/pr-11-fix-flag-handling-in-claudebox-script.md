---
source: RchGrav/claudebox
kind: pull_request
number: 11
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/11
author: RchGrav
head: codex/fix-command-pipeline-issue-with-claude
base: main
created_at: 2025-06-18T03:22:40Z
updated_at: 2025-06-23T05:39:58Z
---

# Fix flag handling in claudebox script

## Summary

- parse and strip security flags before passing args to Claude
- stop forwarding flags when running update/config commands
- include parsed flags when launching Docker container

## Testing

- `shellcheck claudebox`

---

https://chatgpt.com/codex/tasks/task_e_68521a6ba6148321a7881ab0d9cc070f

## Summary by Sourcery

Improve claudebox script’s flag handling by parsing, stripping, and correctly forwarding security flags, and ensure compliance with ShellCheck

Enhancements:

- Parse and strip security flags before passing arguments to Claude
- Prevent security flags from being forwarded during update and config commands
- Include parsed security flags when launching the Docker container

Tests:

- Validate script with ShellCheck

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: Fix flag handling in claudebox script
