---
source: RchGrav/claudebox
kind: issue
number: 32
state: closed
url: https://github.com/RchGrav/claudebox/issues/32
author: TheConnMan
created_at: 2025-07-09
---

# Home Claude settings not mounted in

The host directory `~/.claude` is not mounted into the container (or not read-only). Users cannot rely on global Claude settings, commands, or project-level `CLAUDE.md` patterns that live under that path on the host.

**Desired behavior:** Optional or default mount of `~/.claude` so containerized Claude Code matches host configuration.

---

## AFK Relevance

| Field                 | Value                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Category**          | global_settings                                                                                                                                                                      |
| **Theme key**         | global_settings                                                                                                                                                                      |
| **Short description** | Mounting host `~/.claude` (and related config) into sessions is what users expect for parity with local Claude Code—directly aligned with AFK’s containerized dev environment story. |
