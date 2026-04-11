---
phase: 1
slug: session-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (server)** | Jest 29 via ts-jest |
| **Config file (server)** | `server/package.json` jest block + `server/test/jest-e2e.json` |
| **Quick run command (server)** | `cd server && npx jest --testPathPattern=session-gateway-terminal` |
| **Full suite command (server)** | `cd server && npx jest` |
| **Framework (web)** | Vitest 4 |
| **Config file (web)** | `web/vite.config.ts` (unit project) |
| **Quick run command (web)** | `cd web && npx vitest run --project unit` |
| **Full suite command (web)** | `cd web && npx vitest run --project unit` |
| **Estimated runtime** | ~30 seconds (server) + ~15 seconds (web) |

---

## Sampling Rate

- **After every task commit:** Run quick run command for changed module (server or web)
- **After every plan wave:** Run full server + web test suites
- **Before `/gsd-verify-work`:** Full suites must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | SEUX-01 | T-1-01 | Verify session ownership before PTY creation | unit | `cd server && npx jest session-gateway-terminal` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | SEUX-01 | T-1-02 | Reject terminal events from unsubscribed sockets | unit | `cd server && npx jest session-gateway-terminal` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | SEUX-01 | T-1-03 | Limit one active PTY per session per client | unit | `cd server && npx jest docker-container-exec` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | SEUX-01 | T-1-04 | Validate cols/rows bounds server-side | unit | `cd server && npx jest session-gateway-terminal` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | SEUX-01 | — | N/A | unit | `cd web && npx vitest run --project unit -- useSessionTabs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/src/gateways/session-gateway-terminal.service.spec.ts` — stubs for SEUX-01 (terminal gateway service)
- [ ] `server/src/libs/docker/docker-container-exec.service.spec.ts` — extend for interactive PTY method
- [ ] `web/src/hooks/useSessionTabs.test.ts` — stubs for tab state management

*Existing infrastructure covers test framework setup — no new framework installation needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tab keyboard shortcut (Ctrl+`) toggles views | SEUX-01 | Browser keyboard event simulation unreliable | Open session, press Ctrl+`, verify view switches |
| Badge/dot indicator on inactive tab | SEUX-01 | Visual indicator requires browser rendering | Switch to chat tab, type in terminal, verify badge appears on terminal tab |
| Terminal auto-reconnect on WebSocket drop | SEUX-01 | Requires network disruption simulation | Kill server, restart, verify terminal reconnects without manual action |
| Terminal inherits dark theme colors | SEUX-01 | Visual appearance verification | Open terminal, compare bg/fg/cursor colors to theme values |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
