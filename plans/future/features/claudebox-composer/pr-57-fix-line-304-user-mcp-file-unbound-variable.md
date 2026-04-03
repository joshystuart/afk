---
source: RchGrav/claudebox
kind: pull_request
number: 57
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/57
author: prateekmedia
head: fix-not-found-issue
base: main
created_at: 2025-08-27T11:19:07Z
updated_at: 2025-08-27T11:19:42Z
---

# fix: line 304 user_mcp_file: unbound variable

Whenever I am exiting claudebox it is giving this error. This PR gives a default value to that variable as empty and fixes this issue. Issue is reproducible on main.

## Summary by Sourcery

Bug Fixes:

- Use default empty expansions for user_mcp_file and project_mcp_file to avoid unbound variable errors

## AFK planning summary

- **Category**: MCP wiring, cleanup bugs, and discoverability
- **Theme key**: `mcp`
- **Short description**: fix: line 304 user_mcp_file: unbound variable
