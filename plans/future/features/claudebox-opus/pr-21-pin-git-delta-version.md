---
source: RchGrav/claudebox
kind: pull_request
number: 21
state: merged
url: https://github.com/RchGrav/claudebox/pull/21
author: nikvdp
created_at: 2025-06-25
---

# Pin git-delta version

Pins the `git-delta` package version installed in the image so upstream releases cannot break the Docker build unexpectedly.

---

## AFK Relevance

| Field                 | Value                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Docker / image build                                                                                                  |
| **Theme key**         | docker_build                                                                                                          |
| **Short description** | Pinning third-party binaries in images is the same stability practice AFK should use for reproducible session images. |
