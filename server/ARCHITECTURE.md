# Server Architecture

## Layer Rules

- `src/domain` contains entities, value objects, enums, and repository/service ports.
- `src/libs` contains reusable adapters and cross-cutting integrations that can be shared by multiple features.
- `src/interactors` contains feature orchestration and use-case entry points.
- `src/gateways` and controllers are transport adapters. They should call use cases or small contracts, not repository implementations.
- `src/services` is legacy infrastructure that is being retired incrementally. New feature orchestration should not be added there.

## Dependency Direction

- Controllers and gateways may depend on `interactors`, `domain`, and `libs`.
- `interactors` may depend on `domain`, `libs`, and infrastructure modules that implement domain ports.
- `libs` may depend on `domain`, but not on feature-specific `interactors`.
- `services` must not import from `interactors`.

## Current Guardrails

- Settings persistence lives in `src/libs/settings/settings-persistence.module.ts` and exports the `SETTINGS_REPOSITORY` port for infra and use cases.
- Session persistence lives behind the `SESSION_REPOSITORY` token so session flows can be unit-tested with simple mocks.
- Shared API response wiring lives in `src/libs/response/response.module.ts`.
- Scheduled job websocket events live in `src/libs/scheduled-jobs/job-run-events.ts`, and gateway payload mapping stays in `src/gateways`.

## Refactor Path

- Move one feature at a time from `src/services` into either `src/libs` or `src/interactors/<feature>/<use-case>`.
- Prefer extracting narrow collaborators before moving folders.
- Add tests around ports and small collaborators as seams are introduced.
