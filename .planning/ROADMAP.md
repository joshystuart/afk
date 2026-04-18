# Roadmap: AFK (Away From Keyboard)

## Milestones

- ✅ **v1.0** — Phases 1–3: Session UX, Skills provisioning, Workspace API & file explorer ([shipped 2026-04-18](milestones/v1.0-ROADMAP.md); [phase archive](milestones/v1.0-phases/))
- 🚧 **v2.0** — Phases 4–6: Diff pipeline & review, Git automation, Agent runner & multi-agent _(this milestone)_

Full detail for the shipped milestone: [`.planning/milestones/v1.0-ROADMAP.md`](milestones/v1.0-ROADMAP.md)

## Overview

**v1.0** delivered daily-driver session UX (chat ↔ terminal), read-only skills provisioning, and workspace exploration with `@` context. **v2.0** adds visibility into agent-made changes (diff), accelerates git workflows (generated messages), and generalizes invocation behind a multi-agent runner.

Phase numbering **continues** from v1.0 (ended at Phase 3): v2.0 executes **Phases 4–6**.

## Phases (v2.0)

**Phase numbering:** Integer phases (1, 2, 3, …); decimal phases (e.g. 4.1) for urgent insertions only.

### Shipped (v1.0)

- [x] **Phase 1: Session UX** — Tab toggle between chat and terminal within a session
- [x] **Phase 2: Skills Provisioning** — Read-only skills directory mounting into session containers
- [x] **Phase 3: Workspace API & File Explorer** — Container file browsing, `@` autocomplete, open-in-IDE

### v2.0 plan

- [ ] **Phase 4: Diff Pipeline & Review** — Post-run change summary and syntax-highlighted diff viewer (**DIFF-01**, **DIFF-02**)

  **Success criteria:**

  1. After an agent run finishes, the user sees which files changed and a concise summary suitable for review at a glance.
  2. The user can open a diff experience that shows structured patches with syntax highlighting for text sources.
  3. Diff data is obtained safely for the session workspace (no path escape; reasonable limits on size/binary files).

- [ ] **Phase 5: Git Automation** — Auto-generated commit messages and PR descriptions with configurable model (**GAUT-01**, **GAUT-02**, **GAUT-03**)

  **Success criteria:**

  1. The user can request a generated commit message from the current change context without leaving the session workflow.
  2. The user can request a generated PR-style description when branch/repo context is available.
  3. The user can configure which model powers generation, consistent with existing settings patterns.

- [ ] **Phase 6: Agent Runner & Multi-Agent** — Pluggable runner and selectable agents (**AGNT-01**, **AGNT-02**, **AGNT-03**)

  **Success criteria:**

  1. Agent invocation routes through a single runner abstraction that can be extended for additional CLI agents.
  2. Containers satisfy a clear contract for installing/invoking the supported CLI agents targeted by the milestone.
  3. The user can choose agent scope at session and/or per-prompt granularity for supported agents.

## Progress

| Phase                            | Milestone | Plans complete | Status      | Completed  |
| -------------------------------- | --------- | -------------- | ----------- | ---------- |
| 1. Session UX                    | v1.0      | 3/3            | Complete    | 2026-04-18 |
| 2. Skills Provisioning           | v1.0      | 4/4            | Complete    | 2026-04-18 |
| 3. Workspace API & File Explorer | v1.0      | 4/4            | Complete    | 2026-04-18 |
| 4. Diff Pipeline & Review        | v2.0      | —              | Not started | —          |
| 5. Git Automation                | v2.0      | —              | Not started | —          |
| 6. Agent Runner & Multi-Agent    | v2.0      | —              | Not started | —          |

---

_Last updated: 2026-04-18 — v2.0 milestone roadmap_
