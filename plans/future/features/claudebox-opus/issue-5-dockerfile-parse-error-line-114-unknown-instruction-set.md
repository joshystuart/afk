---
source: RchGrav/claudebox
kind: issue
number: 5
state: closed
url: https://github.com/RchGrav/claudebox/issues/5
author: crowne
created_at: 2025-06-16
---

# Dockerfile parse error line 114: unknown instruction set

Build fails because a firewall or setup script embedded in the Dockerfile via a heredoc is not quoted or delimited correctly. Fragments like `set` or shell lines leak into the Dockerfile as instructions, producing `unknown instruction` errors.

**Root cause:** Heredoc/quoting in the generator script so that shell script content is written to the image build context correctly, not interpreted as Dockerfile instructions.

---

## AFK Relevance

| Field                 | Value                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Category**          | docker_build                                                                                                                                                                   |
| **Theme key**         | docker_build                                                                                                                                                                   |
| **Short description** | Embedded scripts in generated Dockerfiles must use correct heredoc quoting so Docker only sees valid instructions—relevant for any AFK image build that uses similar patterns. |
