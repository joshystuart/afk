---
source: RchGrav/claudebox
kind: pull_request
number: 73
state: open
url: https://github.com/RchGrav/claudebox/pull/73
author: fletchgqc
created_at: 2025-09-11
---

# Fix MCP cleanup trap scoping issue

Fixes an `EXIT` trap that referenced `local` variables after their defining function returned, which breaks cleanup when Bash destroys function scope. Ensures MCP teardown runs reliably without spurious errors on script exit.

---

## AFK Relevance

| Field                 | Value                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | MCP integration                                                                                                            |
| **Theme key**         | mcp                                                                                                                        |
| **Short description** | Correct trap scoping is critical for graceful MCP shutdown—relevant to any AFK code that registers cleanup on session end. |
