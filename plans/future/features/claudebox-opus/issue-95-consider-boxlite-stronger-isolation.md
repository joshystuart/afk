---
source: RchGrav/claudebox
kind: issue
number: 95
state: open
url: https://github.com/RchGrav/claudebox/issues/95
author: DorianZheng
created_at: 2025-12-31T00:00:00Z
---

# Consider BoxLite for stronger isolation

Suggestion to evaluate **BoxLite** (or VM-based runtimes) as a **Docker alternative** for **stronger isolation** when running AI agents with broad file and network access. Tradeoffs: startup time, complexity, platform support.

## AFK Relevance

| Field                 | Value                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Category**          | Isolation / runtime                                                                                                   |
| **Theme key**         | `isolation_runtime`                                                                                                   |
| **Short description** | AFK’s threat model may eventually require stronger isolation than OCI defaults; worth tracking alternative sandboxes. |
