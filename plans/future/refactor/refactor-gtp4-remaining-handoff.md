# Refactor GTP4 Remaining Handoff

## Goal

Carry forward only the unfinished work from `plans/future/refactor/refactor-gtp4.md`.

The original dependency cleanup milestone is now largely complete, the gateway split is mostly complete, the session lifecycle god-object has already been removed, and the scheduled-job executor has now been decomposed into smaller collaborators. The remaining work is the follow-through: finish the heaviest feature migrations, keep shrinking legacy `services/**`, and retire the biggest remaining infrastructure god-object.

## What Is Already Done

### Dependency And Boundary Cleanup

- Shared settings persistence now lives in:
  - `server/src/libs/settings/settings-persistence.module.ts`
- Shared response wiring now lives in:
  - `server/src/libs/response/response.module.ts`
- Session persistence now uses a domain port/token:
  - `server/src/domain/sessions/session.repository.ts`
  - `server/src/domain/sessions/session.tokens.ts`
  - `server/src/services/repositories/session.repository.ts`
  - `server/src/services/repositories/repositories.module.ts`
- `services/**` no longer import from `interactors/**`.
- Gateways no longer import interactor DTO/factory files for scheduled-job realtime payloads.
- Architecture guardrails/docs now exist:
  - `server/ARCHITECTURE.md`
  - `server/eslint.config.mjs`

### Session And Gateway Splits

- `server/src/interactors/sessions/session-lifecycle.interactor.ts` has already been removed.
- Shared stop-session/runtime behavior now lives in:
  - `server/src/services/sessions/session-runtime.service.ts`
- Create-session orchestration has been narrowed by extracting focused collaborators:
  - `server/src/interactors/sessions/create-session/create-session-request.service.ts`
  - `server/src/interactors/sessions/create-session/create-session-startup.service.ts`
- Background health polling lives in:
  - `server/src/interactors/sessions/session-health-monitor.service.ts`
- `SessionGateway` has already been split by capability into:
  - `server/src/gateways/session-gateway-subscriptions.service.ts`
  - `server/src/gateways/session-gateway-chat.service.ts`
  - `server/src/gateways/session-gateway-job-runs.service.ts`
  - `server/src/gateways/session-gateway-fanout.service.ts`

### Scheduled Jobs

- Scheduled-job websocket event names were moved into:
  - `server/src/libs/scheduled-jobs/job-run-events.ts`
- Scheduled-job gateway payload mapping now lives in:
  - `server/src/gateways/scheduled-job-gateway-response.factory.ts`
- `JobExecutorService` has been split into focused collaborators:
  - `server/src/services/scheduled-jobs/scheduled-job-run-state.service.ts`
  - `server/src/services/scheduled-jobs/scheduled-job-run-events.service.ts`
  - `server/src/services/scheduled-jobs/scheduled-job-runtime.service.ts`
  - `server/src/services/scheduled-jobs/scheduled-job-claude-git.service.ts`

### Observability

- Observability no longer imports the full gateway module.
- Websocket subscription metrics now come from a narrower gateway seam:
  - `server/src/gateways/session-subscriptions.module.ts`

### Items From The Original Plan That Are No Longer Open

- The original finding that `services/**` imported `interactors/**` is no longer true.
- The original gateway DTO/factory coupling called out in the plan is no longer true.
- The original scheduled-job definition concern is resolved:
  - `server/src/domain/scheduled-jobs/scheduled-job-definition.service.ts`
- The original docker-images controller inconsistency is mostly resolved because the controller now talks to per-action interactors instead of a generic service:
  - `server/src/interactors/docker-images/docker-images.controller.ts`

## Validation Already Run

- `npm run format`: passed
- `npm run build`: passed
- `npx jest src/services/scheduled-jobs/scheduled-job-run-state.service.spec.ts src/services/scheduled-jobs/scheduled-job-run-events.service.spec.ts src/services/scheduled-jobs/scheduled-job-runtime.service.spec.ts src/services/scheduled-jobs/scheduled-job-claude-git.service.spec.ts`: passed
- `npx jest src/interactors/sessions/create-session/create-session-request.service.spec.ts src/interactors/sessions/create-session/create-session-startup.service.spec.ts src/services/sessions/session-runtime.service.spec.ts src/services/scheduled-jobs/scheduled-job-run-state.service.spec.ts src/services/scheduled-jobs/scheduled-job-run-events.service.spec.ts src/services/scheduled-jobs/scheduled-job-runtime.service.spec.ts src/services/scheduled-jobs/scheduled-job-claude-git.service.spec.ts`: passed
- Runtime boot sanity: passed
  - existing dev server reached `Nest application successfully started`

## Current Status

There is no known blocker in the just-finished scheduled-jobs slice.

The main unfinished work from the original plan is no longer the scheduled-job executor. The remaining architectural debt is now concentrated in:

1. the very large `DockerEngineService`
2. the broader feature-by-feature migration out of the generic `services/**` folder
3. exception/HTTP mapping cleanup

