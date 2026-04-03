---
source: RchGrav/claudebox
kind: pull_request
number: 92
state: merged
url: https://github.com/RchGrav/claudebox/pull/92
author: rdasilveiracabral
created_at: 2025-12-12
---

# Fix unbound variable errors with set -u

Systematically fixes unbound variable references across the script when `set -u` is enabled, covering optional branches and default-empty values. Prevents silent failures turning into hard errors during install, rebuild, and run.

---

## AFK Relevance

| Field                 | Value                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Shell / scripting compatibility                                                                                              |
| **Theme key**         | bash_compat                                                                                                                  |
| **Short description** | Defensive shell scripting under nounset matches production-grade AFK scripts that must not fail on unset optional variables. |
