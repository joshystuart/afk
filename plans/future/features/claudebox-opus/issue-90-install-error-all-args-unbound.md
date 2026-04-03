---
source: RchGrav/claudebox
kind: issue
number: 90
state: open
url: https://github.com/RchGrav/claudebox/issues/90
author: dydy-94
created_at: 2025-12-08T00:00:00Z
---

# Install error: all_args unbound variable

Installation fails with **`all_args[@]` unbound variable**, similar to other macOS/bash `set -u` issues: the args array is referenced before assignment or in a code path where it was never populated.

## AFK Relevance

| Field                 | Value                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Category**          | Bash compatibility                                                                                         |
| **Theme key**         | `bash_compat`                                                                                              |
| **Short description** | CLI argument parsing must initialize arrays before use under `nounset`; applies to any AFK install script. |
