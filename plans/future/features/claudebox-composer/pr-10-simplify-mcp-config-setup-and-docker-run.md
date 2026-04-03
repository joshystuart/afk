---
source: RchGrav/claudebox
kind: pull_request
number: 10
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/10
author: RchGrav
head: codex/refactor-mcp-configuration-and-docker-setup
base: main
created_at: 2025-06-18T01:46:46Z
updated_at: 2025-06-18T03:43:39Z
---

# Simplify MCP config setup and docker run

## Summary

- write the global mcp config only when it doesn&#39;t exist
- streamline the docker run command and pass the mcp config

## Testing

- `bash -n claudebox`

---

https://chatgpt.com/codex/tasks/task_e_6850c19360c08321b288c5e51132f424

## Summary by Sourcery

Simplify the MCP configuration setup and docker run invocation in the claudebox script.

Enhancements:

- Write the global MCP config only when it doesn’t already exist
- Streamline the docker run command to mount and pass the MCP config file

Tests:

- Add a bash syntax check for the claudebox script

## AFK planning summary

- **Category**: MCP wiring, cleanup bugs, and discoverability
- **Theme key**: `mcp`
- **Short description**: Simplify MCP config setup and docker run
