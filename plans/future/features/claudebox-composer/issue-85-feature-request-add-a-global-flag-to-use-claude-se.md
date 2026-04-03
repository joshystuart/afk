---
source: RchGrav/claudebox
kind: issue
number: 85
state: open
url: https://github.com/RchGrav/claudebox/issues/85
author: ahmet-cetinkaya
comments: 0
created_at: 2025-11-06T11:17:58Z
updated_at: 2025-11-06T11:17:58Z
---

# Feature Request: Add a --global flag to use ~/.claude settings directly

**Problem:**
There is currently no option in `claudebox` to directly use the global settings from `~/.claude/`. The tool appears to be designed for project-level isolation, which is not always desired.

**The Current &#34;Trick&#34;:**
The only available solution is a &#34;trick&#34;: manually copying the global configuration from `~/.claude/` into the local `.claude/` directory for every single project. This workaround is inconvenient and not scalable.

**Suggested Solution:**
A new command-line flag, for example `--global`, should be added. This flag would instruct `claudebox` to always use the configuration found in `~/.claude/`, providing a much-needed option for users who prefer a single, global setup.

## AFK planning summary

- **Category**: Global Claude config & skills (~/.claude mount, --global)
- **Theme key**: `global_claude_settings`
- **Short description**: Feature Request: Add a --global flag to use ~/.claude settings directly — Mount or opt into host `~/.claude` (settings, commands, skills) instead of only isolated project dirs.
