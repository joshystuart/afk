---
source: RchGrav/claudebox
kind: issue
number: 31
state: open
url: https://github.com/RchGrav/claudebox/issues/31
author: hustlelabs
comments: 11
created_at: 2025-07-05T18:59:53Z
updated_at: 2025-09-24T15:13:34Z
---

# Issue installing on fresh macos

Hello,

I&#39;ve installed brew. I haven&#39;t installed anything within brew. Other than that, the MacOS install is completely fresh.

When running ./claudebox to install, I get this error:
``claudebox: line 1322: syntax error near unexpected token `;&#39;``

bash version:
`GNU bash, version 3.2.57(1)-release (arm64-apple-darwin24)
Copyright (C) 2007 Free Software Foundation, Inc.`

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: Issue installing on fresh macos — Bash 3.2 / `set -u` / `local` misuse / array expansion bugs break install and entrypoints on macOS and strict shells.
