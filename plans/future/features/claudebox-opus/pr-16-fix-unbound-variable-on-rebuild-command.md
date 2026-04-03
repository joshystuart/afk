---
source: RchGrav/claudebox
kind: pull_request
number: 16
state: merged
url: https://github.com/RchGrav/claudebox/pull/16
author: nikvdp
created_at: 2025-06-23
---

# Fix unbound variable on rebuild command

Fixes a variable that was referenced without a default when the `rebuild` code path runs, preventing errors under strict unset checking.

---

## AFK Relevance

| Field                 | Value                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Shell compatibility                                                                                                           |
| **Theme key**         | bash_compat                                                                                                                   |
| **Short description** | Rebuild/restart paths are high-traffic; unbound vars there are a recurring class of bugs for container orchestration scripts. |
