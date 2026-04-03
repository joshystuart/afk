---
source: RchGrav/claudebox
kind: issue
number: 30
state: closed
url: https://github.com/RchGrav/claudebox/issues/30
author: thundercat49
created_at: 2025-07-05
---

# Python package installation fails with uv pip

Installing packages with `uv pip install` inside the Docker image fails in the default layout (e.g. no writable system site, or uv expecting a specific venv layout).

**Mitigations:** Use `uv pip install --system`, create/activate a venv first, or use standard `pip` in the Dockerfile for bootstrap steps.

---

## AFK Relevance

| Field                 | Value                                                                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | python_uv                                                                                                                                                   |
| **Theme key**         | python_uv                                                                                                                                                   |
| **Short description** | Python toolchains in dev containers must install reliably with uv/pip so AFK session images can preinstall deps and persist user environments consistently. |
