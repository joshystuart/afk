---
phase: 03-workspace-api-file-explorer
plan: 04
subsystem: api
tags: [nestjs, class-validator, settings, react-hotkeys-hook, dto, e2e]

# Dependency graph
requires:
  - phase: 03-workspace-api-file-explorer
    provides: "Plan 03-01 added ideCommand column + domain update handler; Plan 03-03 wired Settings → General form"
provides:
  - "ideCommand flows PUT /api/settings → Settings.update() → GET /api/settings"
  - "e2e regression guarding round-trip and empty-string-clears-to-null semantics"
  - "Cross-platform tab-cycle hotkey (Cmd+` on macOS / Ctrl+` on Win/Linux + ctrl+` macOS fallback)"
affects: [workspace-api-file-explorer, future settings additions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DTO field triad for persisted strings: UpdateSettingsRequest (validate) + Interactor (forward) + GetSettingsResponseDto (expose)"
    - "react-hotkeys-hook comma-separated accelerator list for platform-aware bindings with fallback"

key-files:
  created: []
  modified:
    - server/src/interactors/settings/update-settings/update-settings-request.dto.ts
    - server/src/interactors/settings/update-settings/update-settings.interactor.ts
    - server/src/interactors/settings/get-settings/get-settings-response.dto.ts
    - server/test/e2e/settings.e2e.spec.ts
    - web/src/pages/SessionDetails.tsx

key-decisions:
  - "MaxLength(100) on ideCommand DTO matches varchar(100) column in GeneralSettings for input contract parity"
  - "`?? null` (not `|| null`) on read DTO to stay byte-identical to the domain value for non-empty strings"
  - "Register both `mod+`` and `ctrl+`` — `mod` covers cross-platform primary, `ctrl` survives macOS Cmd+` system consumption"

patterns-established:
  - "Whenever a new nullable string column reaches the UI, add DTO field + interactor forward + response DTO expose as a triad — any one missing breaks reload re-hydration"

requirements-completed:
  - CTXT-02
  - CTXT-04

# Metrics
duration: ~10min
completed: 2026-04-17
---

# Phase 03 Plan 04: Gap Closure Summary

**ideCommand now round-trips through PUT→GET /api/settings, and the tab-cycle hotkey fires on both macOS (⌘+`) and Windows/Linux (Ctrl+`) with a literal `Control+`` macOS fallback.**

## Performance

- **Duration:** ~10 minutes
- **Started:** 2026-04-17T11:17:30Z
- **Completed:** 2026-04-17T11:20:20Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Fixed `400 "property ideCommand should not exist"` by declaring `ideCommand` on `UpdateSettingsRequest` with `@IsOptional @IsString @MaxLength(100)` so the `ValidationPipe` whitelist accepts it.
- Forwarded `request.ideCommand` into `currentSettings.update({...})` in `UpdateSettingsInteractor` so the value reaches the domain entity (which already normalises empty-string → null).
- Exposed `ideCommand` on `GetSettingsResponseDto` via `@ApiProperty` + `fromDomain` mapping using `?? null`, enabling the Settings → General form to re-hydrate on reload.
- Added e2e regression `should persist and round-trip ideCommand` inside `describe('PUT /api/settings', …)` that PUTs `{ ideCommand: 'cursor' }`, asserts 200 + `data.ideCommand === 'cursor'`, GETs and re-asserts, then PUTs `{ ideCommand: '' }` and asserts `data.ideCommand === null`. All 19 tests in the Settings E2E suite pass.
- Replaced `useHotkeys('ctrl+`', …)` with `useHotkeys('mod+`, ctrl+`', …)` in `SessionDetails.tsx` so `react-hotkeys-hook` registers both `mod+`` (cross-platform alias, matches Cmd on macOS / Ctrl elsewhere) and `ctrl+`` (literal fallback for macOS where the OS consumes ⌘+`). Handler body, deps, and options object are byte-identical.

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix ideCommand persistence end-to-end (DTO + interactor + response DTO + e2e regression)** — `66c8d0c` (fix)
2. **Task 2: Make Ctrl+` tab cycle hotkey cross-platform (mod modifier + ctrl fallback)** — `716d5a7` (fix)

## Files Created/Modified

- `server/src/interactors/settings/update-settings/update-settings-request.dto.ts` — add `MaxLength` import and `ideCommand?: string` field with `@IsOptional @IsString @MaxLength(100) @ApiProperty`.
- `server/src/interactors/settings/update-settings/update-settings.interactor.ts` — add `ideCommand: request.ideCommand` to the `currentSettings.update({...})` object literal.
- `server/src/interactors/settings/get-settings/get-settings-response.dto.ts` — add `ideCommand?: string | null` with `@ApiProperty` and `dto.ideCommand = settings.general.ideCommand ?? null` mapping in `fromDomain`.
- `server/test/e2e/settings.e2e.spec.ts` — insert `it('should persist and round-trip ideCommand', …)` before the `'should reject unknown fields'` case.
- `web/src/pages/SessionDetails.tsx` — change first argument of the tab-cycle `useHotkeys(…)` call from `'ctrl+`'` to `'mod+`, ctrl+`'` (single-line change).

## Decisions Made

- Used `?? null` (not `|| null`) on the read path to stay byte-identical to the domain value for legitimate non-empty strings, matching the pattern already used for `skillsDirectory`/`gitUserName`/`gitUserEmail`.
- Kept `ctrl+`` as a second accelerator rather than replacing Ctrl with `mod` alone — debug session evidence showed some macOS configurations consume ⌘+` at the OS level (next-window focus), and retaining `Control+`` gives users an escape hatch on those systems.
- Added `MaxLength(100)` on the DTO to mirror the `varchar(100)` column in `GeneralSettings` — strengthens the input contract (T-03-09 Tampering mitigation) without needing a separate bounds check in the interactor.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Verification Results

