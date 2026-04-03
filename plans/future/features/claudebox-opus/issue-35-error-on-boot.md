---
source: RchGrav/claudebox
kind: issue
number: 35
state: closed
url: https://github.com/RchGrav/claudebox/issues/35
author: pbarker
created_at: 2025-07-21
---

# Error on boot

On macOS, container boot fails with `chown` reporting an **invalid group** for `claude:claude`—same class of issue as WSL/Linux: the group may not exist inside the container or may not match the host mapping.

**Fix direction:** Ensure group creation / numeric GID mapping before `chown` on all platforms including macOS.

---

## AFK Relevance

| Field                 | Value                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | docker_user_group                                                                                                                                             |
| **Theme key**         | docker_user_group                                                                                                                                             |
| **Short description** | Startup must apply ownership without assuming a pre-existing `claude` group everywhere; AFK image entrypoints need the same robust UID/GID handling on macOS. |
