---
source: RchGrav/claudebox
kind: pull_request
number: 15
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/15
author: sgrimm
head: uppercase-dir
base: main-bak
created_at: 2025-06-19T21:52:52Z
updated_at: 2025-06-23T05:39:56Z
---

# Move project path to image tag to allow uppercase directory names

Docker doesn&#39;t allow repository names to have uppercase letters. Since ClaudeBox includes the project path in the image name, this means the name will be invalid if the project directory or any of its ancestors has a mixed-case name.

Put the project path in the image tag, which allows a wider range of characters.

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: Move project path to image tag to allow uppercase directory names
