---
source: RchGrav/claudebox
kind: pull_request
number: 14
state: merged
url: https://github.com/RchGrav/claudebox/pull/14
author: crowne
created_at: 2025-06-23
---

# Fix chown failure if local group ID exists

Handles the case where the host’s group ID already exists inside the image under a different name, so `chown`/`groupadd` steps do not fail during user setup.

---

## AFK Relevance

| Field                 | Value                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| **Category**          | Container user / group mapping                                                                        |
| **Theme key**         | docker_user_group                                                                                     |
| **Short description** | AFK maps host users into dev containers; same GID collisions appear when syncing UID/GID into images. |
