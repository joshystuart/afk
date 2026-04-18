# Project Retrospective

_A living document updated after each milestone. Lessons feed forward into future planning._

## Milestone: v0.3.4 — Workspace release

**Shipped:** 2026-04-18

**Phases:** 3 | **Plans:** 11

### What Was Built

- In-session chat/terminal switching with PTY-over-WebSocket and xterm.js
- Read-only skills directory mount with settings and per-session opt-out
- Workspace REST API, file explorer with preview, @-path autocomplete, and open-in-IDE

### What Worked

- Phased delivery (session → skills → workspace) kept each slice independently testable
- Read-only bind mounts and path validation reused patterns from workspace mount work

### What Was Inefficient

- Follow-up “gap” plans (DTO whitelist, keyboard shortcut parity) needed after initial feature merge

### Patterns Established

- Settings fields that affect the container should round-trip through GET after PUT
- Cross-platform shortcuts should use `metaKey`/`ctrlKey` patterns rather than key literals alone

### Key Lessons

1. Gate data-heavy hooks (e.g. file index) on session running state to avoid error storms during provisioning.
2. Align roadmap phase numbers with execution order early to avoid duplicate “Phase 3” labels in docs.

### Cost Observations

- Model mix: not recorded
- Sessions: not recorded
- Notable: Retro filled at planning close; refine with team input if needed

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change                                     |
| --------- | -------- | ------ | ---------------------------------------------- |
| v0.3.4    | —        | 3      | First GSD milestone archive for AFK v1 program |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
| --------- | ----- | -------- | ------------------ |
| v0.3.4    | —     | —        | —                  |

### Top Lessons (Verified Across Milestones)

_To be populated as additional milestones ship._
