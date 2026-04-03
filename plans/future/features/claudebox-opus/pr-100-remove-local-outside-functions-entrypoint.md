---
source: RchGrav/claudebox
kind: pull_request
number: 100
state: open
url: https://github.com/RchGrav/claudebox/pull/100
author: b00y0h
created_at: 2026-02-12
---

# fix: remove local outside functions in entrypoint

Removes invalid use of the `local` keyword outside function scope in container entrypoint scripts. Such usage fails or warns depending on shell, breaking startup or masking other errors during container boot.

---

## AFK Relevance

| Field                 | Value                                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Shell / scripting compatibility                                                                                                         |
| **Theme key**         | bash_compat                                                                                                                             |
| **Short description** | Entrypoints for AFK session containers must use portable, valid shell; `local` misuse is a common footgun in generated startup scripts. |
