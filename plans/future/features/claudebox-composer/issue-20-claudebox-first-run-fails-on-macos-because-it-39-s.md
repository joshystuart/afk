---
source: RchGrav/claudebox
kind: issue
number: 20
state: closed
url: https://github.com/RchGrav/claudebox/issues/20
author: nikvdp
comments: 1
created_at: 2025-06-22T09:55:16Z
updated_at: 2025-06-23T05:40:23Z
---

# `./claudebox` first-run fails on macOS because it&#39;s trying to use an invalid grep flag

```shell
╰─➤  claudebox

 ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗
██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝
██║     ██║     ███████║██║   ██║██║  ██║█████╗
██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝
╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗
 ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝

██████╗  ██████╗ ██╗  ██╗ ------ ┌──────────────┐
██╔══██╗██╔═══██╗╚██╗██╔╝ ------ │ The Ultimate │
██████╔╝██║   ██║ ╚███╔╝  ------ │ Claude Code  │
██╔══██╗██║   ██║ ██╔██╗  ------ │  Docker Dev  │
██████╔╝╚██████╔╝██╔╝ ██╗ ------ │ Environment  │
╚═════╝  ╚═════╝ ╚═╝  ╚═╝ ------ └──────────────┘

Fetching latest git-delta version...
grep: invalid option -- P
usage: grep [-abcdDEFGHhIiJLlMmnOopqRSsUVvwXxZz] [-A num] [-B num] [-C[num]]
        [-e pattern] [-f file] [--binary-files=value] [--color=when]
        [--context[=num]] [--directories=action] [--label] [--line-buffered]
        [--null] [pattern] [file ...]
```

the issue seems to be that macOS&#39; default grep doesn&#39;t support grep&#39;s -P flag

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: `./claudebox` first-run fails on macOS because it&#39;s trying to use an invalid grep flag — Bash 3.2 / `set -u` / `local` misuse / array expansion bugs break install and entrypoints on macOS and strict shells.
