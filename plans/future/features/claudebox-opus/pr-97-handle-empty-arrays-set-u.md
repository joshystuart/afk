---
source: RchGrav/claudebox
kind: pull_request
number: 97
state: open
url: https://github.com/RchGrav/claudebox/pull/97
author: rdasilveiracabral
created_at: 2026-01-18
---

# fix: handle empty arrays with set -u

Fixes iteration and expansion over arrays that may be empty when `set -u` (nounset) is active, which otherwise errors on `${array[@]}` in some Bash versions. Keeps profile lists and optional argument arrays safe when nothing is configured.

---

## AFK Relevance

| Field                 | Value                                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Shell / scripting compatibility                                                                                        |
| **Theme key**         | bash_compat                                                                                                            |
| **Short description** | Empty-array handling is a recurring Bash pitfall; AFK session scripts that iterate lists should use the same patterns. |
