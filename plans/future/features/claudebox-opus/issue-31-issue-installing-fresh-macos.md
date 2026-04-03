---
source: RchGrav/claudebox
kind: issue
number: 31
state: open
url: https://github.com/RchGrav/claudebox/issues/31
author: hustlelabs
created_at: 2025-07-05
---

# Issue installing on fresh macOS

On a clean macOS install, the installer hits a Bash 3.2 syntax error (modern Bash syntax used where only 3.2 is available). No extra dev tools beyond defaults.

**Fix direction:** Same as other macOS issues: restrict to POSIX / Bash 3.2-safe syntax or document Homebrew Bash as required.

---

## AFK Relevance

| Field                 | Value                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | bash_compat                                                                                                                            |
| **Theme key**         | bash_compat                                                                                                                            |
| **Short description** | Fresh macOS installs are a barometer for portability; AFK-related install paths should work on stock Bash without hidden dependencies. |
