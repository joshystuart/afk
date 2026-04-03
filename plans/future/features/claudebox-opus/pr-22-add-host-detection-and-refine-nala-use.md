---
source: RchGrav/claudebox
kind: pull_request
number: 22
state: merged
url: https://github.com/RchGrav/claudebox/pull/22
author: RchGrav
created_at: 2025-06-27
---

# Add host detection and refine nala use

Detects characteristics of the host environment and uses `nala` only where appropriate, improving package-install behavior across distros and avoiding failures on hosts without `nala`.

---

## AFK Relevance

| Field                 | Value                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| **Category**          | Docker / image build                                                                                    |
| **Theme key**         | docker_build                                                                                            |
| **Short description** | Host-aware install logic parallels AFK’s need to support diverse Linux hosts and optional accelerators. |
