---
source: RchGrav/claudebox
kind: pull_request
number: 15
state: merged
url: https://github.com/RchGrav/claudebox/pull/15
author: nikvdp
created_at: 2025-06-23
---

# Move project path to image tag for uppercase

Adjusts how the image tag is derived so project paths with uppercase letters are represented in a Docker-valid tag form, avoiding invalid reference names.

---

## AFK Relevance

| Field                 | Value                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| **Category**          | Docker / image build                                                                             |
| **Theme key**         | docker_build                                                                                     |
| **Short description** | Image naming rules affect any automation that tags sessions or workspaces from filesystem paths. |
