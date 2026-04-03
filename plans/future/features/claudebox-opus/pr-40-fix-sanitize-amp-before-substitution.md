---
source: RchGrav/claudebox
kind: pull_request
number: 40
state: merged
url: https://github.com/RchGrav/claudebox/pull/40
author: RchGrav
created_at: 2025-08-04
---

# fix: Sanitize & before substitution

Escapes or sanitizes `&` characters before `awk`-based substitution so generated configs are not corrupted when values contain ampersands.

---

## AFK Relevance

| Field                 | Value                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Docker / image build                                                                                                  |
| **Theme key**         | docker_build                                                                                                          |
| **Short description** | Template substitution bugs (special characters) affect any generated Dockerfiles or config snippets in AFK pipelines. |
