---
source: RchGrav/claudebox
kind: pull_request
number: 99
state: open
url: https://github.com/RchGrav/claudebox/pull/99
author: b00y0h
created_at: 2026-02-12
---

# fix: Dockerfile template substitution multi-line

Fixes Dockerfile template substitution when profile install blocks contain newlines, which previously broke sed/awk-based replacement or produced invalid Dockerfile instructions. Ensures complex profile snippets round-trip correctly into generated Dockerfiles.

---

## AFK Relevance

| Field                 | Value                                                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Docker / image build                                                                                                                         |
| **Theme key**         | docker_build                                                                                                                                 |
| **Short description** | AFK builds images from templates; multiline-safe substitution is essential whenever generated Dockerfiles include arbitrary profile content. |
