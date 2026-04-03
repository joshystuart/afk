---
source: RchGrav/claudebox
kind: issue
number: 36
state: closed
url: https://github.com/RchGrav/claudebox/issues/36
author: iRhysBradbury
created_at: 2025-07-22T00:00:00Z
---

# Error when installing on macOS

Installation on macOS failed because the environment assumed Linux-style service management and a running Docker daemon. **Docker was not running** when the user tried to install, and the flow referenced **`systemctl`**, which does not exist on macOS. Users need clearer prerequisites (Docker Desktop running) and macOS-appropriate checks instead of Linux-only commands.

## AFK Relevance

| Field                 | Value                                                                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Bash compatibility / platform assumptions                                                                                                                                                          |
| **Theme key**         | `bash_compat`                                                                                                                                                                                      |
| **Short description** | macOS install path must avoid Linux-only assumptions (`systemctl`) and surface Docker-not-running errors clearly—relevant when AFK documents or scripts wrap similar container workflows on macOS. |
