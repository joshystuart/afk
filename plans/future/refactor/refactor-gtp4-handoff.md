# Refactor GTP4 Handoff

## Goal

Continue the server refactor from `plans/future/refactor/refactor-gtp4.md`.

The session lifecycle split and the main `session.gateway.ts` extraction work are now complete enough that the highest-value refactor target has shifted fully to the scheduled-job runtime coordinator. This slice started that move by carving run-state persistence and scheduled-job event publishing out of `JobExecutorService`, and the next phase should continue from that seam by extracting the remaining runtime/container/Claude/git pipeline responsibilities.

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

- Extracted scheduled-job run lifecycle persistence and state mutation out of `JobExecutorService` into a focused collaborator:
  - `server/src/services/scheduled-jobs/scheduled-job-run-state.service.ts`
- Extracted scheduled-job event publishing out of `JobExecutorService` into a narrow publisher so the executor no longer emits directly:
  - `server/src/services/scheduled-jobs/scheduled-job-run-events.service.ts`
- Rewired `JobExecutorService` to delegate run creation, run/job status persistence, stream summary tracking, commit result application, failure persistence, and lifecycle event publishing while preserving the existing execution flow:
  - `server/src/services/scheduled-jobs/job-executor.service.ts`
- Registered the new scheduled-job collaborators in the scheduled-jobs services module:
  - `server/src/services/scheduled-jobs/scheduled-jobs-services.module.ts`
- Added focused unit coverage for the new scheduled-job seams:
  - `server/src/services/scheduled-jobs/scheduled-job-run-state.service.spec.ts`
  - `server/src/services/scheduled-jobs/scheduled-job-run-events.service.spec.ts`

## Validation Already Run

- `npm run format`: passed
- server package build (`npm run build`): passed
- `npx jest src/services/scheduled-jobs/scheduled-job-run-events.service.spec.ts src/services/scheduled-jobs/scheduled-job-run-state.service.spec.ts`: passed
- `ReadLints` on touched scheduled-job files: no diagnostics reported
- Quick runtime boot sanity was not re-run in this slice because there were already active prod server terminals when this handoff was updated

## Current Status

There is no known blocker from this refactor slice.

`JobExecutorService` no longer owns direct job-run persistence or direct event-emitter orchestration. Those responsibilities now live behind `ScheduledJobRunStateService` and `ScheduledJobRunEventsService`, while the executor still coordinates the remaining runtime flow: docker image validation, settings lookup, container provisioning/retries, branch creation, Claude execution, git commit/push, and cleanup.

## Next Phase Target

The next highest-value refactor target remains `server/src/services/scheduled-jobs/job-executor.service.ts`.

This service is smaller than before, but it is still the main large coordinator called out in `plans/future/refactor/refactor-gtp4.md`:

- `server/src/services/scheduled-jobs/job-executor.service.ts`

After this slice, the remaining responsibilities still bundled there are container/runtime setup, branch/runtime preparation, Claude execution streaming orchestration, git post-processing, and cleanup.

## Recommended Split

### Keep

- Keep `SessionSubscriptionService` as the narrow subscription/state fanout seam if it continues to reduce duplication.
- Keep `SessionGatewaySubscriptionsService` as the gateway-local seam for session/log subscription handling, git watcher lifecycle, and disconnect cleanup.
- Keep `SessionGatewayChatService` as the gateway-local seam for chat send/cancel transport orchestration and reconnect status fanout.
- Keep `SessionGatewayJobRunsService` as the gateway-local seam for scheduled-job websocket subscription state, room streaming, and run/job update fanout.
- Keep `SessionGatewayFanoutService` as the narrow shared emitter for git-status, session lifecycle, and delete lifecycle websocket fanout.
- Keep websocket event names and payload contracts stable while moving logic behind smaller collaborators.

### Already Extracted

1. Session/log subscription handling
   - `SessionGatewaySubscriptionsService` now owns subscription bookkeeping delegation, log stream subscription setup, session activity touching, disconnect cleanup, and watcher start/stop decisions

2. Chat websocket behavior
   - `SessionGatewayChatService` now owns `chat.send`/`chat.cancel` transport orchestration plus reconnect chat-status sync

