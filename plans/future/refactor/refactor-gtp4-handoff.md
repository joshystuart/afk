# Refactor GTP4 Handoff

## Goal

Continue the server refactor from `plans/future/refactor/refactor-gtp4.md`.

The session lifecycle split that was the previous phase 3 target is complete, and the `session.gateway.ts` extraction work is now substantially complete too: session/log subscriptions, chat websocket orchestration, scheduled-job run streaming, and the remaining thin fanout helpers have been split into gateway-local collaborators. The next high-value slice should move on from the gateway and continue the broader "split large coordinators/adapters" phase by targeting the remaining large scheduled-job runtime coordinator.

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
- Extracted session/log subscription and disconnect cleanup behavior out of `SessionGateway` into a gateway-local collaborator:
  - `server/src/gateways/session-gateway-subscriptions.service.ts`
- Added focused unit coverage for the extracted gateway collaborator:
  - `server/src/gateways/session-gateway-subscriptions.service.spec.ts`
- Rewired the main gateway to delegate session/log subscription behavior while preserving the existing websocket namespace and event contract:
  - `server/src/gateways/session.gateway.ts`
  - `server/src/gateways/gateways.module.ts`
- Extracted chat websocket transport behavior out of `SessionGateway` into a focused gateway-local collaborator:
  - `server/src/gateways/session-gateway-chat.service.ts`
- Moved shared websocket event names and room helpers into a gateway-local contract so extracted collaborators can share the same transport constants without circular coupling:
  - `server/src/gateways/session-gateway.events.ts`
- Added focused unit coverage for the extracted chat collaborator:
  - `server/src/gateways/session-gateway-chat.service.spec.ts`
- Rewired the main gateway to delegate chat send/cancel handling and reconnect status fanout while preserving the existing websocket namespace and event contract:
  - `server/src/gateways/session.gateway.ts`
  - `server/src/gateways/gateways.module.ts`
- Extracted scheduled-job websocket subscription and event fanout behavior out of `SessionGateway` into a focused gateway-local collaborator:
  - `server/src/gateways/session-gateway-job-runs.service.ts`
- Extracted the remaining git/session/delete websocket fanout helpers into a narrow gateway-local collaborator so the gateway no longer owns direct room/global emit orchestration:
  - `server/src/gateways/session-gateway-fanout.service.ts`
- Added focused unit coverage for the newly extracted scheduled-job and fanout collaborators:
  - `server/src/gateways/session-gateway-job-runs.service.spec.ts`
  - `server/src/gateways/session-gateway-fanout.service.spec.ts`
- Rewired the main gateway to delegate scheduled-job websocket behavior plus shared room/global fanout helpers while preserving the existing websocket namespace and event contract:
  - `server/src/gateways/session.gateway.ts`
  - `server/src/gateways/gateways.module.ts`

## Validation Already Run

- `npm run format`: passed
- server package build (`npm run build`): passed
- `npx jest src/gateways/session-gateway-subscriptions.service.spec.ts`: passed
- `npx jest src/gateways/session-gateway-chat.service.spec.ts src/gateways/session-gateway-subscriptions.service.spec.ts`: passed
- `npx jest src/gateways/session-gateway-chat.service.spec.ts src/gateways/session-gateway-subscriptions.service.spec.ts src/gateways/session-gateway-job-runs.service.spec.ts src/gateways/session-gateway-fanout.service.spec.ts`: passed
- `ReadLints` on touched gateway files: no diagnostics reported
- Quick runtime boot sanity from the previous slice remains good, but it was not re-run in this slice because there were already active prod server terminals when this handoff was updated

## Current Status

There is no known blocker from this refactor slice.

The session lifecycle coordinator has been removed, the sessions module still builds cleanly, the create/start flows now share readiness polling through `SessionHealthMonitorService`, and `SessionGateway` is now mostly a decorator shell that delegates session/log subscription bookkeeping, chat transport orchestration, scheduled-job run streaming, and the shared websocket fanout helpers to smaller collaborators.

## Next Phase Target

The next highest-value refactor target is no longer `server/src/gateways/session.gateway.ts`; that adapter split is now in a good incremental state.

The next large coordinator called out in `plans/future/refactor/refactor-gtp4.md` is:

- `server/src/services/scheduled-jobs/job-executor.service.ts`

That service still appears to bundle job-run lifecycle persistence, container provisioning, Claude execution, git post-processing, and event publishing in one place.

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

### Extract Next

1. `JobExecutorService` pipeline seams
   - split job-run lifecycle/state persistence from container/Claude/git execution steps

2. Scheduled-job event publishing
   - if `job-executor.service.ts` still owns too much websocket- or event-shaped coordination after the first split, extract a narrow publisher/collaborator rather than creating another god-object

## Constraints For The Next Slice

- Preserve current HTTP and websocket behavior.
- Avoid introducing new reverse dependencies from `services/**` into `interactors/**`.
- Prefer constructor DI and domain ports/tokens over direct implementation coupling.
- Keep the refactor incremental: move one responsibility at a time and validate after each extraction.
- Preserve existing websocket namespaces, event names, and payload shapes unless the change is explicitly coordinated.
- Do not treat repo-wide lint noise as caused by this work unless it is in files touched by the slice.
- Treat the gateway split as mostly done unless a tiny follow-up clearly buys readability without reintroducing coordination there.

## Suggested Next Steps

1. Start the next phase on `server/src/services/scheduled-jobs/job-executor.service.ts`, aiming to separate run-state persistence, runtime/container setup, Claude execution, git post-processing, and event publishing into smaller collaborators.
2. Keep `ScheduledJobGatewayResponseFactory` and the new gateway-local collaborators in place; the websocket adapter is no longer the highest-value target.
3. Add focused tests where practical for each newly extracted scheduled-job collaborator.
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
- `npm run lint` is still noisy from pre-existing repo-wide issues; use `ReadLints` or file-scoped validation for touched files.
- The next slice should move off the gateway and back to the remaining scheduled-jobs runtime coordinator; keep the work incremental and avoid coupling new collaborators directly to transport adapters.