## Remaining Work

### 1. Continue The Sessions Feature Migration

This was the highest-value feature target left from the original plan, and the
next extraction step is now complete.

The major session lifecycle split already happened, and create-session has now
been narrowed so the request-preparation and startup/rollback concerns are no
longer bundled into one interactor.

Completed in this slice:

- `server/src/interactors/sessions/create-session/create-session.interactor.ts`
  - now acts as a slimmer orchestration entrypoint
- `server/src/interactors/sessions/create-session/create-session-request.service.ts`
  - owns request validation, settings/default resolution, mount-path coordination, and derived session config/name assembly
- `server/src/interactors/sessions/create-session/create-session-startup.service.ts`
  - owns container provisioning, image resolution, optimistic status persistence, log stream startup, health-monitor kickoff, and failure rollback

Follow-up targets that still make sense later:

- `server/src/services/sessions/session-runtime.service.ts`
  - keep as the low-level runtime seam; start/stop/delete flows may still benefit from narrower helpers later
- `server/src/services/sessions/session-services.module.ts`
  - keep shrinking this as more session behavior is moved into clearer use-case slices

Recommended direction:

- preserve the current session gateway split
- keep constructor DI and domain ports/tokens
- extract narrow collaborators before moving folders
- avoid reintroducing a shared session god-object

### 2. Break Up `DockerEngineService`

This is still the largest unresolved infrastructure class from the original plan and now stands out more clearly because the scheduled-job executor is smaller.

Primary target:

- `server/src/services/docker/docker-engine.service.ts`

This service still owns too many concerns at once:

- Docker client creation and socket-path management
- image existence/pull behavior
- normal container creation
- ephemeral container creation
- exec/log helpers
- readiness and health polling
- stats and inspection helpers
- path/environment assembly

Recommended split:

1. Docker client factory / connection seam
2. image management seam
3. container provisioning seam
4. exec/log helpers
5. health/readiness helpers

Do this incrementally. The goal is not a full folder move in one shot; the goal is to stop one class from owning the whole Docker runtime surface.

### 3. Decouple Observability From Gateways

This original adapter-coupling concern is now resolved for observability.

Completed in this slice:

- `server/src/services/observability/observability.module.ts` now imports a narrow session-subscriptions module instead of `server/src/gateways/gateways.module.ts`
- `server/src/gateways/session-subscriptions.module.ts` now exposes `SessionSubscriptionService` without dragging in the full websocket gateway graph

No immediate follow-up is required here unless metrics eventually move to an
event-driven seam instead of direct service reads.

### 4. Keep Retiring The Generic `services/**` Layer

The repo is in a better state than when the original plan was written, but the long-term target is still unfinished:

- `server/src/services` remains a mixed legacy layer
- several files in it are still feature orchestration rather than reusable infrastructure

The next slices should keep moving files one feature at a time into one of two destinations:

- `server/src/libs/**` for reusable adapters/cross-cutting infrastructure
- `server/src/interactors/<feature>/<use-case>/**` for feature orchestration

Do not mass-rename the repo up front. Continue taking incremental slices and remove empty legacy segments after each migration.

### 5. Exception And Transport Cleanup

This original plan item is still mostly open.

The codebase still has multiple adapters/controllers translating `throw new Error(...)` into Nest HTTP exceptions inline. That is safer to address after the higher-value structural work above, but it remains part of the original cleanup target.

Good later targets:

- introduce typed/domain-specific exceptions where repeated raw `Error` usage exists
- centralize HTTP mapping with filters/interceptors instead of repeating controller-level `try/catch` translation

## Recommended Next Slice

Stay on the original feature-migration order:

1. Docker engine breakup
2. continue retiring the generic `services/**` layer
3. exception and transport cleanup

If only one slice is taken next, prefer `DockerEngineService`, because the
highest-leverage session and observability follow-through called out in this
handoff has now landed.

## Constraints For The Next Agent

- Preserve current HTTP and websocket behavior.
- Keep the existing gateway split intact unless a tiny follow-up clearly improves readability.
- Avoid introducing new reverse dependencies from `services/**` into `interactors/**`.
- Prefer constructor DI and domain ports/tokens over direct implementation coupling.
- Move one responsibility at a time and validate after each extraction.
- Do not treat repo-wide lint noise as caused by the current slice unless it is in touched files.
- Do not reopen already-completed dependency cleanup work unless a concrete regression appears.

## Notes For The Next Agent

- The old `plans/future/refactor/refactor-gtp4-handoff.md` is now stale on the scheduled-jobs section because the runtime/container and Claude/git seams described there have been completed.
- The original plan’s “first milestone” is effectively complete enough that the remaining work is feature migration, not boundary triage.
- The codebase now boots successfully after the latest scheduled-jobs refactor.
- The create-session interactor is no longer the best next refactor target; the Docker engine surface is now the clearest remaining god-object.
- The next handoff should be updated after a Docker-focused slice unless a regression appears elsewhere.
