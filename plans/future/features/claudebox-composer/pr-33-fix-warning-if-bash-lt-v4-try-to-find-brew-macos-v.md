---
source: RchGrav/claudebox
kind: pull_request
number: 33
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/33
author: diepes
head: #31-macos-brew-bash4
base: main
created_at: 2025-07-19T14:06:14Z
updated_at: 2025-07-20T18:01:35Z
---

# Fix warning if bash &lt; v4 try to find brew macOS version

Add check for older bash version &lt;4,
and then try to locate macOS brew installed bash v4, if not sleep 5 sec and continue.

e.g. output with no brew bash 4.

```
./claudebox
Current Bash version is too old (3.2.57(1)-release).
Newer Bash not found, for macOS install with $ brew install bash.
./claudebox: line 1337: syntax error near unexpected token `;&#39;
```

then install newer bash
`brew install bash`

```
./claudebox
Current Bash version is too old (3.2.57(1)-release).
Switching to newer Bash: /opt/homebrew/opt/bash/bin/bash
Untagged: claudebox-users_diepes_github_claudebox_7d3c55:latest
Deleted: sha256:d43634c225b903bd898868e1217eab0c0953925a843ce02c7203cd3aca5615b4
...
...
```

## Summary by Sourcery

Add runtime check for Bash versions earlier than 4 on macOS, automatically switch to a Homebrew-installed Bash if available, or prompt the user to install it and pause before continuing.

Enhancements:

- Detect Bash version at startup and flag versions &lt;4
- Search common Homebrew install paths for Bash v4 on macOS
- Re-execute the script under the newer Bash interpreter when found
- Prompt the user to install Bash via brew and pause briefly if no newer Bash is located

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: Fix warning if bash &lt; v4 try to find brew macOS version
