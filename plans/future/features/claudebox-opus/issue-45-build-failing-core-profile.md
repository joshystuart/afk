---
source: RchGrav/claudebox
kind: issue
number: 45
state: closed
url: https://github.com/RchGrav/claudebox/issues/45
author: zhekaby
created_at: 2025-08-14T00:00:00Z
---

# Build failing with core profile

Docker build failed because **`{{PROFILE_INSTALLATIONS}}` placeholders were not substituted** in the generated Dockerfile, leaving invalid instructions or empty profile sections. Using the **core** profile exposed the templating bug.

## AFK Relevance

| Field                 | Value                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Docker build / templating                                                                                                                         |
| **Theme key**         | `docker_build`                                                                                                                                    |
| **Short description** | Dockerfile generation must reliably replace profile placeholders—any AFK image build that composes layers from profiles shares this failure mode. |