- `cd server && npx tsc --noEmit` → exits 0 (clean).
- `cd web && npx tsc --noEmit` → exits 0 (clean).
- `cd server && npm run test -- --testPathPattern=settings.e2e` → 19/19 tests pass including the new `should persist and round-trip ideCommand` case. Note: the project's e2e config is bound to the root `test` script (`jest --config ./test/jest-e2e.json`); the `test:e2e` script referenced in the plan's verify block does not exist, so the canonical equivalent was used. Tests ran against the in-process Nest app via `AppTestHelper` — no Docker dependency.
- Hotkey binding literal verified by Read tool — line 167 of `web/src/pages/SessionDetails.tsx` reads `'mod+`, ctrl+`',`.

## Acceptance Criteria

- [x] `UpdateSettingsRequest` imports `MaxLength` and declares `ideCommand?: string` with `@IsOptional @IsString @MaxLength(100) @ApiProperty`.
- [x] `UpdateSettingsInteractor` `currentSettings.update({...})` contains `ideCommand: request.ideCommand`.
- [x] `GetSettingsResponseDto` declares `ideCommand?: string | null` with `@ApiProperty` and `fromDomain` assigns `dto.ideCommand = settings.general.ideCommand ?? null`.
- [x] `settings.e2e.spec.ts` contains the new round-trip test inside `describe('PUT /api/settings', …)` covering PUT, GET, and empty-string clear.
- [x] `web/src/pages/SessionDetails.tsx` uses the literal `'mod+`, ctrl+`'` as the first argument to the tab-cycle `useHotkeys`; handler/options are byte-identical.
- [x] Server `tsc --noEmit` clean.
- [x] Web `tsc --noEmit` clean.
- [x] Settings E2E suite passes (19/19) with the new regression green.

## Next Phase Readiness

- UAT Tests 7 and 8 unblocked; Test 9 (Open-in-IDE button) should now pass on re-run because the persisted `ideCommand` finally round-trips.
- No blockers for the next plan.

## Self-Check: PASSED

- `server/src/interactors/settings/update-settings/update-settings-request.dto.ts` — MODIFIED (MaxLength + ideCommand field present).
- `server/src/interactors/settings/update-settings/update-settings.interactor.ts` — MODIFIED (ideCommand: request.ideCommand present).
- `server/src/interactors/settings/get-settings/get-settings-response.dto.ts` — MODIFIED (ideCommand DTO field + fromDomain mapping present).
- `server/test/e2e/settings.e2e.spec.ts` — MODIFIED (round-trip test present, 19/19 tests pass).
- `web/src/pages/SessionDetails.tsx` — MODIFIED (`'mod+`, ctrl+`'` binding at line 167).
- Commit `66c8d0c` — FOUND in git log.
- Commit `716d5a7` — FOUND in git log.

---

_Phase: 03-workspace-api-file-explorer_
_Completed: 2026-04-17_
