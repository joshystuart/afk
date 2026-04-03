---
source: RchGrav/claudebox
kind: issue
number: 80
state: open
url: https://github.com/RchGrav/claudebox/issues/80
author: jeff-r-skillrev
created_at: 2025-09-26T00:00:00Z
---

# .git not mounted in ClaudeBox

Project workspace is mounted but **`.git` is excluded or invisible**, so **`git` commands, history, and branch-aware tools fail** inside the container. Users need the repo metadata available (with appropriate safety docs).

## AFK Relevance

| Field                 | Value                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Category**          | Git integration                                                                                                |
| **Theme key**         | `git_integration`                                                                                              |
| **Short description** | AFK should clarify whether `.git` is mounted for sessions; many Claude Code workflows assume full repo access. |
