---
source: RchGrav/claudebox
kind: issue
number: 64
state: open
url: https://github.com/RchGrav/claudebox/issues/64
author: fletchgqc
created_at: 2025-09-01T00:00:00Z
---

# MCP unbound variable on stop

On exit/stop, the shell reports **`user_mcp_file` unbound variable** (often with `set -u`), breaking clean shutdown. Likely a cleanup path referencing a variable that is only set in some code paths.

## AFK Relevance

| Field                 | Value                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Category**          | MCP                                                                                                               |
| **Theme key**         | `mcp`                                                                                                             |
| **Short description** | MCP lifecycle hooks must be robust under `nounset`; AFK’s MCP integration should avoid similar trap/cleanup bugs. |
