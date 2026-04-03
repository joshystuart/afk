---
source: RchGrav/claudebox
kind: pull_request
number: 21
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/21
author: RchGrav
head: codex/fix-grep--p-flag-issue-on-macos
base: main
created_at: 2025-06-23T01:45:55Z
updated_at: 2025-06-23T01:49:47Z
---

# Pin git-delta version

## Summary

- pin git-delta to version 0.17.0 in the build script
- pass DELTA_VERSION as a build argument
- update README to note the pinned git-delta version

## Testing

- `bash -n claudebox`

---

https://chatgpt.com/codex/tasks/task_e_6858ab1e8d9483219c9f9820a311cb24

## Summary by Sourcery

Pin the git-delta tool to version 0.17.0 in the Docker build and update documentation accordingly

Build:

- Pin git-delta to v0.17.0 and expose DELTA_VERSION as a build argument

Documentation:

- Update README to reflect the pinned git-delta version

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: Pin git-delta version
