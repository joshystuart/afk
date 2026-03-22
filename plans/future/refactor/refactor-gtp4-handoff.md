# Refactor GTP4 Handoff

## Goal

Continue the server refactor from `plans/future/refactor/refactor-gtp4.md`.

The session lifecycle split that was the previous phase 3 target is complete, the first `session.gateway.ts` extraction pass is complete, and the chat websocket extraction pass is now complete too. The next high-value slice is still within the broader "split large coordinators/adapters" phase, but it should continue reducing `server/src/gateways/session.gateway.ts` by extracting the remaining scheduled-job websocket behavior and any thin fanout helpers that still belong nearby.

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

## Validation Already Run

- `npm run format`: passed
- server package build (`npm run build`): passed
- `npx jest src/gateways/session-gateway-subscriptions.service.spec.ts`: passed
- `npx jest src/gateways/session-gateway-chat.service.spec.ts src/gateways/session-gateway-subscriptions.service.spec.ts`: passed
- `ReadLints` on touched gateway files: no diagnostics reported
- Quick runtime boot sanity: `npm run start:prod` started successfully and `SessionGateway` subscribed to the expected websocket handlers, including `chat.send` and `chat.cancel`

## Current Status

There is no known blocker from this refactor slice.

The session lifecycle coordinator has been removed, the sessions module still builds cleanly, the create/start flows now share readiness polling through `SessionHealthMonitorService`, and `SessionGateway` no longer owns either the session/log subscription bookkeeping or the chat websocket orchestration directly.

## Next Phase Target

The next highest-value refactor target is still `server/src/gateways/session.gateway.ts`, but the session/log subscription slice and chat slice are already extracted.

The remaining gateway responsibilities are still too broad for a single transport adapter:

- git/status related websocket behavior
- scheduled-job run streaming
- cross-feature event wiring

## Recommended Split

### Keep

- Keep `SessionSubscriptionService` as the narrow subscription/state fanout seam if it continues to reduce duplication.
- Keep `SessionGatewaySubscriptionsService` as the gateway-local seam for session/log subscription handling, git watcher lifecycle, and disconnect cleanup.
- Keep `SessionGatewayChatService` as the gateway-local seam for chat send/cancel transport orchestration and reconnect status fanout.
- Keep websocket event names and payload contracts stable while moving logic behind smaller collaborators.

### Already Extracted

1. Session/log subscription handling
   - `SessionGatewaySubscriptionsService` now owns subscription bookkeeping delegation, log stream subscription setup, session activity touching, disconnect cleanup, and watcher start/stop decisions

2. Chat websocket behavior
   - `SessionGatewayChatService` now owns `chat.send`/`chat.cancel` transport orchestration plus reconnect chat-status sync

### Extract Next

1. Scheduled-job run streaming
   - keep the existing gateway-owned response mapping, but move the run-stream event handling out of the main gateway

2. Remaining session/global event fanout
   - leave the top-level gateway as a thin namespace shell if Nest websocket decorators make that simpler

### Optional Helper

- If the gateway split still needs shared room or event fanout logic, extract a small gateway-local collaborator rather than letting the main gateway regain coordinator behavior.

## Constraints For The Next Slice

- Preserve current HTTP and websocket behavior.
- Avoid introducing new reverse dependencies from `services/**` into `interactors/**`.
- Prefer constructor DI and domain ports/tokens over direct implementation coupling.
- Keep the refactor incremental: move one responsibility at a time and validate after each extraction.
- Preserve existing websocket namespaces, event names, and payload shapes unless the change is explicitly coordinated.
- Do not treat repo-wide lint noise as caused by this work unless it is in files touched by the slice.

## Suggested Next Steps

1. Extract scheduled-job run subscription/update streaming next while keeping `ScheduledJobGatewayResponseFactory` as the payload mapper.
2. After scheduled-job streaming is isolated, revisit git-status fanout and generic session/global emit helpers only if `SessionGateway` is still carrying too much transport coordination.
3. Leave git-status fanout and generic session/global emit helpers in the top-level gateway only if they stay thin; otherwise extract a small event emitter helper.
4. Add focused tests where practical for each extracted gateway-local collaborator.
5. Run:
   - `npm run format`
   - `npm run build`
   - targeted tests for the affected gateway/session slice
   - a quick runtime boot check

## Notes For The Next Agent

- `server/src/interactors/sessions/session-lifecycle.interactor.ts` has been removed.
- `server/src/services/sessions/session-runtime.service.ts` still owns the low-level stop-session/runtime path and remains the precedent for keeping shared runtime code out of transport adapters.
- `server/src/interactors/sessions/session-health-monitor.service.ts` is now the shared seam for background readiness polling.
- `server/src/interactors/sessions/create-session/create-session.interactor.ts` still has room for future cleanup, but it is no longer coupled to a lifecycle god-object.
- `server/src/gateways/session-gateway-subscriptions.service.ts` now owns the session/log subscription slice; extend the split from there instead of pulling that logic back into `SessionGateway`.
- `server/src/gateways/session-gateway-chat.service.ts` now owns the chat websocket slice; extend from that seam instead of reintroducing chat orchestration into `SessionGateway`.
- `server/src/gateways/session-gateway.events.ts` is the shared gateway-local contract for websocket event names and room helpers.
- `npm run lint` is still noisy from pre-existing repo-wide issues; use `ReadLints` or file-scoped validation for touched files.
- The next slice should stay adapter-focused rather than doing another large folder move; prioritize extracting scheduled-job streaming next, then only extract remaining fanout helpers if they still buy clarity, while preserving websocket event names and payloads.
