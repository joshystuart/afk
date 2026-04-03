---
source: RchGrav/claudebox
kind: issue
number: 91
state: open
url: https://github.com/RchGrav/claudebox/issues/91
author: noahwhite
created_at: 2025-12-10T00:00:00Z
---

# Unable to rebuild after adding profiles

**Rebuild fails** after adding profiles because **`PROFILE_INSTALLATIONS` placeholders** (or similar) are **not substituted** in the Dockerfile—same class of bug as core-profile build failures. Image generation leaves invalid Dockerfile content.

## AFK Relevance

| Field                 | Value                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Docker build                                                                                                               |
| **Theme key**         | `docker_build`                                                                                                             |
| **Short description** | Profile expansion must be deterministic and tested whenever profile lists change; AFK image builds share this requirement. |
