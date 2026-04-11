---
phase: 02-skills-provisioning
plan: 02
subsystem: docker
tags: [dockerode, bind-mount, entrypoint, symlink, skills]

requires:
  - phase: 02-skills-provisioning
    provides: skillsPath on SessionConfigDto, skillsPath on ContainerCreateOptions, mountSkills on CreateSessionRequest
provides:
  - Read-only skills bind mount in Docker container Binds array
  - Skills directory validation at session creation via MountPathValidator
  - Skills path passthrough on container recreation for session restart
  - Entrypoint setup_skills function creating symlinks to 4 agent discovery paths
affects: [02-skills-provisioning plan 03 (frontend UI)]

tech-stack:
  added: []
  patterns:
    [
      read-only bind mount with :ro suffix for security,
      conditional symlink creation at container startup,
    ]

key-files:
  created: []
  modified:
    - server/src/libs/docker/docker-container-provisioning.service.ts
    - server/src/libs/docker/docker-container-provisioning.service.spec.ts
    - server/src/interactors/sessions/create-session/create-session-request.service.ts
    - server/src/interactors/sessions/create-session/create-session-startup.service.ts
    - server/src/interactors/sessions/start-session/start-session.interactor.ts
    - docker/scripts/entrypoint.sh

key-decisions:
  - 'Skills bind mount uses :ro (read-only) enforced at Docker kernel level for container security'
  - 'Entrypoint uses rm -rf before ln -sfn for idempotent symlink creation on container restarts'
  - "mkdir -p creates parent dirs for .cursor, .agents, .codex that don't exist in base image"

patterns-established:
  - 'Read-only bind mounts use :ro suffix in Docker HostConfig.Binds array'
  - 'Entrypoint functions guard on directory existence before acting'

requirements-completed: [SKIL-02, SKIL-03]

duration: 2min
completed: 2026-04-11
---

# Phase 02 Plan 02: Skills Backend Integration Summary

**Read-only skills bind mount in Docker containers with entrypoint symlinks to all 4 agent discovery paths (.claude, .cursor, .agents, .codex)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-11T04:13:04Z
- **Completed:** 2026-04-11T04:15:23Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- DockerContainerProvisioningService adds `/path/to/skills:/home/afk/.skills:ro` to Binds when skillsPath is set
- CreateSessionRequestService passes skillsDirectory from settings and mountSkills from request to factory, validates path with MountPathValidator
- Container recreation in StartSessionInteractor preserves skills binding from session config
- Entrypoint setup_skills function creates symlinks to ~/.claude/skills, ~/.cursor/skills, ~/.agents/skills, ~/.codex/skills when skills are mounted
- Two new unit tests verify skills bind mount inclusion and omission

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire skills through session creation, container provisioning, and recreation** - `e1e1a09` (feat)
2. **Task 2: Container entrypoint symlink creation for agent discovery paths** - `6bcb0c1` (feat)

## Files Created/Modified

- `server/src/libs/docker/docker-container-provisioning.service.ts` - Added skills bind mount to HostConfig.Binds with :ro suffix
- `server/src/libs/docker/docker-container-provisioning.service.spec.ts` - Added 2 unit tests for skills bind mount behavior
- `server/src/interactors/sessions/create-session/create-session-request.service.ts` - Passes skillsDirectory and mountSkills to factory, validates skillsPath
- `server/src/interactors/sessions/create-session/create-session-startup.service.ts` - Passes skillsPath to createContainer
- `server/src/interactors/sessions/start-session/start-session.interactor.ts` - Passes skillsPath on container recreation
- `docker/scripts/entrypoint.sh` - Added setup_skills function with symlinks to all 4 agent discovery paths

## Decisions Made

- Skills bind mount uses `:ro` (read-only) enforced at Docker kernel level — agents can read skills but never modify them
- Entrypoint uses `rm -rf` before `ln -sfn` for idempotent symlink creation on container restarts
- `mkdir -p` creates parent dirs for `.cursor`, `.agents`, `.codex` that don't exist in base image; `.claude` is in a named volume so parent exists

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Skills backend integration complete — bind mount, validation, lifecycle, and entrypoint all wired
- Plan 03 (frontend UI) can build settings and session creation UI against the existing DTO fields
- TypeScript compilation clean, all 4 provisioning unit tests passing

## Self-Check: PASSED

All 6 modified files confirmed present. Both task commits (e1e1a09, 6bcb0c1) confirmed in git log. TypeScript compilation clean. All provisioning tests passing (4 total: 2 existing + 2 new).

---

_Phase: 02-skills-provisioning_
_Completed: 2026-04-11_
