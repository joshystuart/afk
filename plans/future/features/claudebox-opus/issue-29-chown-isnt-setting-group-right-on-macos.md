---
source: RchGrav/claudebox
kind: issue
number: 29
state: closed
url: https://github.com/RchGrav/claudebox/issues/29
author: benp-mns
created_at: 2025-07-04
---

# chown isn't setting the group right on macOS

`chown` is invoked with `USERNAME:USERNAME` (or similar) where the second field should be a group name or GID. On macOS, the primary group often differs from the username, so ownership ends up wrong compared to Linux behavior.

**Fix direction:** Use `USERNAME:GROUP` from `id -gn` / `id -g`, or numeric `uid:gid` from the host.

---

## AFK Relevance

| Field                 | Value                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Category**          | docker_user_group                                                                                                              |
| **Theme key**         | docker_user_group                                                                                                              |
| **Short description** | Volume and file ownership in containers should map host UID/GID and real group on macOS, not assume `user:user` matches Linux. |
