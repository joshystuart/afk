---
source: RchGrav/claudebox
kind: issue
number: 36
state: closed
url: https://github.com/RchGrav/claudebox/issues/36
author: iRhysBradbury
comments: 1
created_at: 2025-07-22T18:50:27Z
updated_at: 2025-07-25T10:56:35Z
---

# Error when Installing on MacOS

When running installation instructions found here, I get this issue on MacOS:

```
/claudebox

Docker is installed but not running.
Starting Docker requires sudo privileges...
sudo: systemctl: command not found
```

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: Error when Installing on MacOS — Bash 3.2 / `set -u` / `local` misuse / array expansion bugs break install and entrypoints on macOS and strict shells.
