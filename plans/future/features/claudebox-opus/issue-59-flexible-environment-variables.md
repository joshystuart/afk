---
source: RchGrav/claudebox
kind: issue
number: 59
state: open
url: https://github.com/RchGrav/claudebox/issues/59
author: fletchgqc
created_at: 2025-08-28T00:00:00Z
---

# Flexible environment variables

Request to **pass arbitrary environment variables** from a project **`.env`** (or host) into the container—e.g. **`GH_TOKEN`**, API keys, or CI-like secrets—without manually threading each one through custom Docker flags every time.

## AFK Relevance

| Field                 | Value                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Host environment                                                                                                              |
| **Theme key**         | `host_environment`                                                                                                            |
| **Short description** | AFK needs a clear, safe pattern for injecting secrets and tool tokens into Claude Code sessions without leaking them in logs. |
