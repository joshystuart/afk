---
source: RchGrav/claudebox
kind: pull_request
number: 100
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/100
author: b00y0h
head: fix/entrypoint-local-outside-function
base: main
created_at: 2026-02-12T23:28:26Z
updated_at: 2026-02-12T23:46:41Z
---

# fix: remove `local` used outside functions in docker-entrypoint

## Summary

Remove three `local` keyword usages at top-level scope in `build/docker-entrypoint` (lines 86, 109, 141) that cause the container to fail on startup.

## Problem

The entrypoint script has `set -euo pipefail` and uses `local` outside of any function. Bash rejects this:

```
/usr/local/bin/docker-entrypoint: line 141: local: can only be used in a function
```

This causes the container to exit immediately after a successful build, making ClaudeBox unusable once profiles that trigger Python venv setup are enabled.

## Fix

Replace `local` with plain variable assignments. These variables (`wait_count`, `python_packages`) are already deeply nested in conditionals and don&#39;t need function-scoped locality.

Fixes #65

## Summary by Sourcery

Bug Fixes:

- Remove invalid uses of the bash `local` keyword at top-level scope in the docker entrypoint script that caused startup failures.

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: fix: remove `local` used outside functions in docker-entrypoint
