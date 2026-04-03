---
source: RchGrav/claudebox
kind: pull_request
number: 57
state: open
url: https://github.com/RchGrav/claudebox/pull/57
author: prateekmedia
created_at: 2025-08-27
---

# fix: line 304 user_mcp_file unbound variable

Fixes an unbound variable error for `user_mcp_file` when the script exits under `set -u`, so teardown and MCP-related paths do not crash after MCP configuration. Ensures cleanup paths reference variables safely when optional MCP files are absent.

---

## AFK Relevance

| Field                 | Value                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | MCP integration                                                                                                                  |
| **Theme key**         | mcp                                                                                                                              |
| **Short description** | AFK orchestrates Claude with MCP; stable MCP config and shutdown behavior avoids session teardown failures visible to end users. |
