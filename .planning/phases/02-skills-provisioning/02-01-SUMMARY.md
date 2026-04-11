---
phase: 02-skills-provisioning
plan: 01
subsystem: api
tags: [typeorm, class-validator, dto, settings, session-config]

requires:
  - phase: 01-session-ux
    provides: existing settings entity, session config DTO, container options interfaces
provides:
  - skillsDirectory field on Settings entity with MountPathValidator validation
  - skillsPath and mountSkills on SessionConfigDto for per-session persistence
  - skillsPath on ContainerCreateOptions for container provisioning
  - mountSkills boolean on CreateSessionRequest for session-level opt-out
affects:
  [
    02-skills-provisioning plan 02 (backend integration),
    02-skills-provisioning plan 03 (frontend UI),
  ]

tech-stack:
  added: []
  patterns: [reuse MountPathValidator for skills directory validation]

key-files:
  created: []
  modified:
    - server/src/domain/settings/general-settings.embedded.ts
    - server/src/domain/settings/settings.entity.ts
    - server/src/interactors/settings/update-settings/update-settings-request.dto.ts
    - server/src/interactors/settings/update-settings/update-settings.interactor.ts
    - server/src/interactors/settings/settings.module.ts
    - server/src/interactors/settings/get-settings/get-settings-response.dto.ts
    - server/src/domain/sessions/session-config.dto.ts
    - server/src/domain/sessions/session-config-dto.factory.ts
    - server/src/domain/containers/container.entity.ts
    - server/src/interactors/sessions/create-session/create-session-request.dto.ts

key-decisions:
  - 'Reused MountPathValidator for skillsDirectory validation — same security rules as host mount paths'
  - 'mountSkills defaults to true so skills are mounted unless explicitly opted out per session'

patterns-established:
  - 'Skills fields follow the same column → interface → update handler → DTO pattern as defaultMountDirectory'

requirements-completed: [SKIL-01, SKIL-02]

duration: 2min
completed: 2026-04-11
---

# Phase 02 Plan 01: Skills Data Contracts Summary

**skillsDirectory on Settings with MountPathValidator, skillsPath/mountSkills on SessionConfigDto, and container options extension for skills provisioning**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-11T04:08:10Z
- **Completed:** 2026-04-11T04:10:29Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Settings entity persists skillsDirectory with full CRUD through update DTO and response DTO
- MountPathValidator rejects forbidden system paths for skillsDirectory on save
- SessionConfigDto stores skillsPath and mountSkills with sensible defaults (null and true)
- SessionConfigDtoFactory derives skillsPath from settings skillsDirectory when mountSkills is not false
- ContainerCreateOptions accepts optional skillsPath for downstream provisioning
- CreateSessionRequest accepts mountSkills boolean for per-session opt-out

## Task Commits

Each task was committed atomically:

1. **Task 1: Settings entity, DTOs, and validation for skillsDirectory** - `0813d70` (feat)
2. **Task 2: Session config, factory, request DTO, and container options for skills** - `1db173a` (feat)

## Files Created/Modified

- `server/src/domain/settings/general-settings.embedded.ts` - Added skillsDirectory column
- `server/src/domain/settings/settings.entity.ts` - Added skillsDirectory to SettingsUpdateData and update() handler
- `server/src/interactors/settings/update-settings/update-settings-request.dto.ts` - Added skillsDirectory field with validators
- `server/src/interactors/settings/update-settings/update-settings.interactor.ts` - Added MountPathValidator for skillsDirectory
- `server/src/interactors/settings/settings.module.ts` - Registered MountPathValidator provider
- `server/src/interactors/settings/get-settings/get-settings-response.dto.ts` - Added skillsDirectory to response and fromDomain
- `server/src/domain/sessions/session-config.dto.ts` - Added skillsPath and mountSkills constructor params
- `server/src/domain/sessions/session-config-dto.factory.ts` - Derives skillsPath from params, passes to constructor
- `server/src/domain/containers/container.entity.ts` - Added skillsPath to ContainerCreateOptions
- `server/src/interactors/sessions/create-session/create-session-request.dto.ts` - Added mountSkills boolean

## Decisions Made

- Reused MountPathValidator for skillsDirectory validation — same security rules as host mount paths (forbidden system dirs, depth >= 2, symlink check)
- mountSkills defaults to true so skills are mounted by default unless explicitly opted out per session

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All data contracts in place for Plan 02 (backend integration) to wire skills into Docker container provisioning
- Plan 03 (frontend UI) can build settings and session creation UI against the new DTO fields
- TypeScript compilation clean, all 43 E2E tests and 35 unit tests passing

## Self-Check: PASSED

All 10 modified files confirmed present. Both task commits (0813d70, 1db173a) confirmed in git log. TypeScript compilation clean. All tests passing (35 unit + 43 E2E).

---

_Phase: 02-skills-provisioning_
_Completed: 2026-04-11_
