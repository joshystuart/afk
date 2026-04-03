---
source: RchGrav/claudebox
kind: issue
number: 23
state: closed
url: https://github.com/RchGrav/claudebox/issues/23
author: DmitriyRomanov
created_at: 2025-06-24
---

# Error chown invalid group claude:claude

On WSL2 Ubuntu, `chown user:group` fails when the group `claude` does not exist in the container or namespace, producing **invalid group** for `claude:claude`.

**Fix direction:** Create the group before `chown`, map GID from host, or use numeric IDs / fallback group creation.

---

## AFK Relevance

| Field                 | Value                                                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | docker_user_group                                                                                                                                                 |
| **Theme key**         | docker_user_group                                                                                                                                                 |
| **Short description** | Container setup must ensure target user/group exist (or use numeric UID/GID) before `chown`, matching what AFK needs for volume permissions across Linux and WSL. |
