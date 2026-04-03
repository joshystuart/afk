---
source: RchGrav/claudebox
kind: issue
number: 94
state: open
url: https://github.com/RchGrav/claudebox/issues/94
author: shoeless03
created_at: 2025-12-31T00:00:00Z
---

# Slot not starting even though available

**Creating a slot succeeds**, but **launching** it does not—**“no available slot”** or equivalent despite an apparent free slot. Suggests bookkeeping bugs, orphaned state, or mismatched slot IDs between create and start flows.

## AFK Relevance

| Field                 | Value                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Category**          | Slots UX                                                                                                          |
| **Theme key**         | `slots_ux`                                                                                                        |
| **Short description** | Session allocation UX must be trustworthy; AFK should avoid contradictory states between create and attach/start. |
