---
source: RchGrav/claudebox
kind: issue
number: 25
state: closed
url: https://github.com/RchGrav/claudebox/issues/25
author: arunsathiya
comments: 6
created_at: 2025-06-28T18:55:06Z
updated_at: 2025-06-30T13:44:35Z
---

# Error: bad substitution

I am seeing a `bad substitution` error during initial setup:

```
➜  ~ curl -O https://raw.githubusercontent.com/RchGrav/claudebox/main/claudebox

  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 86184  100 86184    0     0   567k      0 --:--:-- --:--:-- --:--:--  568k
➜  ~ chmod +x claudebox
➜  ~ ./claudebox
./claudebox: line 27: ${t1^^}: bad substitution
```

What might be happening here? Happy to help with logs.

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: Error: bad substitution — Bash 3.2 / `set -u` / `local` misuse / array expansion bugs break install and entrypoints on macOS and strict shells.
