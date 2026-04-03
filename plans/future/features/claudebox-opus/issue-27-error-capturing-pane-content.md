---
source: RchGrav/claudebox
kind: issue
number: 27
state: closed
url: https://github.com/RchGrav/claudebox/issues/27
author: hayke102
created_at: 2025-07-01
---

# Error capturing pane content

After a hard exit or abnormal session end, capturing tmux pane content fails (error when reading or dumping pane output). May relate to session/pane lifecycle or timing.

**User impact:** Automation or logging that relies on pane capture breaks in edge cases.

---

## AFK Relevance

| Field                 | Value                                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Category**          | terminal_ux                                                                                                                                          |
| **Theme key**         | terminal_ux                                                                                                                                          |
| **Short description** | Reliable terminal/tmux pane capture matters for session logging and UX; AFK’s web terminal + exec flows should handle similar edge cases gracefully. |
