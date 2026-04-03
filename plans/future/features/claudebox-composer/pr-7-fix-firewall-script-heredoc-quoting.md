---
source: RchGrav/claudebox
kind: pull_request
number: 7
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/7
author: RchGrav
head: codex/work-on-open-issues
base: main
created_at: 2025-06-17T00:20:44Z
updated_at: 2025-06-17T00:23:17Z
---

# Fix firewall script heredoc quoting

## Summary

- quote the firewall script heredoc when generating the Dockerfile

## Testing

- `bash -n claudebox`
- `pytest -q`

---

https://chatgpt.com/codex/tasks/task_e_6850b3dcb6b0832199ca15fc2a301b1c

## Summary by Sourcery

Bug Fixes:

- Quote the firewall script heredoc in the Dockerfile generation to preserve script content

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: Fix firewall script heredoc quoting
