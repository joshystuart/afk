---
source: RchGrav/claudebox
kind: issue
number: 65
state: open
url: https://github.com/RchGrav/claudebox/issues/65
author: gohrner
created_at: 2025-09-07T00:00:00Z
---

# ClaudeBox only started once then fails

**`local` used outside a function** in `docker-entrypoint` (or related scripts) causes bash errors on subsequent starts. First run may succeed; later runs fail when the script path hits the invalid `local` usage.

## AFK Relevance

| Field                 | Value                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Category**          | Bash compatibility                                                                                               |
| **Theme key**         | `bash_compat`                                                                                                    |
| **Short description** | Entrypoint scripts must be valid bash at top level; AFK container entrypoints should follow the same discipline. |
