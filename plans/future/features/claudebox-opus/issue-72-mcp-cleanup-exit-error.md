---
source: RchGrav/claudebox
kind: issue
number: 72
state: open
url: https://github.com/RchGrav/claudebox/issues/72
author: fletchgqc
created_at: 2025-09-11T00:00:00Z
---

# MCP cleanup causes exit error

**EXIT trap** for MCP cleanup references **locals or variables from a destroyed scope**, causing errors on shell exit. Cleanup logic needs to use globals or capture state before subshell/function scope ends.

## AFK Relevance

| Field                 | Value                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Category**          | MCP                                                                                                               |
| **Theme key**         | `mcp`                                                                                                             |
| **Short description** | Trap handlers must not rely on out-of-scope `local` variables; AFK’s MCP teardown should follow the same pattern. |
