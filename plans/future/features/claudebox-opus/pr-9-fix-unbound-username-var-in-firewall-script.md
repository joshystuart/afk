---
source: RchGrav/claudebox
kind: pull_request
number: 9
state: merged
url: https://github.com/RchGrav/claudebox/pull/9
author: crowne
created_at: 2025-06-17
---

# Fix unbound USERNAME var in firewall script

Ensures `USERNAME` is defined (or avoided) in the firewall initialization path so scripts run cleanly under `set -u` and on environments where that variable is not set by default.

---

## AFK Relevance

| Field                 | Value                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Category**          | Shell compatibility                                                                                               |
| **Theme key**         | bash_compat                                                                                                       |
| **Short description** | Unbound-variable failures under `nounset` mirror issues AFK’s shell/Docker tooling must avoid on macOS and Linux. |
