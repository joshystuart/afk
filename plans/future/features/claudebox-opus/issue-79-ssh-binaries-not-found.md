---
source: RchGrav/claudebox
kind: issue
number: 79
state: open
url: https://github.com/RchGrav/claudebox/issues/79
author: GreyAssoc
created_at: 2025-09-25T00:00:00Z
---

# SSH binaries not found

The **`ssh` client is missing** inside the container (or not on `PATH`), breaking git over SSH and remote workflows even when keys are mounted. Request: include OpenSSH client in base image or profile.

## AFK Relevance

| Field                 | Value                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------ |
| **Category**          | SSH                                                                                        |
| **Theme key**         | `ssh_security`                                                                             |
| **Short description** | If AFK mounts SSH material, the image must ship compatible clients and sane PATH defaults. |
