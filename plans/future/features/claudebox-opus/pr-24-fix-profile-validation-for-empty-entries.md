---
source: RchGrav/claudebox
kind: pull_request
number: 24
state: merged
url: https://github.com/RchGrav/claudebox/pull/24
author: RchGrav
created_at: 2025-06-28
---

# Fix profile validation for empty entries

Makes profile list parsing tolerant of blank lines or empty profile entries so validation does not fail on harmless whitespace in configuration.

---

## AFK Relevance

| Field                 | Value                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| **Category**          | Docker / image build                                                                           |
| **Theme key**         | docker_build                                                                                   |
| **Short description** | Profile/plugin lists in AFK-style configs should accept empty entries without breaking builds. |
