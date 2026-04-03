---
source: RchGrav/claudebox
kind: pull_request
number: 77
state: open
url: https://github.com/RchGrav/claudebox/pull/77
author: amelgi
created_at: 2025-09-21
---

# Fix Issue 71 unbound variable errors macOS

Addresses unbound variable errors that appear on macOS when the install or wrapper scripts run with `set -u` and older Bash. Initializes or guards variables that are optional on Linux but unset on macOS paths.

---

## AFK Relevance

| Field                 | Value                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Shell / scripting compatibility                                                                                               |
| **Theme key**         | bash_compat                                                                                                                   |
| **Short description** | AFK operators often develop on macOS; the same nounset and Bash-version pitfalls apply to install and session helper scripts. |
