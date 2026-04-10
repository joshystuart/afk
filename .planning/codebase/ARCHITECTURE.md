# Architecture

**Analysis Date:** 2026-04-10

## Pattern Overview

**Overall:** Modular monorepo with a **NestJS** backend (REST + Socket.IO), a **React** SPA (Vite + MUI), optional **Electron** shell that bundles server + static web assets, and **Docker** image definitions for session runtimes. The server follows a **layered / use-case (“interactor”)** style: HTTP controllers sit in feature folders, application logic lives in **interactors**, persistence and integrations live under **libs**, and **domain** holds entities, enums, DTOs tied to the domain model, and repository abstractions wired via tokens.

**Key Characteristics:**

- **Dependency injection** throughout NestJS modules; configuration is injected via typed config classes (not raw `process.env` in application code).
- **Global API surface**: validation pipe, exception filter, response wrapper interceptor, and auth guard applied in `ApplicationFactory.configure` (`server/src/libs/app-factory/application.factory.ts`).
- **Dual transport**: JSON under global prefix `api` (e.g. `/api/sessions`) and real-time updates via **Socket.IO** namespace `/sessions` (`server/src/gateways/session.gateway.ts`).
- **Event-driven fan-out**: `@nestjs/event-emitter` used alongside gateway code for cross-cutting notifications (e.g. job run events from `server/src/libs/scheduled-jobs/job-run-events.ts`).

## Layers

**Presentation (HTTP — REST):**

- Purpose: Validate and map HTTP requests, delegate to interactors, shape responses (often via `ResponseService`).
- Location: `server/src/interactors/**/**.controller.ts` (e.g. `server/src/interactors/sessions/create-session/create-session.controller.ts`).
- Contains: Nest controllers, Swagger decorators, DTOs for request/response.
- Depends on: Interactors, `ResponseModule` (`server/src/libs/response/response.module.ts`), config DTOs where needed.
- Used by: HTTP clients (web `axios` client, Electron loading the SPA).

**Presentation (WebSocket):**

- Purpose: Authenticate and subscribe clients to session rooms; stream chat, logs, git status, job run updates.
- Location: `server/src/gateways/` (`session.gateway.ts`, subscription and fan-out services).
- Contains: `@WebSocketGateway` classes, Socket.IO handlers, gateway-specific factories.
- Depends on: `DockerModule`, `ChatModule`, `SessionPersistenceModule`, domain modules, `SessionSubscriptionsModule`.
- Used by: Web client via `socket.io-client` (`web/src/hooks/useWebSocket.tsx`).

**Application (use cases):**

- Purpose: Orchestrate business operations (create session, start/stop, chat, scheduled jobs, settings).
- Location: `server/src/interactors/**` — typically `*.interactor.ts` plus co-located `*.controller.ts`, `*-request.dto.ts`, `*-response.dto.ts`.
- Contains: `*Interactor` classes with `execute(...)` (or similar), feature-specific services (e.g. `server/src/interactors/sessions/create-session/create-session-startup.service.ts`).
- Depends on: Domain types, `libs` (Docker, Git, persistence), `SessionConfig` / other config tokens from `server/src/libs/config/`.
- Used by: Controllers and gateway services.

**Domain:**

- Purpose: Entities, value objects, enums, domain DTOs, repository interfaces, factory helpers for mapping between persistence and API shapes.
- Location: `server/src/domain/` — e.g. `server/src/domain/sessions/session.entity.ts`, `server/src/domain/settings/settings.entity.ts`, `server/src/domain/settings/docker-settings.embedded.ts`, `server/src/domain/sessions/session.tokens.ts`.
- Contains: TypeORM entities, `SessionFactory` and related factories in `server/src/domain/domain.module.ts`, repository token symbols.
- Depends on: TypeORM decorators (entities), minimal coupling to Nest except where modules register providers.
- Used by: Interactors, `TypeOrmModule.forFeature([...])`, repository implementations in `libs`.

**Infrastructure (`libs`):**

