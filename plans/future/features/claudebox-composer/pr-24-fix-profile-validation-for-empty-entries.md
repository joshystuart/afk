---
source: RchGrav/claudebox
kind: pull_request
number: 24
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/24
author: RchGrav
head: codex/refactor-profile-validation-logic
base: main
created_at: 2025-06-25T06:54:51Z
updated_at: 2025-06-25T06:55:19Z
---

# Fix profile validation for empty entries

## Summary

- allow empty profile values by checking key existence in the PROFILES array

## Testing

- `bash -n claudebox`

---

https://chatgpt.com/codex/tasks/task_e_685b9cafe9fc83218cbe862bce6a095b

## Summary by Sourcery

Bug Fixes:

- Allow empty profile values by validating key presence in PROFILES instead of value content.

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: Fix profile validation for empty entries
