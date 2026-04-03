---
source: RchGrav/claudebox
kind: pull_request
number: 34
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/34
author: diepes
head: #29-chown-userid-groupid
base: main
created_at: 2025-07-21T08:51:23Z
updated_at: 2025-08-18T10:45:34Z
---

# Fix user USER_ID and GROUP_ID in container rather than USERNAME

On MacOS the GROUP_ID we get with
https://github.com/RchGrav/claudebox/blob/82302e37d5e0ff72ca15f0ae9c8450d6f47e11be/claudebox#L24

Can conflict with existing group in container.
This does not cause a error as the creation of the group is optional and just continues if group exists
https://github.com/RchGrav/claudebox/blob/82302e37d5e0ff72ca15f0ae9c8450d6f47e11be/claudebox#L1963

This then fails when we assume the USERNAME is the same as the GROUPNAME
https://github.com/RchGrav/claudebox/blob/82302e37d5e0ff72ca15f0ae9c8450d6f47e11be/claudebox#L2161

Fix is to just use the USER_ID and GROUP_ID in the chown.

## Summary by Sourcery

Bug Fixes:

- Use numeric user and group IDs in chown instead of username to avoid container group name conflicts on macOS

## AFK planning summary

- **Category**: WSL / root UID / Docker user & group edge cases
- **Theme key**: `platform_wsl_root`
- **Short description**: Fix user USER_ID and GROUP_ID in container rather than USERNAME