- Purpose: External I/O and cross-cutting technical services.
- Location: `server/src/libs/` — e.g. `server/src/libs/docker/` (engine, exec, provisioning, logs), `server/src/libs/git/`, `server/src/libs/github/`, `server/src/libs/auth/`, `server/src/libs/logger/`, `server/src/libs/stream-archive/`.
- Contains: Concrete repository implementations bound to domain tokens (e.g. `SessionRepositoryImpl` in `server/src/libs/sessions/session.repository.ts` exported via `server/src/libs/sessions/session-persistence.module.ts`), HTTP auth guard and JWT/session logic, GitHub OAuth wiring.
- Depends on: Domain entities and tokens, config classes, Docker/GitHub SDKs.
- Used by: Interactors, gateways, observability.

**Cross-cutting:**

- Purpose: Consistent errors, response envelope, logging, metrics.
- Location: `server/src/libs/common/filters/http-exception.filter.ts`, `server/src/libs/common/interceptors/response.interceptor.ts`, `server/src/observability/` (`metrics.controller.ts`, `server-metrics.service.ts`, `startup-reconciliation.service.ts`).
- Contains: Global exception filter, `{ success, data, timestamp }` wrapping (unless already shaped), Prometheus-style metrics endpoint wiring.
- Depends on: Nest core, other feature modules as imported by `ObservabilityModule` (`server/src/observability/observability.module.ts`).

**Configuration:**

- Purpose: YAML-backed typed configuration (infrastructure: port, DB, auth, logging).
- Location: `server/src/libs/config/` (`config.module.ts`, `app.config.ts`, nested `database/`, `session.config.ts`, etc.); YAML files under `server/src/config/` (e.g. platform-specific samples).
- Contains: `nest-typed-config` `TypedConfigModule.forRoot` with `fileLoader` (`server/src/libs/config/config.module.ts`).
- Depends on: Files on disk at `configPath` (bootstrap passes `server/dist/config` in Electron: `electron/src/server.ts`).
- Used by: Any injectable that declares config classes in the constructor.

**Database:**

- Purpose: TypeORM connection and entity registration.
- Location: `server/src/database/database.config.ts` — `createTypeOrmOptions` merges `DatabaseConfig` with entities from `typeormEntities`.
- Contains: SQLite and PostgreSQL switch, entity array import from domain.
- Used by: `AppModule` (`TypeOrmModule.forRootAsync` in `server/src/app.module.ts`).

## Data Flow

**REST request (authenticated session operation):**

1. Browser or Electron loads SPA; `web/src/api/client.ts` sends `Authorization: Bearer` from `web/src/stores/auth.store.ts`.
2. Request hits Nest with global prefix `api` after `ApplicationFactory.configure` (`server/src/bootstrap.ts`).
3. `AuthGuard` (`server/src/libs/auth/auth.guard.ts`) runs; controller method validates body with `ValidationPipe` DTOs.
4. Controller calls an interactor `execute(...)` (e.g. `CreateSessionInteractor` from `server/src/interactors/sessions/create-session/create-session.interactor.ts`).
5. Interactor uses `SESSION_REPOSITORY` (bound in `server/src/libs/sessions/session-persistence.module.ts`), Docker services, and domain factories to persist and start work.
6. `ResponseInterceptor` wraps successful payloads unless already `{ success: ... }` (`server/src/libs/common/interceptors/response.interceptor.ts`). Errors surface through `HttpExceptionFilter` (`server/src/libs/common/filters/http-exception.filter.ts`).

**Real-time session updates:**

1. Client `WebSocketProvider` connects to `VITE_WS_URL` (default `http://localhost:4919`) with Socket.IO (`web/src/hooks/useWebSocket.tsx`).
2. `SessionGateway` on namespace `/sessions` accepts connections (`server/src/gateways/session.gateway.ts`).
3. Client subscribes to session rooms; gateway delegates to `SessionGatewaySubscriptionsService`, `SessionGatewayChatService`, `SessionGatewayJobRunsService`, `SessionGatewayFanoutService`.
4. Internal `@OnEvent` handlers and domain events propagate updates (e.g. `JOB_RUN_EVENTS`) to subscribed sockets.

**Electron desktop bundle:**

1. `electron/src/main.ts` starts tray, window, auto-updater, then `startServer()` (`electron/src/server.ts`).
2. `bootstrapServer` is loaded from packaged `server/dist/bootstrap` with `staticAssetsPath` pointing at `web/dist` so Nest `ServeStaticModule` serves the SPA (`server/src/app.module.ts` `ServeStaticModule.forRoot` when `staticAssetsPath` is set).
3. Browser window loads `http://localhost:${SERVER_PORT}` — same SPA as dev, against the embedded API.

