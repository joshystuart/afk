---
source: RchGrav/claudebox
kind: issue
number: 90
state: open
url: https://github.com/RchGrav/claudebox/issues/90
author: dydy-94
comments: 2
created_at: 2025-12-08T08:03:11Z
updated_at: 2026-01-07T10:36:12Z
---

# install error:/.claudebox/source/lib/cli.sh: line 22: all_args[@]: unbound variable

# Download the latest release

wget https://github.com/RchGrav/claudebox/releases/latest/download/claudebox.run
chmod +x claudebox.run
./claudebox.run

After I completed the installation of claudebox using the method provided in the readme file, I entered claudebox in the command line, but it threw an error. The error message was:/Users/cdy/.claudebox/source/lib/cli.sh: line 22: all_args[@]: unbound variable

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: install error:/.claudebox/source/lib/cli.sh: line 22: all_args[@]: unbound variable — Bash 3.2 / `set -u` / `local` misuse / array expansion bugs break install and entrypoints on macOS and strict shells.
