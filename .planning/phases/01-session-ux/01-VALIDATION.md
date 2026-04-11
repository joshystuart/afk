---
phase: 1
slug: session-ux
status: audited
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
last_audit: 2026-04-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property                        | Value                                                              |
| ------------------------------- | ------------------------------------------------------------------ |
| **Framework (server)**          | Jest 29 via ts-jest                                                |
| **Config file (server)**        | `server/package.json` jest block + `server/test/jest-e2e.json`     |
| **Quick run command (server)**  | `cd server && npx jest --testPathPattern=session-gateway-terminal` |
| **Full suite command (server)** | `cd server && npx jest`                                            |
| **Framework (web)**             | Vitest 4                                                           |
| **Config file (web)**           | `web/vite.config.ts` (unit project)                                |
| **Quick run command (web)**     | `cd web && npx vitest run --project unit`                          |
| **Full suite command (web)**    | `cd web && npx vitest run --project unit`                          |
| **Estimated runtime**           | ~30 seconds (server) + ~15 seconds (web)                           |

---

## Sampling Rate

- **After every task commit:** Run quick run command for changed module (server or web)
- **After every plan wave:** Run full server + web test suites
- **Before `/gsd-verify-work`:** Full suites must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior                                  | Test Type | Automated Command                                           | File Exists | Status         |
| ------- | ---- | ---- | ----------- | ---------- | ------------------------------------------------ | --------- | ----------------------------------------------------------- | ----------- | -------------- |
| 1-01-01 | 01   | 1    | SEUX-01a    | T-1-01     | Verify session ownership before creating PTY     | unit      | `cd server && npx jest session-gateway-terminal`            | ❌          | 📋 manual-only |
| 1-01-02 | 01   | 1    | SEUX-01b    | T-1-02     | Reject terminal events from unsubscribed sockets | unit      | `cd server && npx jest docker-container-exec`               | ❌          | 📋 manual-only |
| 1-01-03 | 01   | 1    | SEUX-01c    | —          | N/A                                              | unit      | `cd web && npx vitest run --project unit -- useSessionTabs` | ❌          | 📋 manual-only |
| 1-01-04 | 01   | 1    | SEUX-01d    | —          | N/A                                              | unit      | `cd server && npx jest session-gateway`                     | ❌          | 📋 manual-only |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · 📋 manual-only_

---

## Wave 0 Requirements

All Wave 0 test files deferred to manual-only (user decision 2026-04-11):

- [ ] `server/src/gateways/session-gateway-terminal.service.spec.ts` — covers SEUX-01a (manual-only)
- [ ] `server/src/libs/docker/docker-container-exec.service.spec.ts` — covers SEUX-01b (manual-only)
- [ ] `web/src/hooks/useSessionTabs.test.ts` — covers SEUX-01c (manual-only)

---

## Manual-Only Verifications

| Behavior                                           | Requirement | Why Manual                           | Test Instructions                                                                                                                         |
| -------------------------------------------------- | ----------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Visual tab switching UX                            | SEUX-01     | Browser interaction required         | Open session page, verify tab bar between status bar and content, click Chat/Terminal tabs, verify instant switch, verify Ctrl+` shortcut |
| Terminal theme cohesion (D-17)                     | SEUX-01     | Visual assessment                    | Verify terminal background matches app background (#09090b), cursor is accent green                                                       |
| Unread badges (D-14, D-15)                         | SEUX-01     | Cross-tab interaction                | Send terminal output while on chat tab, verify badge appears; send chat message while on terminal tab, verify badge appears               |
| Session ownership before PTY creation (T-1-01)     | SEUX-01a    | Deferred — no automated test created | Verify unsubscribed socket cannot create PTY; inspect `getSubscribersForSession` check in `handleTerminalStart`                           |
| Reject unsubscribed socket terminal input (T-1-02) | SEUX-01b    | Deferred — no automated test created | Verify terminal input rejected for clients not in session room; inspect auth check in `handleTerminalInput`                               |
| Tab state persistence via sessionStorage           | SEUX-01c    | Deferred — no automated test created | Switch tabs, navigate away and back, verify last-used tab restored from sessionStorage                                                    |
| Gateway terminal event wiring                      | SEUX-01d    | Deferred — no automated test created | Verify `@SubscribeMessage` handlers for terminal.start/input/resize/close exist in session.gateway.ts                                     |

---

## Validation Audit 2026-04-11

| Metric     | Count |
| ---------- | ----- |
| Gaps found | 4     |
| Resolved   | 0     |
| Escalated  | 4     |

All 4 gaps moved to manual-only per user decision.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** partial — 0 automated, 4 manual-only