**State Management:**

- **Server:** Authoritative state in PostgreSQL/SQLite via TypeORM entities; ephemeral connection state in Socket.IO gateway services; optional reconciliation via `StartupReconciliationService` (`server/src/observability/startup-reconciliation.service.ts`).
- **Web:** React local state + **TanStack Query** for server cache (`web/src/App.tsx` `QueryClientProvider`); **Zustand** stores for auth and session lists (`web/src/stores/`); WebSocket pushes invalidate or patch client views.

## Key Abstractions

**Interactor:**

- Purpose: Single application use case, testable unit of business logic.
- Examples: `server/src/interactors/sessions/create-session/create-session.interactor.ts`, `server/src/interactors/sessions/list-sessions/list-sessions.interactor.ts`, `server/src/interactors/scheduled-jobs/runtime/scheduled-job-runtime.service.ts` (runtime orchestration).
- Pattern: Injectable class; controller calls `execute` with typed DTOs; returns domain or DTO types.

**Repository (token-based):**

- Purpose: Abstract persistence behind an injection token so interactors depend on interfaces, not ORM details.
- Examples: `SESSION_REPOSITORY` in `server/src/domain/sessions/session.tokens.ts`, implementation `SessionRepositoryImpl` in `server/src/libs/sessions/session.repository.ts`, module `server/src/libs/sessions/session-persistence.module.ts`.

**Domain factories:**

- Purpose: Construct complex domain objects or map DB JSON to DTOs (e.g. port pairs).
- Examples: `server/src/domain/domain.module.ts` exports `SessionFactory`, `SessionConfigDtoFactory`, `PortPairDtoFactory`; `server/src/domain/containers/port-pair-dto.factory.ts`.

**Gateway services:**

- Purpose: Decompose Socket.IO gateway behavior (subscriptions, chat, job runs, fan-out).
- Examples: `server/src/gateways/session-gateway-subscriptions.service.ts`, `session-gateway-chat.service.ts`, `session-gateway-fanout.service.ts`, `session-gateway-job-runs.service.ts`.

## Entry Points

**Server bootstrap:**

- Location: `server/src/main.ts` → `bootstrapServer` in `server/src/bootstrap.ts`.
- Triggers: Node process start (`npm run start` in `server/package.json` or embedded in Electron).
- Responsibilities: Create Nest app with `AppModule.forRoot`, run `ApplicationFactory.configure`, mount Swagger at `api/docs`, listen on `AppConfig.port` (or override).

**Web SPA:**

- Location: `web/src/main.tsx` mounts `App` from `web/src/App.tsx`.
- Triggers: Browser or Electron `loadURL`.
- Responsibilities: Router, protected routes, theme, React Query, WebSocket provider, update overlay.

**Electron shell:**

- Location: `electron/src/main.ts`.
- Triggers: OS launches packaged app.
- Responsibilities: IPC, tray, server lifecycle, load SPA, auto-update hooks.

**Health & metrics:**

- Location: `server/src/health/health.controller.ts` (Terminus + Docker health indicator), `server/src/observability/metrics.controller.ts`.
- Triggers: Load balancer or monitoring probes, `/api` prefixed routes.

## Error Handling

**Strategy:** Throw Nest `HttpException` (or let unknown errors bubble); global `HttpExceptionFilter` logs and returns a consistent error shape; `ValidationPipe` rejects invalid DTOs early.

**Patterns:**

- Whitelist + forbid unknown properties on input DTOs (`ApplicationFactory` `ValidationPipe` options).
- `ResponseService` used in controllers for consistent success/error envelopes where applicable (`server/src/libs/response/response.service.ts`).
- Domain-specific errors from Docker layer (e.g. `server/src/libs/docker/container-not-found.error.ts`) mapped at boundaries.

## Cross-Cutting Concerns

**Logging:** `LoggerModule` (`server/src/libs/logger/logger.module.ts`) and Nest `Logger` in gateways and filters.

**Validation:** class-validator DTOs + `ValidationPipe` globally; custom validators in `server/src/libs/validators/`.

**Authentication:** `AuthModule` (`server/src/libs/auth/auth.module.ts`); global `AuthGuard` with optional public routes via `@Public()` / reflector (see `server/src/libs/auth/auth.guard.ts`); login endpoint issues tokens consumed by the web client.

---

*Architecture analysis: 2026-04-10*
