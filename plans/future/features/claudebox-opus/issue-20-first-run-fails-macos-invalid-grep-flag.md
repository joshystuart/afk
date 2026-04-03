---
source: RchGrav/claudebox
kind: issue
number: 20
state: closed
url: https://github.com/RchGrav/claudebox/issues/20
author: nikvdp
created_at: 2025-06-22
---

# First-run fails on macOS invalid grep flag

Scripts use `grep -P` (Perl-compatible regex). BSD `grep` on macOS does not support `-P`, so first run fails with an invalid option error.

**Fix direction:** Use `grep -E`, `sed`, or another portable approach; or call GNU grep if documented as a dependency.

---

## AFK Relevance

| Field                 | Value                                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | bash_compat                                                                                                                                               |
| **Theme key**         | bash_compat                                                                                                                                               |
| **Short description** | Portable shell scripts should not rely on GNU-only `grep` flags so macOS users get working installs—directly applicable to AFK install/bootstrap scripts. |
