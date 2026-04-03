---
source: RchGrav/claudebox
kind: pull_request
number: 7
state: merged
url: https://github.com/RchGrav/claudebox/pull/7
author: jccbbb
created_at: 2025-06-16
---

# Fix firewall script heredoc quoting

Corrects heredoc quoting in the firewall-related script so the generated Dockerfile is valid. Prevents Docker from mis-parsing embedded content when the template is expanded.

---

## AFK Relevance

| Field                 | Value                                                                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Docker / image build                                                                                                                                |
| **Theme key**         | docker_build                                                                                                                                        |
| **Short description** | Heredoc and template bugs are a common source of “Dockerfile parse error” failures; patterns apply to any generated-Dockerfile stack including AFK. |
