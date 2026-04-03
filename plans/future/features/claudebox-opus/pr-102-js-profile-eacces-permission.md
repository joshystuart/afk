---
source: RchGrav/claudebox
kind: pull_request
number: 102
state: open
url: https://github.com/RchGrav/claudebox/pull/102
author: b00y0h
created_at: 2026-02-13
---

# fix: resolve EACCES permission error in JS profile

Fixes npm permission errors (`EACCES`) in the JavaScript/Node profile by aligning global install paths, ownership, or prefix configuration with the container user. Prevents failed installs that block frontend and Node workflows.

---

## AFK Relevance

| Field                 | Value                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Docker / image build                                                                                                                      |
| **Theme key**         | docker_build                                                                                                                              |
| **Short description** | Node tooling in containers often hits permission mismatches; AFK session images need the same user/npm layout discipline for JS projects. |
