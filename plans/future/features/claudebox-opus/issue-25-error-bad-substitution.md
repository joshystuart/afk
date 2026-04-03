---
source: RchGrav/claudebox
kind: issue
number: 25
state: closed
url: https://github.com/RchGrav/claudebox/issues/25
author: arunsathiya
created_at: 2025-06-28
---

# Error: bad substitution

Bash 3.2 on macOS does not support `${var^^}` (uppercase parameter expansion). Scripts that use it throw **bad substitution**.

**Fix direction:** Use `tr`, `awk`, or a Bash 4+ check; avoid `^^` / `,,` on default macOS Bash.

---

## AFK Relevance

| Field                 | Value                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | bash_compat                                                                                                               |
| **Theme key**         | bash_compat                                                                                                               |
| **Short description** | Avoid Bash 4+-only parameter expansion so macOS default Bash runs install and helper scripts without substitution errors. |
