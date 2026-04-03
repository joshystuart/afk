---
source: RchGrav/claudebox
kind: pull_request
number: 54
state: merged
url: https://github.com/RchGrav/claudebox/pull/54
author: RchGrav
created_at: 2025-08-27
---

# feat: Add dynamic profile system

Introduces a dynamic profile system so tool stacks (languages, CLIs, and related packages) can be selected and composed when building or running the image, instead of hard-coding a single monolithic install. This makes images easier to extend and keeps unrelated tooling out of minimal setups.

---

## AFK Relevance

| Field                 | Value                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Docker / image build                                                                                                                               |
| **Theme key**         | docker_build                                                                                                                                       |
| **Short description** | AFK builds and runs per-session dev containers; composable profiles parallel how AFK might offer stack-specific session images or install bundles. |
