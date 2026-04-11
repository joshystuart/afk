# Codebase Concerns

**Analysis Date:** 2026-04-10

## Tech Debt

**Configuration and project rules:**

- Issue: Project guidance prefers typed config via `nest-typed-config` and avoiding direct `process.env` reads in application code; several paths still read `process.env` directly.
- Files: `server/src/health/health.controller.ts` (version via `npm_package_version`), `server/src/scripts/reset-database.ts`, `server/src/scripts/reset-sessions.ts`, `server/src/scripts/reset-jobs.ts` (SQLite path), `electron/src/environment.ts` (test helper pattern in `server/test/helpers/app-test.helper.ts` is test-only).
- Impact: Inconsistent configuration story; scripts and Electron bootstrap bypass the same validation and typing as runtime YAML-backed config.
- Fix approach: Inject a small version/build metadata provider for health; pass DB path via typed config or CLI args for scripts; keep Electron bridging explicit but centralized in one module.

**Large modules (maintainability):**

- Issue: Several modules exceed the project’s informal ~500-line guideline and mix UI, data fetching, and layout.
- Files: `web/src/pages/CreateScheduledJob.tsx`, `web/src/pages/SessionDetails.tsx`, `web/src/pages/CreateSession.tsx`, `web/src/pages/ScheduledJobDetails.tsx`, `web/src/components/Layout.tsx`; server `server/src/interactors/scheduled-jobs/runtime/launchd.service.ts` (~380+ lines).
- Impact: Harder refactors, higher merge conflict risk, weaker testability.
- Fix approach: Extract presentational components, hooks, and job/session subflows into dedicated files; split launchd plist/curl generation from reconciliation helpers.

**Loose typing (`any`):**

- Issue: `any` and broad message types appear in auth, filters, entities, and API DTOs.
- Files: `server/src/libs/auth/auth.guard.ts`, `server/src/interactors/scheduled-jobs/trigger-scheduled-job/trigger-token.guard.ts` (request user), `server/src/libs/common/filters/http-exception.filter.ts`, `server/src/domain/chat/chat-message.entity.ts`, `server/src/domain/scheduled-jobs/scheduled-job-run.entity.ts` (`streamEvents`), `server/src/libs/logger/logger.ts`, `server/src/interactors/scheduled-jobs/get-scheduled-job-run-stream/get-scheduled-job-run-stream.controller.ts`, `server/test/e2e/sessions.e2e.spec.ts`.
- Impact: Weaker compile-time guarantees and harder refactors.
- Fix approach: Introduce `AuthenticatedRequest` / user payload type; typed stream event unions or JSON columns with validation at persistence boundaries.

**SQLite schema sync default:**

- Issue: For SQLite, TypeORM `synchronize` defaults to `true` when not set in YAML.
- Files: `server/src/database/database.config.ts` (contrast with PostgreSQL defaulting to `false`).
- Impact: Accidental schema auto-migration in environments where SQLite is pointed at production-like data.
- Fix approach: Default `synchronize` to `false` for SQLite as well, or require explicit opt-in in config.

## Known Bugs

Not detected via `TODO`/`FIXME`/`HACK` scans in `*.ts`/`*.tsx` sources. Treat absence of markers as lack of indexed breadcrumbs, not proof of zero defects.

## Security Considerations

**WebSocket session namespace authorization:**

- Risk: The browser client sends a JWT in the Socket.IO `auth` payload (`web/src/hooks/useWebSocket.tsx`), but the NestJS session gateway (`server/src/gateways/session.gateway.ts`) does not implement handshake middleware or guards to validate that token or enforce per-session access. Subscription handlers (`subscribe.session`, log subscriptions, etc.) operate without server-side proof of identity tied to the connection.
- Files: `server/src/gateways/session.gateway.ts`, `server/src/gateways/session-gateway-subscriptions.service.ts`, `web/src/hooks/useWebSocket.tsx`.
- Current mitigation: HTTP API routes use `AuthGuard` (`server/src/libs/app-factory/application.factory.ts`); the UI only opens the socket when logged in—client-side only.
- Recommendations: Add Socket.IO authentication (e.g., validate JWT in a gateway middleware or `afterInit` adapter), reject unauthenticated connections, and authorize `sessionId` against the current user or session ownership before joining rooms or streaming logs.

**Permissive CORS and Socket.IO CORS:**

- Risk: HTTP uses `app.enableCors()` with default options (`server/src/libs/app-factory/application.factory.ts`). WebSocket gateway sets `cors: { origin: true, credentials: true }` (`server/src/gateways/session.gateway.ts`).
- Impact: Broad cross-origin behavior if the API is exposed beyond a trusted origin.
- Recommendations: Restrict allowed origins via config (typed) for both HTTP and WebSocket when deployed beyond localhost.

**Docker socket access:**

- Risk: The server uses Dockerode with a configurable Unix socket (`server/src/libs/docker/docker-client.service.ts`). Access to the Docker API is effectively root on the host for many setups.
- Files: Docker libs under `server/src/libs/docker/`.
- Current mitigation: Socket path stored in settings; operators must secure the host and permissions.
- Recommendations: Document threat model; avoid exposing the AFK HTTP port to untrusted networks; consider read-only Docker modes only where compatible.

**Swagger in all environments:**

- Risk: OpenAPI UI is registered in `server/src/bootstrap.ts` for every boot path.
- Impact: Full API surface documented on any reachable deployment.
- Recommendations: Disable or protect `/api/docs` in production via config.

