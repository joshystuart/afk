---
source: RchGrav/claudebox
kind: pull_request
number: 97
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/97
author: rdasilveiracabral
head: fix/mcp-cleanup-unbound-variable
base: main
created_at: 2026-01-18T10:12:45Z
updated_at: 2026-01-18T10:42:09Z
---

# fix: handle empty arrays with set -u (nounset) enabled

## Summary

- Fixes &#34;unbound variable&#34; errors when exiting claudebox or running commands with empty arrays
- Multiple functions failed because iterating over empty arrays with `set -u` enabled triggers errors
- Affected files: `lib/docker.sh`, `lib/cli.sh`, `lib/commands.profile.sh`, `lib/config.sh`, `main.sh`

## Changes

- Wrap array iterations in length checks: `if [[ ${#arr[@]} -gt 0 ]]`
- Use `${arr[@]+&#34;${arr[@]}&#34;}` pattern for safe array expansion
- Initialize global CLI arrays even when no args provided
- Convert `echo` to `printf` for portability

## Test plan

- [ ] Run `claudebox` with no arguments and exit - should not show &#34;unbound variable&#34; error
- [ ] Run `claudebox --verbose` to verify CLI parsing works with flags
- [ ] Run `claudebox profiles` to verify profile listing works
- [ ] Test with empty MCP config (no mcpServers defined)

🤖 Generated with [Claude Code](https://claude.ai/code)

## Summary by Sourcery

Handle empty arrays safely across CLI, Docker, and profile handling logic so claudebox works correctly with nounset enabled.

Bug Fixes:

- Prevent unbound variable errors when iterating over or expanding empty arrays in main CLI flow, Docker preflight, and profile handling code.
- Avoid failures when MCP temporary file lists or profile lists are empty by guarding loops and output against zero-length arrays.
- Fix Dockerfile template substitution to reliably replace profile installation and label placeholders and detect any unreplaced placeholders.

Enhancements:

- Initialize global CLI argument buckets even when no arguments are provided and use a safer array expansion pattern for parsed arguments.
- Improve debug output formatting by switching from echo to printf and making it robust to empty arrays.

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: fix: handle empty arrays with set -u (nounset) enabled
