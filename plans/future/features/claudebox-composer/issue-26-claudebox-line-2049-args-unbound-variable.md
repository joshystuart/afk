---
source: RchGrav/claudebox
kind: issue
number: 26
state: closed
url: https://github.com/RchGrav/claudebox/issues/26
author: arunsathiya
comments: 6
created_at: 2025-06-30T13:43:54Z
updated_at: 2025-08-08T07:41:06Z
---

# claudebox: line 2049: args[@]: unbound variable

&gt; implemented bash 3.2 backwards compatibilty &amp; tests.

_Originally posted by @RchGrav in [#25](https://github.com/RchGrav/claudebox/issues/25#issuecomment-3017555236)_

After installing the latest version, the installation goes through properly, but activating the program fails initially if Docker is not launched. After Docker is launched, it fails with a `claudebox: line 2049: args[@]: unbound variable` error. Full logs:

```shell
➜  ~ curl -O https://raw.githubusercontent.com/RchGrav/claudebox/main/claudebox
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 87165  100 87165    0     0   197k      0 --:--:-- --:--:-- --:--:--  197k
➜  ~ chmod +x claudebox
➜  ~ ./claudebox
Symlink updated: /Users/arun/.local/bin/claudebox → /Users/arun/claudebox
Docker is installed but not running.
Starting Docker requires sudo privileges...
sudo: systemctl: command not found
➜  ~ ./claudebox
./claudebox: line 2049: args[@]: unbound variable
➜  ~ bash claudebox
claudebox: line 2049: args[@]: unbound variable
➜  ~ bash

The default interactive shell is now zsh.
To update your account to use zsh, please run `chsh -s /bin/zsh`.
For more details, please visit https://support.apple.com/kb/HT208050.
bash-3.2$ claudebox
/Users/arun/.local/bin/claudebox: line 2049: args[@]: unbound variable
bash-3.2$
```

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: claudebox: line 2049: args[@]: unbound variable — Bash 3.2 / `set -u` / `local` misuse / array expansion bugs break install and entrypoints on macOS and strict shells.
