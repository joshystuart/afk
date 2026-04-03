---
source: RchGrav/claudebox
kind: pull_request
number: 67
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/67
author: fletchgqc
head: mount-gitconfig
base: main
created_at: 2025-09-09T15:04:22Z
updated_at: 2025-09-09T15:05:05Z
---

# Mount user&#39;s .gitconfig read-only in containers

- Automatically mount ~/.gitconfig as read-only when it exists
- Includes verbose debug logging when enabled

## Summary by Sourcery

Automatically mount the user’s ~/.gitconfig as read-only inside the Docker container when present, and provide optional debug logging for the mount step.

New Features:

- Mount the host user’s ~/.gitconfig as a read-only volume in the container if it exists.
- Emit a debug log message when verbose mode is enabled for the gitconfig mount step.

## AFK planning summary

- **Category**: Git metadata in container (.git, gitconfig)
- **Theme key**: `git_integration`
- **Short description**: Mount user&#39;s .gitconfig read-only in containers
