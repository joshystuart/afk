---
source: RchGrav/claudebox
kind: pull_request
number: 6
state: merged
url: https://github.com/RchGrav/claudebox/pull/6
author: RchGrav
created_at: 2025-06-16
---

# Move scripts from Dockerfile to claudebox

Moves inline shell logic out of the Dockerfile and into the `claudebox` script so generation and maintenance happen in one place. Reduces Dockerfile complexity and keeps build steps easier to edit and review.

---

## AFK Relevance

| Field                 | Value                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Docker / image build                                                                                                      |
| **Theme key**         | docker_build                                                                                                              |
| **Short description** | Same split (generated Dockerfile vs. host script) matters for AFK if it generates or wraps similar container definitions. |
