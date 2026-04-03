---
source: RchGrav/claudebox
kind: issue
number: 71
state: open
url: https://github.com/RchGrav/claudebox/issues/71
author: hcoura
created_at: 2025-09-09T00:00:00Z
---

# Unbound variable error installing on macOS

Installation on **macOS** fails with **`all_args[@]` unbound variable**—typically when `set -u` is enabled and the array is referenced before initialization, or when bash version differences change array behavior.

## AFK Relevance

| Field                 | Value                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Bash compatibility                                                                                                            |
| **Theme key**         | `bash_compat`                                                                                                                 |
| **Short description** | Install and CLI scripts must be macOS-safe (bash 3.2 vs 5.x, nounset); AFK wrappers should use defensive defaults for arrays. |
