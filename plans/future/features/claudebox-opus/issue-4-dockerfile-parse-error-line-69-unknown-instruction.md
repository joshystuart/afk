---
source: RchGrav/claudebox
kind: issue
number: 4
state: closed
url: https://github.com/RchGrav/claudebox/issues/4
author: JoshuaRileyDev
created_at: 2025-06-15
---

# Dockerfile parse error line 69: unknown instruction {

Docker build fails with a parse error around a line that starts with `{` or similar, because content intended to be inside a heredoc or JSON block is emitted into the Dockerfile as raw text. Docker then treats `{` as an unknown instruction.

This is the same class of problem as other Dockerfile generation issues: heredoc/quoting must ensure the generated file is valid Dockerfile syntax.

---

## AFK Relevance

| Field                 | Value                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Category**          | docker_build                                                                                                                                                 |
| **Theme key**         | docker_build                                                                                                                                                 |
| **Short description** | Valid Dockerfile emission from templates/heredocs is required so builds succeed; stray `{` lines indicate generation bugs AFK-adjacent tooling should avoid. |
