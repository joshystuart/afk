---
source: RchGrav/claudebox
kind: pull_request
number: 11
state: merged
url: https://github.com/RchGrav/claudebox/pull/11
author: benhaney
created_at: 2025-06-19
---

# Fix flag handling in claudebox script

Corrects parsing or dispatch of CLI flags in the main `claudebox` script so options are applied reliably and do not leak into positional arguments.

---

## AFK Relevance

| Field                 | Value                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Shell compatibility                                                                                                                 |
| **Theme key**         | bash_compat                                                                                                                         |
| **Short description** | Robust flag parsing in wrapper scripts reduces user-facing “wrong behavior” when AFK or related tooling shells out to similar CLIs. |