3. Scheduled-job websocket behavior
   - `SessionGatewayJobRunsService` now owns job-run subscribe/unsubscribe behavior plus run-stream and run/job update fanout

4. Shared websocket fanout helpers
   - `SessionGatewayFanoutService` now owns git status, session status/update emits, and delete progress/completion/failure fanout

5. Scheduled-job run-state persistence
   - `ScheduledJobRunStateService` now owns pending-run creation, running/completed/failed persistence, job timing updates during scheduled triggers, container attachment persistence, and run metadata mutation helpers

6. Scheduled-job event publishing
   - `ScheduledJobRunEventsService` now owns started/updated/completed/failed/stream event emission for scheduled-job runs

### Extract Next

1. `JobExecutorService` pipeline seams
   - split the remaining runtime/container preparation and retry logic from Claude/git execution steps

2. Container/runtime provisioning collaborator
   - extract the docker-ready check, port allocation, settings-derived container options assembly, and ephemeral container retry/start logic behind a focused collaborator

3. Claude/git execution collaborator
   - extract prompt execution plus optional commit/push post-processing so `JobExecutorService` becomes a thin pipeline orchestrator over well-named steps

## Constraints For The Next Slice

- Preserve current HTTP and websocket behavior.
- Avoid introducing new reverse dependencies from `services/**` into `interactors/**`.
- Prefer constructor DI and domain ports/tokens over direct implementation coupling.
- Keep the refactor incremental: move one responsibility at a time and validate after each extraction.
- Preserve existing websocket namespaces, event names, and payload shapes unless the change is explicitly coordinated.
- Do not treat repo-wide lint noise as caused by this work unless it is in files touched by the slice.
- Treat the gateway split as mostly done unless a tiny follow-up clearly buys readability without reintroducing coordination there.

## Suggested Next Steps

1. Continue on `server/src/services/scheduled-jobs/job-executor.service.ts`, starting from the new state/event seams rather than reopening the gateway work.
2. Extract a runtime/container collaborator next, especially around docker readiness, port allocation, settings-derived container options, and `createContainerWithRetries()`.
3. After that seam is stable, consider a second collaborator for Claude prompt execution plus optional git commit/push post-processing.
4. Run:
   - `npm run format`
   - `npm run build`
   - targeted tests for the affected scheduled-job slice
   - a quick runtime boot check if no existing prod server is already running

## Notes For The Next Agent

- `server/src/interactors/sessions/session-lifecycle.interactor.ts` has been removed.
- `server/src/services/sessions/session-runtime.service.ts` still owns the low-level stop-session/runtime path and remains the precedent for keeping shared runtime code out of transport adapters.
- `server/src/interactors/sessions/session-health-monitor.service.ts` is now the shared seam for background readiness polling.
- `server/src/interactors/sessions/create-session/create-session.interactor.ts` still has room for future cleanup, but it is no longer coupled to a lifecycle god-object.
- `server/src/gateways/session-gateway-subscriptions.service.ts` now owns the session/log subscription slice; extend the split from there instead of pulling that logic back into `SessionGateway`.
- `server/src/gateways/session-gateway-chat.service.ts` now owns the chat websocket slice; extend from that seam instead of reintroducing chat orchestration into `SessionGateway`.
- `server/src/gateways/session-gateway-job-runs.service.ts` now owns the scheduled-job websocket slice; extend from that seam instead of reintroducing job-run orchestration into `SessionGateway`.
- `server/src/gateways/session-gateway-fanout.service.ts` now owns the shared room/global emit helpers for git/session/delete fanout.
- `server/src/gateways/session-gateway.events.ts` is the shared gateway-local contract for websocket event names and room helpers.
- `server/src/services/scheduled-jobs/scheduled-job-run-state.service.ts` is now the seam for scheduled-job run persistence and status transitions; extend it instead of pushing run lifecycle writes back into `JobExecutorService`.
- `server/src/services/scheduled-jobs/scheduled-job-run-events.service.ts` is now the seam for scheduled-job lifecycle and stream event emission; keep event names/payloads stable behind that publisher.
- `npm run lint` is still noisy from pre-existing repo-wide issues; use `ReadLints` or file-scoped validation for touched files.
- The next slice should stay on the scheduled-jobs runtime coordinator; keep the work incremental and avoid coupling new collaborators directly to transport adapters.
