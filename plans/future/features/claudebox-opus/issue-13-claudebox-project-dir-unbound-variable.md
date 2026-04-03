---
source: RchGrav/claudebox
kind: issue
number: 13
state: closed
url: https://github.com/RchGrav/claudebox/issues/13
author: jefferykarbowski
created_at: 2025-06-19
---

# CLAUDEBOX_PROJECT_DIR: unbound variable

On WSL (and similar environments), the container entrypoint or install script references `CLAUDEBOX_PROJECT_DIR` when it is unset. With `set -u` (nounset), this triggers **unbound variable** and aborts startup.

**Fix direction:** Default or guard the variable before use, or only expand it when defined.

---

## AFK Relevance

| Field                 | Value                                                                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | bash_compat                                                                                                                                         |
| **Theme key**         | bash_compat                                                                                                                                         |
| **Short description** | Entrypoints must tolerate unset optional env vars under `set -u` so WSL and strict shells do not fail—patterns AFK container scripts should mirror. |
