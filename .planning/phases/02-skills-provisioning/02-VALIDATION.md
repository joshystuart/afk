---
phase: 2
slug: skills-provisioning
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                          |
| ---------------------- | -------------------------------------------------------------- |
| **Framework**          | Jest 29.x                                                      |
| **Config file**        | `server/package.json` jest block + `server/test/jest-e2e.json` |
| **Quick run command**  | `npm test -- --testPathPattern=<file>` (from `server/`)        |
| **Full suite command** | `npm test` (from `server/`)                                    |
| **Estimated runtime**  | ~15 seconds                                                    |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern=<changed-file>` (from `server/`)
- **After every plan wave:** Run `npm test` (from `server/`)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior                         | Test Type | Automated Command                                             | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | --------------------------------------- | --------- | ------------------------------------------------------------- | ----------- | ---------- |
| 02-01-01 | 01   | 1    | SKIL-01     | T-02-01    | MountPathValidator rejects system paths | unit      | `npm test -- --testPathPattern=settings.entity`               | ❌ W0       | ⬜ pending |
| 02-01-02 | 01   | 1    | SKIL-01     | —          | N/A                                     | unit      | `npm test -- --testPathPattern=update-settings`               | ❌ W0       | ⬜ pending |
| 02-02-01 | 02   | 1    | SKIL-02     | T-02-02    | `:ro` bind mount enforced               | unit      | `npm test -- --testPathPattern=docker-container-provisioning` | ✅ Extend   | ⬜ pending |
| 02-02-02 | 02   | 1    | SKIL-02     | —          | N/A                                     | unit      | `npm test -- --testPathPattern=docker-container-provisioning` | ✅ Extend   | ⬜ pending |
| 02-03-01 | 03   | 2    | SKIL-03     | —          | N/A                                     | unit      | `npm test -- --testPathPattern=session-config`                | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] Extend `server/src/libs/docker/docker-container-provisioning.service.spec.ts` — add skills bind mount assertions (`:ro` mode, conditional mount)
- [ ] `settings.entity` test — verify `update()` handles `skillsDirectory`
- [ ] `session-config.dto` test — verify new fields serialize/deserialize

_Existing infrastructure covers test framework and runner._

---

## Manual-Only Verifications

| Behavior                                                                       | Requirement | Why Manual                                        | Test Instructions                                                                                                                                                                      |
| ------------------------------------------------------------------------------ | ----------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrypoint creates symlinks from `/home/afk/.skills/` to all 4 discovery paths | SKIL-03     | Requires running Docker container with bind mount | Create session with skills configured → exec into container → verify `ls -la ~/.claude/skills ~/.cursor/skills ~/.agents/skills ~/.codex/skills` shows symlinks to `/home/afk/.skills` |
| Read-only enforcement at container level                                       | SKIL-02     | Requires running Docker container                 | Exec into container → `touch /home/afk/.skills/test` → verify "Read-only file system" error                                                                                            |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
