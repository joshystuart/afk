---
source: RchGrav/claudebox
kind: issue
number: 13
state: closed
url: https://github.com/RchGrav/claudebox/issues/13
author: jefferykarbowski
comments: 3
created_at: 2025-06-19T01:38:42Z
updated_at: 2025-06-20T03:01:56Z
---

# CLAUDEBOX_PROJECT_DIR: unbound variable

Hello, I am using WSL on a Windows 10 machine, I am getting the error when running claudebox:

Firewall initialized with Anthropic-only access
/usr/local/bin/docker-entrypoint: line 29: CLAUDEBOX_PROJECT_DIR: unbound variable

Can you see why this might be? Thank you for all of your effort!

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: CLAUDEBOX_PROJECT_DIR: unbound variable — Bash 3.2 / `set -u` / `local` misuse / array expansion bugs break install and entrypoints on macOS and strict shells.
