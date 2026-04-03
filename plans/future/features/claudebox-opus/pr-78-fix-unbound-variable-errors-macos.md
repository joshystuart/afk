---
source: RchGrav/claudebox
kind: pull_request
number: 78
state: open
url: https://github.com/RchGrav/claudebox/pull/78
author: manarone
created_at: 2025-09-24
---

# Fix unbound variable errors on macOS

Provides another set of fixes for macOS-specific unbound variable failures under strict shell settings, complementing related issues around optional variables and default Bash paths. Improves reliability of the Claudebox CLI on Apple Silicon and older system Bash.

---

## AFK Relevance

| Field                 | Value                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Shell / scripting compatibility                                                                                                           |
| **Theme key**         | bash_compat                                                                                                                               |
| **Short description** | Cross-platform shell correctness is a prerequisite for AFK tooling used by macOS developers; duplicate PRs highlight edge cases to audit. |