**GitHub token handling:**

- Risk: PATs are stored in application settings and used for Octokit calls (`server/src/libs/github/github.service.ts`, `server/src/libs/github/github.controller.ts`).
- Current mitigation: Settings persisted in DB; API behind `AuthGuard`.
- Recommendations: Ensure backups and DB access are treated as secret-bearing; consider token rotation UX.

## Performance Bottlenecks

**SQLite and TypeORM:**

- Problem: Default stack uses SQLite (`sqlite3` in `server/package.json`) with ORM overhead; single-writer characteristics under concurrent session activity.
- Files: `server/src/database/database.config.ts`, `server/package.json`.
- Cause: Embedded database and synchronous-style workloads.
- Improvement path: Use PostgreSQL for multi-user or high-write deployments (`database.type: postgres` in YAML); tune chunk/stream retention if tables grow large.

**Startup reconciliation:**

- Problem: Boot path reconciles DB session state with Docker and may list all containers (`server/src/observability/startup-reconciliation.service.ts`).
- Cause: Necessary correctness after crashes; can be heavy on large Docker hosts.
- Improvement path: Narrow container listing filters if the Docker API allows; defer non-critical work.

## Fragile Areas

**macOS launchd integration:**

- Files: `server/src/interactors/scheduled-jobs/runtime/launchd.service.ts` (`execSync` for `launchctl`), `server/src/interactors/scheduled-jobs/runtime/scheduled-jobs-launchd-reconciliation.service.ts`.
- Why fragile: Platform-specific paths and shell tooling; failures are caught and logged but behavior differs from Linux deployments.
- Safe modification: Guard feature flags or OS checks before writing plists; keep tests that mock `execSync` (`server/src/interactors/scheduled-jobs/runtime/launchd.service.spec.ts`).
- Test coverage: Unit tests exist for launchd helpers; end-to-end coverage of real launchd is environment-dependent.

**Job trigger URL and localhost:**

- Files: `launchd.service.ts` builds `http://localhost:${serverPort}/api/scheduled-jobs/.../trigger` for plist payloads.
- Why fragile: Assumes the server listens on localhost at the configured port from the same host that runs the agent.
- Safe modification: Make base URL configurable if AFK listens on another interface or runs behind reverse proxies for triggers.

**Chat and job run stream payloads:**

- Files: Entities store `streamEvents` as `any[] | null` (`server/src/domain/chat/chat-message.entity.ts`, `server/src/domain/scheduled-jobs/scheduled-job-run.entity.ts`).
- Why fragile: Schema evolution and deserialization errors can surface at runtime.
- Test coverage: Rely on integration and manual flows; typed event models would reduce regression risk.

## Scaling Limits

**Sessions and Docker:**

- Current capacity: Bounded by host CPU/memory, Docker daemon, and configured port ranges (`server/src/libs/docker/port-manager.service.ts`, settings-driven Docker config).
- Limit: Exhaustion of ports or Docker resources under many concurrent sessions.
- Scaling path: Horizontal scaling is non-trivial because state ties to host Docker and local SQLite; multi-node would require shared DB and remote Docker orchestration outside current scope.

**Single-server assumptions:**

- Scheduled job execution and in-process cron/interval scheduling (`server/src/interactors/scheduled-jobs/runtime/job-scheduler.service.ts`) assume one AFK instance coordinates timers; multiple instances could duplicate triggers unless externalized.

## Dependencies at Risk

**`sqlite3` native module:**

- Risk: Native bindings complicate installs on some platforms and Node versions.
- Impact: CI or user machines may need build toolchains.
- Migration plan: Prefer PostgreSQL for production; document SQLite as dev/single-user.

## Missing Critical Features

**Server-side WebSocket authentication (see Security):** Without it, network exposure of the Socket.IO port is a high-severity gap.

**Automated web UI tests in CI:**

- Problem: Root `npm run test` does not invoke `web` Vitest (`web/package.json` scripts).
- Blocks: Regressions in React pages unless caught manually or by other pipelines.
- Files: `.github/workflows/pr-ci.yml` runs `npm run test` only.

## Test Coverage Gaps

**Server `npm test` vs unit specs:**

- What’s not tested by default CI test command: `server/package.json` maps `test` to `jest --config ./test/jest-e2e.json`, which only matches `*.e2e.spec.ts`. Many `*.spec.ts` files under `server/src/` exist (e.g. gateway, docker, scheduled-jobs) but are not run by that script.
- Files: `server/test/jest-e2e.json`, `server/package.json`, numerous `server/src/**/*.spec.ts`.
- Risk: CI can pass while unit tests are never executed unless someone runs `jest` without the e2e config.
- Priority: High for CI correctness.

**Web unit tests:**

- What’s not tested: Aside from `web/src/utils/cron-helpers.test.ts`, there is minimal Vitest coverage for pages, hooks (`web/src/hooks/useChat.ts`, `web/src/hooks/useWebSocket.tsx`), and API clients.
- Risk: UI and realtime behavior regressions go unnoticed.
- Priority: Medium to high for frequently edited areas.

**End-to-end breadth:**

- Files: `server/test/e2e/sessions.e2e.spec.ts`, `server/test/e2e/settings.e2e.spec.ts`.
- Risk: Critical paths beyond sessions/settings lack automated e2e verification.

---

_Concerns audit: 2026-04-10_
