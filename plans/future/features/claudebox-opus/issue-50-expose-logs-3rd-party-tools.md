---
source: RchGrav/claudebox
kind: issue
number: 50
state: open
url: https://github.com/RchGrav/claudebox/issues/50
author: cowwoc
created_at: 2025-08-18T00:00:00Z
---

# Expose logs to 3rd-party tools

Request to **mount or forward Claude Code logs** (and related artifacts) to paths visible on the host so **monitoring, log shippers, or IDEs** can ingest them. Today logs may live only inside the container or obscure locations.

## AFK Relevance

| Field                 | Value                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Host environment / observability                                                                                                    |
| **Theme key**         | `host_environment`                                                                                                                  |
| **Short description** | AFK operators often need session or agent logs on the host for debugging and compliance; volume mounts and documented paths matter. |
