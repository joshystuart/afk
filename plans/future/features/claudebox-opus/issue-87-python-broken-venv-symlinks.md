---
source: RchGrav/claudebox
kind: issue
number: 87
state: open
url: https://github.com/RchGrav/claudebox/issues/87
author: TonyHernandezAtMS
created_at: 2025-11-16T00:00:00Z
---

# Python not available — broken venv symlinks

**uv-managed Python** or virtualenv paths break across **container restarts**: symlinks point at host-only paths or ephemeral locations, so **`python` or venv binaries vanish**. Needs persistent volume layout or documented uv data paths.

## AFK Relevance

| Field                 | Value                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Python / uv                                                                                                           |
| **Theme key**         | `python_uv`                                                                                                           |
| **Short description** | AFK dev containers must persist language toolchains predictably; uv’s cache and Python installs must survive restart. |
