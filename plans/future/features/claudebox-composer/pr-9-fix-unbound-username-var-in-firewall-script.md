---
source: RchGrav/claudebox
kind: pull_request
number: 9
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/9
author: RchGrav
head: codex/fix-unbound-variable-username-in-init-firewall.sh
base: main
created_at: 2025-06-17T00:55:00Z
updated_at: 2025-06-23T05:39:59Z
---

# Fix unbound USERNAME var in firewall script

## Summary

- avoid unbound variable error by defaulting `USERNAME` in `init-firewall.sh`

## Testing

- `git status --short`

---

https://chatgpt.com/codex/tasks/task_e_6850bb97e12c8321a8240e2baf1c6bca

## Summary by Sourcery

Bug Fixes:

- Default the USERNAME variable in init-firewall.sh to avoid unbound variable errors.

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: Fix unbound USERNAME var in firewall script
