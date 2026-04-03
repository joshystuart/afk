---
source: RchGrav/claudebox
kind: issue
number: 68
state: open
url: https://github.com/RchGrav/claudebox/issues/68
author: fletchgqc
created_at: 2025-09-09T00:00:00Z
---

# Gitconfig not available to container

The host’s **`~/.gitconfig`** is not visible inside the container, so **name, email, aliases, and tooling defaults** don’t apply. Request: **mount read-only** (or sync) user git config into the expected path for the container user.

## AFK Relevance

| Field                 | Value                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Category**          | Git integration                                                                                                  |
| **Theme key**         | `git_integration`                                                                                                |
| **Short description** | AFK sessions should inherit sensible git identity from the host when users expect parity with local development. |
