---
source: RchGrav/claudebox
kind: issue
number: 79
state: open
url: https://github.com/RchGrav/claudebox/issues/79
author: GreyAssoc
comments: 0
created_at: 2025-09-25T15:11:05Z
updated_at: 2025-09-25T15:11:05Z
---

# SSH binaries not found

I have given claudebox its own ssh key for my remote server (which I will revoke once dev is complete) but it can&#39;t connect to my server as &#39;ssh not found&#39; and &#39;SSH binaries not found&#39;. I&#39;ve connected to the remote server myself with its credentials so I know that they work.

Claude cli on its own is able to use ssh, as does claude-docker (I know these are different products but it demonstrates that claude has the capability to ssh into my server). Is there anything I need to do to give claudebox the ability to use ssh?

## AFK planning summary

- **Category**: SSH client & key mounting / security docs
- **Theme key**: `ssh_keys`
- **Short description**: SSH binaries not found — Ship `ssh` client in image and/or document risks of mounting `~/.ssh`.
