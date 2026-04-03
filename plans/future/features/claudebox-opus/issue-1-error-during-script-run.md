---
source: RchGrav/claudebox
kind: issue
number: 1
state: closed
url: https://github.com/RchGrav/claudebox/issues/1
author: jccbbb
created_at: 2025-06-10
---

# Error during script run

The install or build process fails while running scripts that generate a Dockerfile. Docker reports a parse error because the generated Dockerfile contains invalid syntax—often where heredocs or embedded JSON are not quoted or escaped correctly, so Docker interprets `{` or other tokens as instructions instead of file content.

**Typical symptom:** `failed to solve` / Dockerfile parse error related to unexpected `{` or malformed lines after generation.

---

## AFK Relevance

| Field                 | Value                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | docker_build                                                                                                                                                                |
| **Theme key**         | docker_build                                                                                                                                                                |
| **Short description** | Users need Dockerfile generation and templating to produce valid Dockerfiles so AFK (or similar) image builds do not fail on parse errors from heredoc/JSON embedding bugs. |
