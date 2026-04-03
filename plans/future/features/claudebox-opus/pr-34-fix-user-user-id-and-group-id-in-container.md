---
source: RchGrav/claudebox
kind: pull_request
number: 34
state: merged
url: https://github.com/RchGrav/claudebox/pull/34
author: benp-mns
created_at: 2025-07-07
---

# Fix user USER_ID and GROUP_ID in container

Switches ownership and user setup to rely on numeric `USER_ID` and `GROUP_ID` rather than `USERNAME` alone, aligning file ownership in the container with the host user.

---

## AFK Relevance

| Field                 | Value                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------- |
| **Category**          | Container user / group mapping                                                               |
| **Theme key**         | docker_user_group                                                                            |
| **Short description** | UID/GID mapping is central to volume permissions in remote dev containers like AFK sessions. |
