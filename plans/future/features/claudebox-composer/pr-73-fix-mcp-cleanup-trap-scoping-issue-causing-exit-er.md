---
source: RchGrav/claudebox
kind: pull_request
number: 73
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/73
author: fletchgqc
head: fix/mcp-exit-trap-scoping
base: main
created_at: 2025-09-11T10:12:11Z
updated_at: 2025-09-11T10:13:12Z
---

# Fix MCP cleanup trap scoping issue causing exit errors

Fixes #72

## Summary

This PR fixes the bash &#34;unbound variable&#34; errors that occur when ClaudeBox exits with MCP servers configured. The issue was caused by EXIT traps not having access to local variables from the function where they&#39;re defined.

## Changes Made

- Simplified `cleanup_mcp_files()` to only use `mcp_temp_files` array
- Added `user_mcp_file` to `mcp_temp_files` array for proper cleanup tracking
- Added parameter expansion safety (`${mcp_temp_files[@]:-}`) to handle empty arrays
- Removed direct variable access in cleanup function that caused scoping issues

## Technical Details

The core issue was that EXIT traps execute in a different context where function-local variables are not accessible:

```bash
run_claudebox_container() {
    local user_mcp_file=&#34;&#34;      # Function-scoped
    local project_mcp_file=&#34;&#34;   # Function-scoped

    cleanup_mcp_files() {
        # Trap runs when script exits - function scope is gone!
        if [[ -n &#34;$user_mcp_file&#34; ]]; then  # ERROR: unbound variable
            rm -f &#34;$user_mcp_file&#34;
        fi
    }
    trap cleanup_mcp_files EXIT
}
```

The fix ensures all temporary files are tracked in the `mcp_temp_files` array which is accessible to the EXIT trap, eliminating the scoping issue entirely.

## Testing

- ✅ Bash syntax validation passes (`bash -n lib/docker.sh`)
- ✅ No more &#34;unbound variable&#34; errors on exit
- ✅ All MCP temp files still cleaned up properly
- ✅ Exit code 0 instead of 1

## Impact

- Fixes user-visible errors on every ClaudeBox exit with MCP servers
- Resolves exit code 1 that can break scripts and automation
- Improves reliability of the cleanup process
- Fully backwards compatible - only improves the cleanup mechanism

The fix eliminates a bash scoping anti-pattern and makes the cleanup process more predictable and maintainable.

## Summary by Sourcery

Fix trap scoping issue in cleanup_mcp_files by consolidating MCP temp files into a single array accessible to the EXIT trap, eliminating unbound variable errors and restoring exit code 0.

Bug Fixes:

- Avoid bash &#34;unbound variable&#34; errors on exit by removing direct access to function-scoped variables in the cleanup trap
- Restore exit code 0 by ensuring cleanup_mcp_files always runs without error

Enhancements:

- Simplify cleanup_mcp_files to iterate solely over mcp_temp_files with safe parameter expansion
- Add user and project MCP config files to mcp_temp_files array for consistent tracking and removal

## AFK planning summary

- **Category**: MCP wiring, cleanup bugs, and discoverability
- **Theme key**: `mcp`
- **Short description**: Fix MCP cleanup trap scoping issue causing exit errors
