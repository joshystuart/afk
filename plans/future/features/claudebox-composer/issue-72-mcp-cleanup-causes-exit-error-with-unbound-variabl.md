---
source: RchGrav/claudebox
kind: issue
number: 72
state: open
url: https://github.com/RchGrav/claudebox/issues/72
author: fletchgqc
comments: 0
created_at: 2025-09-11T10:11:48Z
updated_at: 2025-09-11T10:11:48Z
---

# MCP cleanup causes exit error with unbound variable

## Bug Description

ClaudeBox consistently exits with error code 1 when MCP servers are configured, displaying:

```bash
/Users/me/.claudebox/source/lib/docker.sh: line 327: user_mcp_file: unbound variable
```

## Steps to Reproduce

1. Configure MCP servers (either user or project level)
2. Run any ClaudeBox command
3. Exit ClaudeBox
4. Observe the &#34;unbound variable&#34; error and exit code 1

## Expected Behavior

ClaudeBox should exit cleanly without errors, properly cleaning up temporary MCP files.

## Actual Behavior

- Exit with error code 1
- &#34;unbound variable&#34; error message displayed
- May impact automation/scripts that check exit codes

## Root Cause Analysis

The issue is in the `cleanup_mcp_files()` EXIT trap function in `lib/docker.sh`. The trap tries to access `user_mcp_file` and `project_mcp_file` variables that were declared as `local` in the `run_claudebox_container()` function.

EXIT traps execute in a different context where these local variables are not accessible - when the script exits, the function&#39;s local scope is already destroyed.

## Impact

- Users see confusing error messages on every exit
- Exit code 1 can break automation/scripts
- Indicates potential cleanup issues

## Proposed Solution

- Simplify cleanup to only use the `mcp_temp_files` array
- Ensure all temp files are added to the array consistently
- Remove direct variable access in cleanup function
- Add parameter expansion safety for empty arrays

## AFK planning summary

- **Category**: MCP wiring, cleanup bugs, and discoverability
- **Theme key**: `mcp`
- **Short description**: MCP cleanup causes exit error with unbound variable — MCP temp config cleanup references out-of-scope locals; MCP setup hard to discover.
