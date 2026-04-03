---
source: RchGrav/claudebox
kind: pull_request
number: 14
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/14
author: sgrimm
head: group-id
base: main-bak
created_at: 2025-06-19T21:51:32Z
updated_at: 2025-06-23T05:39:55Z
---

# Fix chown failure if local group ID exists

If the user&#39;s group ID on the host happens to be an ID that&#39;s already
present in the Debian base image&#39;s `/etc/group` file, the `groupadd`
command doesn&#39;t add a new `claudebox` group. ClaudeBox ignores that
command&#39;s failure, but the lack of the group causes a failure when
the startup script tries to run `chown claudebox:claudebox`.

Fix it by adding the `-o` option to `groupadd`, which enables adding
groups with duplicate IDs. Duplicate group IDs aren&#39;t good practice
in general, but in the context of ClaudeBox, shouldn&#39;t cause any
problems.

## Summary by Sourcery

Bug Fixes:

- Add the -o option to groupadd to allow duplicate group IDs and avoid startup errors when the claudebox group already exists

## AFK planning summary

- **Category**: WSL / root UID / Docker user & group edge cases
- **Theme key**: `platform_wsl_root`
- **Short description**: Fix chown failure if local group ID exists
