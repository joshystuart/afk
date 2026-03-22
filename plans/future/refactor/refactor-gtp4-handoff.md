# Refactor GTP4 Handoff

## Goal

Continue the server refactor from `plans/future/refactor/refactor-gtp4.md`, with the immediate objective of improving testability and reducing architecture drift before deeper feature moves.

## What Was Completed

- Added a shared response module:
  - `server/src/libs/response/response.module.ts`
- Added a shared settings persistence module:
  - `server/src/libs/settings/settings-persistence.module.ts`
- Introduced a session repository port and token:
  - `server/src/domain/sessions/session.repository.ts`
  - `server/src/domain/sessions/session.tokens.ts`
- Rewired session persistence behind the `SESSION_REPOSITORY` token:
  - `server/src/services/repositories/session.repository.ts`
  - `server/src/services/repositories/repositories.module.ts`
- Extracted stop-session runtime behavior out of the big session interactor:
  - `server/src/services/sessions/session-runtime.service.ts`
- Rewired idle cleanup to use the runtime service instead of importing an interactor:
  - `server/src/services/sessions/session-idle-cleanup.service.ts`
- Moved scheduled-job websocket event constants into a shared contract:
  - `server/src/libs/scheduled-jobs/job-run-events.ts`
- Added gateway-owned scheduled-job response mapping so the gateway no longer imports interactor DTO/factory code:
  - `server/src/gateways/scheduled-job-gateway-response.factory.ts`
- Removed gateway dependency on `ScheduledJobsInteractorModule`:
  - `server/src/gateways/gateways.module.ts`
- Added architecture docs and import-boundary lint guardrails:
  - `server/ARCHITECTURE.md`
  - `server/eslint.config.mjs`

## Validation Already Run

- `npm run format`: passed
- `npm run build`: passed
- Focused tests passed:
  - `src/services/sessions/session-runtime.service.spec.ts`
  - `src/gateways/scheduled-job-gateway-response.factory.spec.ts`

## Current Blocker

The live dev server fails at runtime with a Nest DI error:

- `CreateSessionInteractor` cannot resolve `Symbol(SETTINGS_REPOSITORY)` in `SessionsModule`

Observed error:

- `Nest can't resolve dependencies of the CreateSessionInteractor ... Please make sure that the argument Symbol(SETTINGS_REPOSITORY) at index [7] is available in the SessionsModule context.`

## Most Likely Fix

During the refactor, `SettingsModule` stopped exporting `SETTINGS_REPOSITORY`, and `SessionsModule` still relies on that token indirectly for:

- `CreateSessionInteractor`

Most direct fixes:

1. Import `SettingsPersistenceModule` into `server/src/interactors/sessions/sessions.module.ts`.
2. Optionally also re-export `SETTINGS_REPOSITORY` from `SettingsModule` if that better matches the intended architecture.

Preferred fix for the current direction:

- Import `SettingsPersistenceModule` directly in `SessionsModule` so use cases that need the repository port consume the persistence module explicitly, instead of depending on `SettingsModule` to leak infrastructure providers.

## Suggested Next Steps

1. Fix the runtime DI issue in `server/src/interactors/sessions/sessions.module.ts`.
2. Boot the dev server and confirm the Nest app starts cleanly.
3. Run a small smoke pass against settings and sessions flows.
4. Continue phase 2 of the plan:
   - move more session consumers to domain ports/tokens
   - move scheduled-job domain construction out of `interactors`
   - start splitting `session-lifecycle.interactor.ts` into narrower use-case classes

## Notes For The Next Agent

- `npm run lint` is noisy from pre-existing repo-wide issues; do not treat the current lint baseline as caused by this refactor slice.
- The structural refactor is intentionally partial: it establishes seams first rather than moving every folder immediately.
- The highest-value seam added so far is the new `SESSION_REPOSITORY` token, which should make future unit tests much cheaper to write.
