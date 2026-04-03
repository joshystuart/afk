---
source: RchGrav/claudebox
kind: issue
number: 96
state: open
url: https://github.com/RchGrav/claudebox/issues/96
author: b00y0h
created_at: 2026-01-09T00:00:00Z
---

# Support host ~/.claude skills in containers

**Global skills** under the host’s **`~/.claude`** are **not visible inside containers**; only project-local skills may load. Users want global skills mounted or merged so personal skill libraries work everywhere.

## AFK Relevance

| Field                 | Value                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Category**          | Global settings                                                                                                                |
| **Theme key**         | `global_settings`                                                                                                              |
| **Short description** | AFK should mount or sync user-level Claude skills and settings consistently with host expectations for “global” configuration. |
