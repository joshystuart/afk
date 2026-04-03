---
source: RchGrav/claudebox
kind: pull_request
number: 33
state: merged
url: https://github.com/RchGrav/claudebox/pull/33
author: RchGrav
created_at: 2025-07-05
---

# Fix warning if bash < v4, find brew macOS

Warns when the system Bash is older than 4.x (notably macOS’s Bash 3.2) and attempts to locate a newer Bash via Homebrew, improving compatibility for scripts that need modern Bash features.

---

## AFK Relevance

| Field                 | Value                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Shell compatibility                                                                                                          |
| **Theme key**         | bash_compat                                                                                                                  |
| **Short description** | macOS default Bash is a frequent footgun for dev tooling; AFK operators on Mac benefit from the same guidance and detection. |
