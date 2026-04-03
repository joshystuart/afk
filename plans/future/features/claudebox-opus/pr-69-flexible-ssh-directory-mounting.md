---
source: RchGrav/claudebox
kind: pull_request
number: 69
state: open
url: https://github.com/RchGrav/claudebox/pull/69
author: fletchgqc
created_at: 2025-09-09
---

# Add flexible SSH directory mounting

Adds configurable mounting of the host SSH directory (keys, `known_hosts`, config) with options to constrain access and document security tradeoffs. Lets users use existing SSH credentials for Git and remote access without baking secrets into images.

---

## AFK Relevance

| Field                 | Value                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | SSH / security                                                                                                                     |
| **Theme key**         | ssh_security                                                                                                                       |
| **Short description** | Remote dev sessions often need Git-over-SSH; flexible, documented mounts align with AFK’s need to expose SSH safely to containers. |
