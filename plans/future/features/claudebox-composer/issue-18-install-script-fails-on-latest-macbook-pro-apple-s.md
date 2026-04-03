---
source: RchGrav/claudebox
kind: issue
number: 18
state: closed
url: https://github.com/RchGrav/claudebox/issues/18
author: KiwiParagliding
comments: 2
created_at: 2025-06-20T08:48:01Z
updated_at: 2025-06-23T05:40:41Z
---

# Install script fails on latest MacBook Pro (Apple Silicon, Sonoma 15.1 RS, zsh): unknown file attribute, unbound variable, and missing file errors

**System:** MacBook Pro (latest, Apple Silicon) running macOS Sonoma 15.1 RS

**Problem when installing package via Docker using the script:**

1. Downloaded script with:

```
curl -O https://raw.githubusercontent.com/RchGrav/claudebox/main/claudebox
chmod +x claudebox
```

2. Ran initial setup with:

```
./claudebox
```

3. Encountered the following errors:
   - `zsh: command not found: #` (when running script)
   - `zsh: unknown file attribute: h`
   - `./claudebox: line 87: DEFAULT_FLAGS[@]: unbound variable`
   - After attempting to run `./claude`, got: `zsh: no such file or directory: ./claude`

**Expectation:**
The script should run smoothly on macOS Sonoma 15.1 RS (zsh) and install the package without errors.

**Request:**

- Please check if the script is compatible with Apple Silicon (M-series), Sonoma 15.1 RS, and zsh, especially with array handling and file attributes.
- Are there any dependencies or shell requirements not listed in the documentation?
- Could you provide guidance or fixes so the install works on the latest MacBook Pro (Apple Silicon, Sonoma 15.1 RS, zsh)?

**Steps to reproduce:**

1. Use a MacBook Pro (Apple Silicon, Sonoma 15.1 RS, zsh shell)
2. Download claudebox script as above
3. Run `./claudebox`

**Error outputs are included above.**

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: Install script fails on latest MacBook Pro (Apple Silicon, Sonoma 15.1 RS, zsh): unknown file attribute, unbound variable, and missing file errors — Bash 3.2 / `set -u` / `local` misuse / array expansion bugs break install and entrypoints on macOS and strict shells.
