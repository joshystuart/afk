# Requirements: AFK (Away From Keyboard)

**Defined:** 2026-04-18
**Core Value:** Secure agentic coding without DX compromise — containers provide isolation that can't be circumvented, while the UI makes working inside them feel as natural as working locally.

## v2.0 Requirements

Requirements for milestone **v2.0**. Each maps to roadmap phases 4–6.

### Diff & Review

- [ ] **DIFF-01**: User can see a git-aware summary of what changed after an agent run completes (files touched, high-level change intent)
- [ ] **DIFF-02**: User can open a structured, syntax-highlighted diff view for those changes in the session UI

### Git Automation

- [ ] **GAUT-01**: User can auto-generate a commit message from the current change context (diff / staged changes) inside the session workflow
- [ ] **GAUT-02**: User can auto-generate a PR-style description from branch/repo change context where applicable
- [ ] **GAUT-03**: User can configure which model is used for commit and PR message generation (via existing settings patterns)

### Agent Runner & Multi-Agent

- [ ] **AGNT-01**: Server exposes a pluggable agent runner abstraction that replaces ad hoc single-agent CLI invocation paths
- [ ] **AGNT-02**: Session containers can run the supported CLI agents needed for the milestone (e.g. Claude, Codex, Cursor CLI) with clear packaging or install contract
- [ ] **AGNT-03**: User can lock an agent for a session and/or select an agent per prompt from the UI (within supported agents)

## Deferred (post–v2.0 core)

Tracked for later milestones; not committed in v2.0 roadmap phases.

### Security Hardening

- **SECU-01**: Session-scoped WebSocket authorization prevents cross-session data bleed
- **SECU-02**: Path-validated workspace API prevents traversal attacks
- **SECU-03**: Argv-only git execution prevents command injection

### Multi-Agent

- **AGNT-04**: Concurrency model for multiple agents against the same workspace (locking/queuing) when that becomes necessary

### Diff & Review

- **DIFF-03**: Per-file drill-down and navigation within the diff viewer
- **DIFF-04**: Binary file detection and payload size caps for diff streaming

### Git Automation

- **GAUT-04**: Secret scanning gate before commit (e.g. gitleaks/detect-secrets)

### Skills Management

- **SKIL-04**: Symlink validation in skills directories prevents mount escape

## Out of Scope

| Feature                                     | Reason                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| Full in-browser IDE / code editor           | AFK hosts agents, not an IDE; "open in IDE" defers to local editors    |
| Real-time collaborative editing             | Single-user tool, not a multiplayer IDE                                |
| Hosted agent marketplace                    | Supply-chain risk; conflicts with read-only skills and security stance |
| Silent auto-merge to main                   | Breaks review/compliance workflow                                      |
| Unrestricted host filesystem from container | Destroys isolation story                                               |
| Mobile app                                  | Poor fit for agentic coding UX                                         |
| Browser-in-agent (OpenHands-style)          | High security surface area; defer to v2+                               |
| Micro-VM / Firecracker isolation            | Docker sufficient unless proven otherwise                              |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase                               | Status  |
| ----------- | ----------------------------------- | ------- |
| DIFF-01     | Phase 4: Diff Pipeline & Review     | Pending |
| DIFF-02     | Phase 4: Diff Pipeline & Review     | Pending |
| GAUT-01     | Phase 5: Git Automation             | Pending |
| GAUT-02     | Phase 5: Git Automation             | Pending |
| GAUT-03     | Phase 5: Git Automation             | Pending |
| AGNT-01     | Phase 6: Agent Runner & Multi-Agent | Pending |
| AGNT-02     | Phase 6: Agent Runner & Multi-Agent | Pending |
| AGNT-03     | Phase 6: Agent Runner & Multi-Agent | Pending |

**Coverage:**

- v2.0 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0 ✓

---

_Requirements defined: 2026-04-18_

_Last updated: 2026-04-18 after v2.0 roadmap creation_
