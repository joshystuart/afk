# Requirements: AFK (Away From Keyboard)

**Defined:** 2026-04-10
**Core Value:** Secure agentic coding without DX compromise — containers provide isolation that can't be circumvented, while the UI makes working inside them feel as natural as working locally.

## v1 Requirements

Requirements for v1 milestone. Each maps to roadmap phases.

### Skills Management

- [x] **SKIL-01**: User can configure a skills directory path in Settings
- [x] **SKIL-02**: Session containers mount the configured skills directory as read-only at creation time
- [ ] **SKIL-03**: Skills mounting supports multiple ecosystem layouts (GSD, skills.sh, superpowers)

### Multi-Agent

- [ ] **AGNT-01**: Server has a pluggable agent runner abstraction replacing ad-hoc Claude CLI invocation
- [ ] **AGNT-02**: Container images support Claude, Codex, and Cursor CLI tools

### Diff & Review

- [ ] **DIFF-01**: User can see a git diff summary after an agent completes a task
- [ ] **DIFF-02**: Diff viewer displays structured changes with syntax highlighting

### Context & Explorer

- [ ] **CTXT-01**: User can type `@` in prompt input to get autocomplete suggestions for files and folders
- [ ] **CTXT-02**: User can browse the container workspace file tree in the UI
- [ ] **CTXT-03**: File listing respects .gitignore rules
- [ ] **CTXT-04**: User can open files in their local IDE when workspace mount is enabled

### Git Automation

- [ ] **GAUT-01**: User can auto-generate commit messages from the current diff context
- [ ] **GAUT-02**: User can auto-generate PR descriptions from branch changes
- [ ] **GAUT-03**: User can configure which model is used for commit/PR message generation

### Session UX

- [ ] **SEUX-01**: User can tab between chat view and terminal view within a session

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Security Hardening

- **SECU-01**: Session-scoped WebSocket authorization prevents cross-session data bleed
- **SECU-02**: Path-validated workspace API prevents traversal attacks
- **SECU-03**: Argv-only git execution prevents command injection

### Skills Management

- **SKIL-04**: Symlink validation in skills directories prevents mount escape

### Multi-Agent

- **AGNT-03**: User can select agent per-session or per-prompt from the UI
- **AGNT-04**: Concurrency model for multi-agent on same workspace (locking/queuing)

### Diff & Review

- **DIFF-03**: Per-file drill-down in diff viewer
- **DIFF-04**: Binary file detection and size caps for diff payloads

### Git Automation

- **GAUT-04**: Secret scanning gate before commit (gitleaks/detect-secrets)

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

| Requirement | Phase                                  | Status  |
| ----------- | -------------------------------------- | ------- |
| SEUX-01     | Phase 1: Session UX                    | Pending |
| SKIL-01     | Phase 2: Skills Provisioning           | Complete |
| SKIL-02     | Phase 2: Skills Provisioning           | Complete |
| SKIL-03     | Phase 2: Skills Provisioning           | Pending |
| AGNT-01     | Phase 3: Agent Runner & Multi-Agent    | Pending |
| AGNT-02     | Phase 3: Agent Runner & Multi-Agent    | Pending |
| CTXT-01     | Phase 4: Workspace API & File Explorer | Pending |
| CTXT-02     | Phase 4: Workspace API & File Explorer | Pending |
| CTXT-03     | Phase 4: Workspace API & File Explorer | Pending |
| CTXT-04     | Phase 4: Workspace API & File Explorer | Pending |
| DIFF-01     | Phase 5: Diff Pipeline & Review        | Pending |
| DIFF-02     | Phase 5: Diff Pipeline & Review        | Pending |
| GAUT-01     | Phase 6: Git Automation                | Pending |
| GAUT-02     | Phase 6: Git Automation                | Pending |
| GAUT-03     | Phase 6: Git Automation                | Pending |

**Coverage:**

- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---

_Requirements defined: 2026-04-10_
_Last updated: 2026-04-10 after initial definition_
