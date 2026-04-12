---
phase: 3
slug: workspace-api-file-explorer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 (server), Vitest 4 (web) |
| **Config file** | `server/test/jest-e2e.json` (server), `web/vite.config.ts` (web) |
| **Quick run command** | `cd server && npm test -- --testPathPattern=workspace` |
| **Full suite command** | `cd server && npm test && cd ../web && npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd server && npm test -- --testPathPattern=workspace`
- **After every plan wave:** Run `cd server && npm test && cd ../web && npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | CTXT-02 | T-03-01 | Path traversal prevented via resolve+prefix | e2e | `cd server && npm test -- --testPathPattern=workspace` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | CTXT-03 | — | N/A | e2e | `cd server && npm test -- --testPathPattern=workspace` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | CTXT-01 | — | N/A | unit (web) | `cd web && npx vitest run src/components/chat/FileAutocomplete.test.tsx` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | CTXT-04 | — | N/A | unit | `cd server && npx jest --testPathPattern=ide-url` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/test/e2e/workspace.e2e.spec.ts` — stubs for CTXT-02, CTXT-03
- [ ] `web/src/components/chat/FileAutocomplete.test.tsx` — stubs for CTXT-01
- [ ] `server/src/interactors/sessions/workspace/workspace-file-listing.service.spec.ts` — path traversal prevention

*Existing test infrastructure covers framework and config needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| VS Code-style tree visual appearance | CTXT-02 | Visual layout verification | Open Files tab, verify indented tree with file icons, expand/collapse folders |
| Open-in-IDE launches correct editor | CTXT-04 | Requires local IDE installed | Configure IDE in Settings, click "Open in IDE" on a file, verify editor opens to correct file |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
