---
source: RchGrav/claudebox
kind: issue
number: 2
state: closed
url: https://github.com/RchGrav/claudebox/issues/2
author: micheledicosmo
created_at: 2025-06-11
---

# First run error declare -A invalid

On macOS, the default shell is often Bash 3.2, which does not support associative arrays. Scripts that use `declare -A` fail on first run with a syntax error.

**Fix direction:** Avoid associative arrays on Bash 3.2, or require a newer Bash (e.g. from Homebrew) and document it.

---

## AFK Relevance

| Field                 | Value                                                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | bash_compat                                                                                                                                   |
| **Theme key**         | bash_compat                                                                                                                                   |
| **Short description** | Users on macOS need install scripts compatible with Bash 3.2 (no `declare -A`) so first-run and automation work without upgrading Bash first. |
