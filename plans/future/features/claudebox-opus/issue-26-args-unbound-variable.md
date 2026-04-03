---
source: RchGrav/claudebox
kind: issue
number: 26
state: closed
url: https://github.com/RchGrav/claudebox/issues/26
author: arunsathiya
created_at: 2025-06-30
---

# args[@]: unbound variable

With `set -u`, expanding `${args[@]}` when the array is empty can trigger **unbound variable** (depending on Bash version and context).

**Fix direction:** Use `${args[@]+"${args[@]}"}`, default to empty, or test array length before expansion.

---

## AFK Relevance

| Field                 | Value                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | bash_compat                                                                                                                                       |
| **Theme key**         | bash_compat                                                                                                                                       |
| **Short description** | Scripts using strict mode must safely expand possibly-empty arrays so CI and user shells with `set -u` do not fail—useful for AFK shell wrappers. |
