---
source: RchGrav/claudebox
kind: issue
number: 28
state: open
url: https://github.com/RchGrav/claudebox/issues/28
author: benp-mns
comments: 3
created_at: 2025-07-04T11:54:18Z
updated_at: 2025-07-28T08:58:16Z
---

# MacOS doesn&#39;t have sha256sum causing claudebox script to fail

sha256sum is used in numerous places, e.g.:

`profile_hash=$(printf &#39;%s\n&#39;
     &#34;${current_profiles[@]}&#34; | sort | sha256sum | cut -d&#39; &#39; -f1)`

macOS uses `shasum` instead, so:

`profile_hash=$(printf &#39;%s\n&#39;
     &#34;${current_profiles[@]}&#34; | sort | shasum -a 256 | cut -d&#39; &#39; -f1)`

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: MacOS doesn&#39;t have sha256sum causing claudebox script to fail — Bash 3.2 / `set -u` / `local` misuse / array expansion bugs break install and entrypoints on macOS and strict shells.
