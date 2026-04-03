---
source: RchGrav/claudebox
kind: issue
number: 29
state: closed
url: https://github.com/RchGrav/claudebox/issues/29
author: benp-mns
comments: 1
created_at: 2025-07-04T11:57:11Z
updated_at: 2025-07-25T10:57:10Z
---

# chown isn&#39;t setting the group right on macOS

line 2149 in claudebox script: `RUN chown $USERNAME:$USERNAME /home/$USERNAME/init-firewall`

should be: `RUN chown $USERNAME:$GROUP_ID /home/$USERNAME/init-firewall`

## AFK planning summary

- **Category**: WSL / root UID / Docker user & group edge cases
- **Theme key**: `platform_wsl_root`
- **Short description**: chown isn&#39;t setting the group right on macOS — Host UID/GID edge cases: root on WSL2, macOS group IDs, `chown` failures.
