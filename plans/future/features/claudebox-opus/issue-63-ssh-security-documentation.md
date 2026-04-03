---
source: RchGrav/claudebox
kind: issue
number: 63
state: open
url: https://github.com/RchGrav/claudebox/issues/63
author: scottishdeveloper
created_at: 2025-09-01T00:00:00Z
---

# SSH security risk documentation

**SSH keys or agent sockets are mounted into the container** without prominent documentation or explicit opt-in consent. Users want transparency about exposure, threat model, and how to disable or scope SSH access.

## AFK Relevance

| Field                 | Value                                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | SSH / security                                                                                                                                            |
| **Theme key**         | `ssh_security`                                                                                                                                            |
| **Short description** | Any feature that forwards SSH into sessions must be documented and opt-in where possible; AFK shares similar trust boundaries with git/SSH in containers. |
