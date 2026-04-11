# Roadmap: AFK (Away From Keyboard)

## Overview

AFK's v1 milestone transforms the existing secure container-based coding tool into a daily-driver platform. The roadmap delivers six phases: a quick Session UX polish, Skills provisioning for agent capability, an agent runner abstraction enabling multi-agent support, a workspace API powering both file exploration and @-mention context, a post-run diff pipeline with a syntax-highlighted review UI, and git automation that generates commit and PR messages from agent changes. Each phase delivers a coherent, independently verifiable capability.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Session UX** - Tab toggle between chat and terminal views within a session
- [ ] **Phase 2: Skills Provisioning** - Read-only skills directory mounting into session containers
- [ ] **Phase 3: Agent Runner & Multi-Agent** - Pluggable agent runner abstraction with Claude, Codex, and Cursor support
- [ ] **Phase 4: Workspace API & File Explorer** - Container file browsing, @-mention autocomplete, and open-in-IDE
- [ ] **Phase 5: Diff Pipeline & Review** - Post-run git diff summary and syntax-highlighted diff viewer
- [ ] **Phase 6: Git Automation** - Auto-generated commit messages and PR descriptions with model selection

## Phase Details

### Phase 1: Session UX

**Goal**: Users can seamlessly switch between chat and terminal within a session
**Depends on**: Nothing (first phase)
**Requirements**: SEUX-01
**Success Criteria** (what must be TRUE):

1. User can toggle between chat view and terminal view without losing context in either
2. Both views remain connected to the same session and reflect current state
3. Toggle is accessible from within the session UI without navigating away
   **Plans**: 3 plans
   Plans:

- [x] 01-01-PLAN.md — Backend PTY infrastructure (terminal socket events, Docker interactive exec, gateway terminal service)
- [x] 01-02-PLAN.md — Frontend tab and terminal components (xterm.js, hooks, tab bar, terminal view)
- [ ] 01-03-PLAN.md — Session page integration (wire tab bar + terminal into SessionDetails, badges, keyboard shortcut)
      **UI hint**: yes

### Phase 2: Skills Provisioning

**Goal**: Users can equip their sessions with skill ecosystems that persist across all containers
**Depends on**: Nothing
**Requirements**: SKIL-01, SKIL-02, SKIL-03
**Success Criteria** (what must be TRUE):

1. User can set a skills directory path in the Settings UI
2. New session containers automatically mount the configured skills directory as read-only
3. Skills from GSD, skills.sh, and superpowers ecosystems are accessible inside the container at expected paths
4. Container cannot write to or modify the mounted skills directory
   **Plans**: TBD

### Phase 3: Agent Runner & Multi-Agent

**Goal**: Users can run different AI coding agents in their sessions beyond just Claude
**Depends on**: Nothing
**Requirements**: AGNT-01, AGNT-02
**Success Criteria** (what must be TRUE):

1. Claude continues to work as before through the new agent runner abstraction (no regression)
2. Sessions can run Codex via the agent runner with streaming output in the chat UI
3. Sessions can run Cursor CLI via the agent runner with streaming output in the chat UI
   **Plans**: TBD

### Phase 4: Workspace API & File Explorer

**Goal**: Users can browse and reference container files directly from the web UI
**Depends on**: Nothing
**Requirements**: CTXT-01, CTXT-02, CTXT-03, CTXT-04
**Success Criteria** (what must be TRUE):

1. User can browse the workspace directory tree in a panel within the session UI
2. User can type `@` in the prompt input and see autocomplete suggestions for files and folders
3. File and folder listings exclude entries matched by .gitignore
4. User can click a file in the explorer to open it in their local IDE when workspace mount is enabled
   **Plans**: TBD
   **UI hint**: yes

### Phase 5: Diff Pipeline & Review

**Goal**: Users can review what an agent changed after completing a task
**Depends on**: Nothing
**Requirements**: DIFF-01, DIFF-02
**Success Criteria** (what must be TRUE):

1. After an agent completes a task, user sees a summary of which files were added, modified, or deleted
2. User can view the actual diff content with syntax highlighting for each changed file
   **Plans**: TBD
   **UI hint**: yes

### Phase 6: Git Automation

**Goal**: Users can auto-generate commit and PR messages from agent changes
**Depends on**: Phase 5
**Requirements**: GAUT-01, GAUT-02, GAUT-03
**Success Criteria** (what must be TRUE):

1. User can click a button to generate a commit message from the current staged/unstaged changes
2. User can generate a PR description from the branch's changes relative to the base branch
3. User can configure which AI model is used for generating commit and PR messages
   **Plans**: TBD
   **UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase                            | Plans Complete | Status            | Completed |
| -------------------------------- | -------------- | ----------------- | --------- |
| 1. Session UX                    | 0/3            | Planning complete | -         |
| 2. Skills Provisioning           | 0/0            | Not started       | -         |
| 3. Agent Runner & Multi-Agent    | 0/0            | Not started       | -         |
| 4. Workspace API & File Explorer | 0/0            | Not started       | -         |
| 5. Diff Pipeline & Review        | 0/0            | Not started       | -         |
| 6. Git Automation                | 0/0            | Not started       | -         |
