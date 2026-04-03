---
source: RchGrav/claudebox
kind: pull_request
number: 92
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/92
author: haveaguess
head: fix/unbound-variable-empty-arrays
base: main
created_at: 2025-12-15T23:00:05Z
updated_at: 2026-01-07T10:47:39Z
---

# Fix unbound variable errors when running with set -u

I let Claude Code have a go at fixing, this works for me, but haven&#39;t reviewed at this time:

## Summary

- Fixes bash &#34;unbound variable&#34; errors when claudebox is run without arguments
- Uses safe array expansion syntax `${array[@]+&#34;${array[@]}&#34;}` for all CLI arrays
- Ensures compatibility with `set -euo pipefail` strict mode

## Problem

When `main.sh` runs with `set -euo pipefail` (line 11), empty bash arrays cause &#34;unbound variable&#34; errors. This occurs when claudebox is run without arguments, causing `CLI_PASS_THROUGH`, `CLI_CONTROL_FLAGS`, and `CLI_HOST_FLAGS` arrays to be empty.

Example error:

```
/Users/benritchie/.claudebox/source/lib/cli.sh: line 22: all_args[@]: unbound variable
```

## Solution

Use the `${array[@]+&#34;${array[@]}&#34;}` syntax which only expands if the array has elements, providing safe expansion for empty arrays under strict mode.

## Files Changed

- `lib/cli.sh` - Fixed array expansions in parse_cli_args, export statements, process_host_flags, and debug_parsed_args
- `main.sh` - Fixed array expansions in dispatch_command calls, preflight_check, run_claudebox_container calls, and for loops

## Test plan

- [x] Run `claudebox` without arguments - no longer errors
- [x] Run `claudebox create` - creates slot successfully
- [x] Run `claudebox help` - displays help

Fixes #90

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## Summary by Sourcery

Ensure bash CLI scripts handle empty arrays safely under strict shell options.

Bug Fixes:

- Prevent unbound variable errors when running without CLI arguments under `set -euo pipefail` by using safe array expansion for all argument arrays.

Enhancements:

- Standardize safe array handling in CLI parsing, dispatching, and container invocation paths to improve robustness in strict bash mode.

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: Fix unbound variable errors when running with set -u
