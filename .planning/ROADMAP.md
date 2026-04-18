# Roadmap: AFK (Away From Keyboard)

## Milestones

- ✅ **v1.0** — Phases 1–3: Session UX, Skills provisioning, Workspace API & file explorer ([shipped 2026-04-18](milestones/v1.0-ROADMAP.md))
- 📋 **Next** — Diff pipeline & review, Git automation, agent runner / multi-agent (not yet broken into new phase directories)

Full detail for the shipped milestone: [`.planning/milestones/v1.0-ROADMAP.md`](milestones/v1.0-ROADMAP.md)

## Overview

AFK’s v1.0 milestone focused on daily-driver UX inside sessions (chat ↔ terminal), read-only skills provisioning, and workspace file exploration with `@` context from the web UI. Follow-on work (diff review, git message generation, pluggable multi-agent runner) remains planned for a subsequent milestone.

## Phases (current milestone plan)

**Phase numbering:** Integer phases (1, 2, 3, …); decimal phases (2.1, …) for urgent insertions.

### Shipped in v1.0

- [x] **Phase 1: Session UX** — Tab toggle between chat and terminal within a session
- [x] **Phase 2: Skills Provisioning** — Read-only skills directory mounting into session containers
- [x] **Phase 3: Workspace API & File Explorer** — Container file browsing, `@` autocomplete, open-in-IDE

### Planned (next milestone)

- [ ] **Diff Pipeline & Review** — Post-run git diff summary and syntax-highlighted diff viewer
- [ ] **Git Automation** — Auto-generated commit messages and PR descriptions with model selection
- [ ] **Agent Runner & Multi-Agent** — Pluggable runner (Claude, Codex, Cursor CLI) replacing ad-hoc invocation

## Progress

| Phase                            | Milestone | Plans complete | Status      | Completed  |
| -------------------------------- | --------- | -------------- | ----------- | ---------- |
| 1. Session UX                    | v1.0      | 3/3            | Complete    | 2026-04-18 |
| 2. Skills Provisioning           | v1.0      | 4/4            | Complete    | 2026-04-18 |
| 3. Workspace API & File Explorer | v1.0      | 4/4            | Complete    | 2026-04-18 |
| Diff Pipeline & Review           | —         | —              | Not started | —          |
| Git Automation                   | —         | —              | Not started | —          |
| Agent Runner & Multi-Agent       | —         | —              | Not started | —          |
