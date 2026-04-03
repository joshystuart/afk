---
source: RchGrav/claudebox
kind: issue
number: 32
state: closed
url: https://github.com/RchGrav/claudebox/issues/32
author: TheConnMan
comments: 3
created_at: 2025-07-09T15:09:10Z
updated_at: 2025-07-25T12:52:49Z
---

# Home Claude Settings Not Mounted In

I expected from the README.md that `~/.claude/` would be mounted in read only to the docker user&#39;s home folder so I could use my Claude commands and my Claude.md file. This doesn&#39;t seem to happen by default. Is that expected? If so, can we mount that into the home directory and the project&#39;s claude folder into the /workspace?

I was tweaking this locally: https://github.com/RchGrav/claudebox/blob/62a2fce89850406d7a41f412f740aecd22138ce3/claudebox#L382-L397

I&#39;m on Windows running under WSL2.

## AFK planning summary

- **Category**: Global Claude config & skills (~/.claude mount, --global)
- **Theme key**: `global_claude_settings`
- **Short description**: Home Claude Settings Not Mounted In — Mount or opt into host `~/.claude` (settings, commands, skills) instead of only isolated project dirs.
