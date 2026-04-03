---
source: RchGrav/claudebox
kind: issue
number: 75
state: closed
url: https://github.com/RchGrav/claudebox/issues/75
author: xobosox
comments: 0
created_at: 2025-09-14T06:36:03Z
updated_at: 2025-09-15T03:12:38Z
---

# MCP Servers not visible and another question

I have a brownfield project that I&#39;m trying to use this tool on. Is there a recommended workflow for where to start? ie. Do we start with /cbox:tdd or /cbox:adaptive or even /cbox:agentflow ? The goal is to document the code, review and refactor it, fix issues, test it, and then finally I&#39;ll be adding new features.

Also (from the title of this issue). After first running claudebox in my project, I noticed there are no MCP servers loaded at all, so I asked /cbox:agentflow to review the project and create any necessary MCP servers to help with my project goals. It went ahead and did it, then I updated the .env.mcp with the requested info, but after rerunning claudebox, there are still no MCP&#39;s loaded at all. Are there any instructions/suggestions for how to get the MCP&#39;s working (I RTFM, but couldn&#39;t find any info).

Great project by the way.

## AFK planning summary

- **Category**: MCP wiring, cleanup bugs, and discoverability
- **Theme key**: `mcp`
- **Short description**: MCP Servers not visible and another question — MCP temp config cleanup references out-of-scope locals; MCP setup hard to discover.
