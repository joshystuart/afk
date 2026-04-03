---
source: RchGrav/claudebox
kind: issue
number: 66
state: open
url: https://github.com/RchGrav/claudebox/issues/66
author: fletchgqc
created_at: 2025-09-09T00:00:00Z
---

# awk problem on Java profile

When **adding the Java profile**, the build or templating step hits an **`awk` newline/parsing error**—often from malformed line continuation or empty input to `awk`. Related to profile snippets merged into Dockerfile or config.

## AFK Relevance

| Field                 | Value                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Category**          | Docker build                                                                                                      |
| **Theme key**         | `docker_build`                                                                                                    |
| **Short description** | Profile assembly via shell/`awk` is fragile; AFK image recipes should validate inputs and fail with clear errors. |
