---
source: RchGrav/claudebox
kind: pull_request
number: 88
state: open
url: https://github.com/RchGrav/claudebox/pull/88
author: TonyHernandezAtMS
created_at: 2025-11-16
---

# fix: mount .local/share to persist uv Python

Mounts `~/.local/share` (or equivalent) so uv-managed Python installations and tool caches survive container restarts. Without persistence, Python toolchains reinstall on every run and slow down sessions.

---

## AFK Relevance

| Field                 | Value                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Python / uv                                                                                                                            |
| **Theme key**         | python_uv                                                                                                                              |
| **Short description** | AFK sessions should persist language tooling where possible; uv cache and interpreter paths are a direct parallel for volume strategy. |
