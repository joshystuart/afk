---
source: RchGrav/claudebox
kind: pull_request
number: 103
state: open
url: https://github.com/RchGrav/claudebox/pull/103
author: shen390s
created_at: 2026-03-20
---

# support 3rd party vendor and fix local warning

Adds support for routing Claude or API traffic through a third-party vendor endpoint and fixes shell warnings from `local` used outside a function. Brings vendor-specific base URLs or proxies in line with upstream API expectations while keeping scripts clean under strict shell modes.

---

## AFK Relevance

| Field                 | Value                                                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | API / routing                                                                                                                                 |
| **Theme key**         | api_routing                                                                                                                                   |
| **Short description** | AFK may need configurable Anthropic or proxy endpoints per tenant; vendor routing and env wiring parallels server-side gateway configuration. |
