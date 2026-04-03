---
source: RchGrav/claudebox
kind: issue
number: 63
state: open
url: https://github.com/RchGrav/claudebox/issues/63
author: scottishdeveloper
comments: 3
created_at: 2025-09-01T06:49:34Z
updated_at: 2025-09-09T15:24:40Z
---

# SSH - Perhaps consider or document potential security risk

From claude himself:

No, the ClaudeBox documentation does not mention the SSH mounting behavior in any of the docs. This is a significant security oversight because:

What&#39;s Missing:

1. No documentation about automatic SSH key mounting
2. No security warnings about credential exposure
3. No opt-in/opt-out mechanism described
4. No alternatives suggested (SSH agent forwarding, deploy keys, etc.)

The only security mentions are:

- Network isolation with firewall allowlists
- Security flags like --enable-sudo and --disable-firewall
- Permission warnings about dangerous operations

Security Issue:

The code silently mounts ~/.ssh read-only into every container without:

- User consent or awareness
- Documentation of this behavior
- Security implications explained
- Alternative authentication methods offered

This is a documentation gap that should be addressed, especially since users would expect to be informed when their SSH keys are being exposed to containerized
environments. The lack of documentation makes this behavior &#34;hidden&#34; and potentially surprising to security-conscious users.

## AFK planning summary

- **Category**: SSH client & key mounting / security docs
- **Theme key**: `ssh_keys`
- **Short description**: SSH - Perhaps consider or document potential security risk — Ship `ssh` client in image and/or document risks of mounting `~/.ssh`.
