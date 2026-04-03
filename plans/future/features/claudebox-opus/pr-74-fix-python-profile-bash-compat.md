---
source: RchGrav/claudebox
kind: pull_request
number: 74
state: merged
url: https://github.com/RchGrav/claudebox/pull/74
author: RchGrav
created_at: 2025-09-12
---

# Fix Python profile error handling and Bash compat

Improves the Python profile’s error handling and aligns shell constructs with Bash versions commonly found on macOS and Linux. Reduces failures during venv creation, package installs, and profile activation inside the container.

---

## AFK Relevance

| Field                 | Value                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Python / uv                                                                                                                 |
| **Theme key**         | python_uv                                                                                                                   |
| **Short description** | AFK’s Python-heavy sessions depend on robust venv and tooling setup; these fixes inform uv/venv handling in session images. |
