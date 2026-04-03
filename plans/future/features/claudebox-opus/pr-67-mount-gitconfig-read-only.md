---
source: RchGrav/claudebox
kind: pull_request
number: 67
state: open
url: https://github.com/RchGrav/claudebox/pull/67
author: fletchgqc
created_at: 2025-09-09
---

# Mount user's gitconfig read-only

Mounts the host `~/.gitconfig` into the container read-only so Git identity, aliases, and settings match the developer’s machine without copying files into the image. Prevents accidental modification of host config from inside the container while keeping commits consistent.

---

## AFK Relevance

| Field                 | Value                                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Git integration                                                                                                                         |
| **Theme key**         | git_integration                                                                                                                         |
| **Short description** | AFK sessions run real Git workflows; read-only host gitconfig mirrors patterns for mounting user config safely into session containers. |
