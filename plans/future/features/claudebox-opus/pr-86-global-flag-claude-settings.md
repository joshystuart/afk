---
source: RchGrav/claudebox
kind: pull_request
number: 86
state: open
url: https://github.com/RchGrav/claudebox/pull/86
author: ahmet-cetinkaya
created_at: 2025-11-06
---

# feat: Add --global flag for ~/.claude settings

Adds a `--global` flag that uses the host `~/.claude` directory directly instead of a project-scoped copy, so Claude Code settings, plugins, and preferences stay unified across runs. Useful when users want one canonical config tree on the host.

---

## AFK Relevance

| Field                 | Value                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Category**          | Claude settings / global config                                                                                                            |
| **Theme key**         | global_settings                                                                                                                            |
| **Short description** | AFK runs Claude in containers; mapping host `~/.claude` parallels decisions about where to mount or sync Claude settings per user session. |
