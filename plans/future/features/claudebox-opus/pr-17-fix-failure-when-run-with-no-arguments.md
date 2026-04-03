---
source: RchGrav/claudebox
kind: pull_request
number: 17
state: merged
url: https://github.com/RchGrav/claudebox/pull/17
author: nikvdp
created_at: 2025-06-23
---

# Fix failure when run with no arguments

Ensures invoking `claudebox` with no arguments fails gracefully or shows help instead of crashing due to unset parameters.

---

## AFK Relevance

| Field                 | Value                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Category**          | Shell compatibility                                                                                             |
| **Theme key**         | bash_compat                                                                                                     |
| **Short description** | Defensive defaults and usage for empty argv improve UX for any CLI that operators run from muscle memory or CI. |
