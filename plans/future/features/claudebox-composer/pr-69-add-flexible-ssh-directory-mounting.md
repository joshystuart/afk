---
source: RchGrav/claudebox
kind: pull_request
number: 69
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/69
author: fletchgqc
head: flexible-ssh
base: main
created_at: 2025-09-09T15:08:02Z
updated_at: 2025-09-09T15:08:44Z
---

# Add flexible SSH directory mounting

- Mount ~/.claudebox/ssh read-write when it exists for persistent SSH state
- Fall back to ~/.ssh read-only for backwards compatibility
- Documentation with setup instructions for dedicated ClaudeBox SSH keys

## Summary by Sourcery

Enable flexible SSH key mounting by preferring a dedicated ~/.claudebox/ssh directory with read-write access and falling back to ~/.ssh as read-only, and update documentation with setup instructions

New Features:

- Add support for mounting ~/.claudebox/ssh into containers as a read-write directory for persistent SSH state

Enhancements:

- Fallback to mounting the user’s ~/.ssh directory as read-only when no ClaudeBox SSH directory exists

Documentation:

- Add README section explaining SSH directory configuration and setup for ClaudeBox keys

## AFK planning summary

- **Category**: SSH client & key mounting / security docs
- **Theme key**: `ssh_keys`
- **Short description**: Add flexible SSH directory mounting
