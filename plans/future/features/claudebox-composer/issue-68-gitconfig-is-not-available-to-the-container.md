---
source: RchGrav/claudebox
kind: issue
number: 68
state: open
url: https://github.com/RchGrav/claudebox/issues/68
author: fletchgqc
comments: 1
created_at: 2025-09-09T15:04:46Z
updated_at: 2025-09-09T15:24:11Z
---

# Gitconfig is not available to the container

Instead of forcing me to define my gitconfig for every new container, it should just mount the standard one from the host user directory.

PR here: https://github.com/RchGrav/claudebox/pull/67/files

## AFK planning summary

- **Category**: Git metadata in container (.git, gitconfig)
- **Theme key**: `git_integration`
- **Short description**: Gitconfig is not available to the container — Mount `.git` and/or `~/.gitconfig` so builds and git-based tooling work.
