---
source: RchGrav/claudebox
kind: pull_request
number: 47
state: merged
url: https://github.com/RchGrav/claudebox/pull/47
author: RchGrav
created_at: 2025-08-15
---

# Fix issue #45

Resolves issue #45 by fixing placeholder substitution during profile installation so profile-specific fragments are expanded correctly in the generated image configuration.

---

## AFK Relevance

| Field                 | Value                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Category**          | Docker / image build                                                                                                                             |
| **Theme key**         | docker_build                                                                                                                                     |
| **Short description** | Profile templating bugs break optional stacks (e.g. “core” profile); AFK’s multi-profile or addon images face similar substitution requirements. |
