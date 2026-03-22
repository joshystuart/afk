# Refactor GTP4 Handoff

## Goal

Continue the server refactor from `plans/future/refactor/refactor-gtp4.md`.

The session lifecycle split that was the previous phase 3 target is now complete. The next high-value slice is still within the broader "split large coordinators/adapters" phase, but it should now move to the oversized realtime adapter in `server/src/gateways/session.gateway.ts`.

## What Was Completed

### Phase 1 and 2 Progress

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
- Extracted stop-session runtime behavior into a smaller runtime collaborator:
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

### New In This Slice

- Replaced the large `SessionLifecycleInteractor` coordinator with focused session use-case classes:
  - `server/src/interactors/sessions/start-session/start-session.interactor.ts`
  - `server/src/interactors/sessions/stop-session/stop-session.interactor.ts`
  - `server/src/interactors/sessions/delete-session/delete-session.interactor.ts`
  - `server/src/interactors/sessions/check-session-health/check-session-health.interactor.ts`
  - `server/src/interactors/sessions/get-session-info/get-session-info.interactor.ts`
- Added a reusable session readiness helper so create/start flows share the background polling logic without a god-object:
  - `server/src/interactors/sessions/session-health-monitor.service.ts`
- Rewired the existing session controllers and bulk-clear flow to depend on the dedicated interactors instead of the old lifecycle coordinator:
  - `server/src/interactors/sessions/start-session.controller.ts`
  - `server/src/interactors/sessions/stop-session.controller.ts`
  - `server/src/interactors/sessions/delete-session.controller.ts`
  - `server/src/interactors/sessions/check-session-health.controller.ts`
  - `server/src/interactors/sessions/get-session.controller.ts`
  - `server/src/interactors/sessions/clear-all-sessions.interactor.ts`
- Updated create-session to use the shared health monitor directly:
  - `server/src/interactors/sessions/create-session/create-session.interactor.ts`
- Removed the obsolete lifecycle coordinator:
  - `server/src/interactors/sessions/session-lifecycle.interactor.ts`

## Validation Already Run

- `npm run format`: passed
- `npm run server:build`: passed
- `ReadLints` on `server/src/interactors/sessions`: no diagnostics reported
- Focused automated tests were not added or rerun in this slice
- Runtime boot sanity was not rerun in this slice

## Current Status

There is no known blocker from this refactor slice.

The session lifecycle coordinator has been removed, the sessions module still builds cleanly, and the create/start flows now share readiness polling through `SessionHealthMonitorService`.

## Next Phase Target

The next highest-value refactor target is `server/src/gateways/session.gateway.ts`.

That gateway still owns too many responsibilities for a single transport adapter:

- session subscription orchestration
- log stream fanout
- chat event handling
- git/status related websocket behavior
- scheduled-job run streaming
- cross-feature event wiring

## Recommended Split

### Keep

- Keep `SessionSubscriptionService` as the narrow subscription/state fanout seam if it continues to reduce duplication.
- Keep websocket event names and payload contracts stable while moving logic behind smaller collaborators.

### Extract First

1. Session/log subscription handling
   - move pure subscription bookkeeping and log stream lifecycle out of the main gateway class

2. Chat websocket behavior
   - isolate chat-specific socket handlers from session lifecycle and log concerns

3. Scheduled-job run streaming
   - keep the existing gateway-owned response mapping, but move the run-stream event handling out of the main gateway

4. Remaining session control handlers
   - leave the top-level gateway as a thin namespace shell if Nest websocket decorators make that simpler

### Optional Helper

- If the gateway split still needs shared event fanout logic, extract a small gateway-local collaborator rather than letting the main gateway regain coordinator behavior.

## Constraints For The Next Slice

- Preserve current HTTP and websocket behavior.
- Avoid introducing new reverse dependencies from `services/**` into `interactors/**`.
- Prefer constructor DI and domain ports/tokens over direct implementation coupling.
- Keep the refactor incremental: move one responsibility at a time and validate after each extraction.
- Preserve existing websocket namespaces, event names, and payload shapes unless the change is explicitly coordinated.
- Do not treat repo-wide lint noise as caused by this work unless it is in files touched by the slice.

## Suggested Next Steps

1. Inspect `server/src/gateways/session.gateway.ts` and list its responsibilities by socket concern.
2. Extract the first gateway collaborator behind the existing websocket namespace without changing client-facing events.
3. Keep any shared payload mapping or subscription plumbing in small helpers instead of another large adapter class.
4. Add focused tests where practical for any extracted gateway-local collaborators.
5. Run:
   - `npm run format`
   - `npm run server:build`
   - targeted tests for the affected gateway/session slice
   - a quick runtime boot check

## Notes For The Next Agent

- `server/src/interactors/sessions/session-lifecycle.interactor.ts` has been removed.
- `server/src/services/sessions/session-runtime.service.ts` still owns the low-level stop-session/runtime path and remains the precedent for keeping shared runtime code out of transport adapters.
- `server/src/interactors/sessions/session-health-monitor.service.ts` is now the shared seam for background readiness polling.
- `server/src/interactors/sessions/create-session/create-session.interactor.ts` still has room for future cleanup, but it is no longer coupled to a lifecycle god-object.
- `npm run lint` is still noisy from pre-existing repo-wide issues; use `ReadLints` or file-scoped validation for touched files.
- The next slice should probably stay adapter-focused rather than doing another large folder move; prioritize reducing `session.gateway.ts` size and clarifying its collaborator boundaries.
