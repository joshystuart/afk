---
source: RchGrav/claudebox
kind: pull_request
number: 89
state: open
url: https://github.com/RchGrav/claudebox/pull/89
author: TonyHernandezAtMS
created_at: 2025-11-16
---

# fix: Bash 3.2 compatibility with set -u

Applies comprehensive fixes so scripts run on macOS’s default Bash 3.2 while `set -u` is enabled, avoiding constructs that only exist in Bash 4+ or that trip nounset on empty arrays. Broad compatibility reduces “works on Linux CI” vs “fails on Mac” gaps.

---

## AFK Relevance

| Field                 | Value                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Shell / scripting compatibility                                                                                              |
| **Theme key**         | bash_compat                                                                                                                  |
| **Short description** | AFK contributors often use macOS; Bash 3.2 constraints apply to any shell-based installer or session hooks shipped with AFK. |
