---
source: RchGrav/claudebox
kind: pull_request
number: 19
state: merged
url: https://github.com/RchGrav/claudebox/pull/19
author: rmanoka
created_at: 2025-06-24
---

# Lower case docker tag name

Normalizes Docker image tags to lowercase to satisfy registry and Docker reference rules that reject mixed or uppercase tags in some contexts.

---

## AFK Relevance

| Field                 | Value                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| **Category**          | Docker / image build                                                                                    |
| **Theme key**         | docker_build                                                                                            |
| **Short description** | Consistent lowercasing avoids push/build failures when tags are derived from arbitrary directory names. |
