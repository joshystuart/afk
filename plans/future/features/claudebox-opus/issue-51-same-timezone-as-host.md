---
source: RchGrav/claudebox
kind: issue
number: 51
state: open
url: https://github.com/RchGrav/claudebox/issues/51
author: cowwoc
created_at: 2025-08-18T00:00:00Z
---

# Use same timezone as host

The container reports **UTC** (or a default TZ) while the **host uses a local timezone**, causing confusing timestamps in logs and tools. Request: sync `/etc/localtime` or `TZ` from host via mount or env.

## AFK Relevance

| Field                 | Value                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Host environment                                                                                                                 |
| **Theme key**         | `host_environment`                                                                                                               |
| **Short description** | Session logs and UI timestamps should match user expectations; AFK containers should inherit or document timezone configuration. |
