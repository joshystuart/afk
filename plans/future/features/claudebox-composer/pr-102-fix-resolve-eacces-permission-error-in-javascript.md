---
source: RchGrav/claudebox
kind: pull_request
number: 102
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/102
author: b00y0h
head: fix/javascript-profile-permissions
base: main
created_at: 2026-02-13T00:23:14Z
updated_at: 2026-02-13T00:40:44Z
---

# fix: resolve EACCES permission error in javascript profile

## Summary

- The `get_profile_javascript()` function installs nvm as root, but then switches to `USER claude` before running `npm install -g`. Since the nvm directory (`/home/claude/.nvm`) is owned by root, the claude user gets `EACCES: permission denied` when npm tries to write to `node_modules`.
- Adds `RUN chown -R claude:claude $NVM_DIR` before the `USER claude` switch to fix directory ownership.

## Steps to reproduce

1. `claudebox add javascript`
2. Run `claudebox` — build fails at `npm install -g` with EACCES error

## Test plan

- [ ] Run `claudebox add javascript` followed by `claudebox` and verify the Docker build completes successfully
- [ ] Verify `typescript`, `eslint`, `prettier`, `yarn`, and `pnpm` are available inside the container

## Summary by Sourcery

Bug Fixes:

- Correct NVM directory ownership so the claude user can run global npm installs without EACCES permission errors.

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: fix: resolve EACCES permission error in javascript profile
