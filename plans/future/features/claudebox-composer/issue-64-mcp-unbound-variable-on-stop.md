---
source: RchGrav/claudebox
kind: issue
number: 64
state: open
url: https://github.com/RchGrav/claudebox/issues/64
author: fletchgqc
comments: 3
created_at: 2025-09-01T12:03:42Z
updated_at: 2025-11-25T17:30:56Z
---

# MCP unbound variable on stop

I get this and nonzero exit every time I stop claudebox. It still works fine, so it&#39;s just an annoyance:

`~/.claudebox/source/lib/docker.sh: line 306: user_mcp_file: unbound variable`

## AFK planning summary

- **Category**: MCP wiring, cleanup bugs, and discoverability
- **Theme key**: `mcp`
- **Short description**: MCP unbound variable on stop — MCP temp config cleanup references out-of-scope locals; MCP setup hard to discover.
