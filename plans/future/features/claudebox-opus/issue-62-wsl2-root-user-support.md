---
source: RchGrav/claudebox
kind: issue
number: 62
state: open
url: https://github.com/RchGrav/claudebox/issues/62
author: sinabahram
created_at: 2025-08-30T00:00:00Z
---

# WSL2 root user support

**Docker build fails when the host user is root (UID 0)** on WSL2—common scripts assume non-zero UIDs for user/group mapping in the image. Need support or documented handling for root-on-WSL workflows.

## AFK Relevance

| Field                 | Value                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Docker user / group mapping                                                                                             |
| **Theme key**         | `docker_user_group`                                                                                                     |
| **Short description** | AFK must handle edge cases where UID/GID mapping fails (root, large IDs, macOS vs Linux) for reliable container builds. |
