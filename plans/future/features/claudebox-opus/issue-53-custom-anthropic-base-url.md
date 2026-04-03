---
source: RchGrav/claudebox
kind: issue
number: 53
state: open
url: https://github.com/RchGrav/claudebox/issues/53
author: cowwoc
created_at: 2025-08-19T00:00:00Z
---

# Ability to use custom ANTHROPIC_BASE_URL

Users need to set a **custom `ANTHROPIC_BASE_URL`** (or equivalent) so Claude Code talks to **proxies, routers, or compatible endpoints** instead of the default Anthropic API. Request: pass through env at build/run and document precedence vs `settings.json`.

## AFK Relevance

| Field                 | Value                                                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | API / routing                                                                                                                     |
| **Theme key**         | `api_routing`                                                                                                                     |
| **Short description** | AFK sessions must support configurable API endpoints for self-hosted or routed models, matching enterprise and power-user setups. |
