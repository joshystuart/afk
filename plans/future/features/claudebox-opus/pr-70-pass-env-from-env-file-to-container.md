---
source: RchGrav/claudebox
kind: pull_request
number: 70
state: open
url: https://github.com/RchGrav/claudebox/pull/70
author: fletchgqc
created_at: 2025-09-09
---

# feat: Pass env variables from .env to container

Reads a `.env` file on the host and forwards selected variables into `docker run` so API keys, endpoints, and feature flags do not need to be duplicated in shell exports. Centralizes environment injection for local development workflows.

---

## AFK Relevance

| Field                 | Value                                                                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Host environment / env                                                                                                                              |
| **Theme key**         | host_environment                                                                                                                                    |
| **Short description** | AFK passes configuration into session containers; `.env`-to-container patterns match how operators might inject secrets and toggles per deployment. |
