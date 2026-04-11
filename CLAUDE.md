AGENTS.md

<!-- GSD:project-start source:PROJECT.md -->

## Project

**AFK (Away From Keyboard)**

AFK is an open-source secure agentic coding platform that runs AI coding agents inside Docker containers — the ultimate sandbox. It provides a polished web interface for interacting with agents, browsing files, reviewing changes, and managing sessions, without compromising on developer experience despite prioritizing security. Anyone who wants to use AI coding agents safely can clone and run it.

**Core Value:** Secure agentic coding without DX compromise — containers provide isolation that can't be circumvented, while the UI makes working inside them feel as natural as working locally.

### Constraints

- **Tech stack**: NestJS + React + TypeORM — established, not changing
- **Security**: Skills and any host-mounted content must be read-only in containers; no arbitrary code execution paths from UI to host
- **Agent interface**: Agents must be invocable via CLI (`claude -p`, `codex`, etc.) inside Docker containers — no API-level agent integration
- **Config pattern**: `nest-typed-config` for infrastructure config, database `Settings` entity for user-configurable options — no `process.env` in application code
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript — `server/`, `web/`, `electron/` (NestJS backend, React SPA, Electron shell)
- JavaScript — small Node scripts (e.g. `electron/scripts/package.js`), Make-driven Docker image builds under `docker/`
- YAML — server configuration loaded by `nest-typed-config` (`server/src/config/*.yaml`, platform variants like `server/src/config/.env.mac.yaml`)
- CSS/SCSS — formatted by root Prettier glob (`package.json` `format` script)

## Runtime

- Node.js `>=24.0.0` (declared in root `package.json` `engines`; CI uses Node 24 in `.github/workflows/pr-ci.yml`)
- npm — each package has its own `package-lock.json` at root, `server/`, `web/`, `electron/`, `docker/`

## Frameworks

- NestJS `^11` — HTTP API, WebSockets (Socket.IO), scheduling, static SPA hosting (`server/package.json`; entry `server/src/main.ts` → `server/src/bootstrap.ts`)
- React `^19` with Vite `^7` — web UI (`web/package.json`)
- Electron `^41` with electron-builder — desktop app (`electron/package.json`)
- Jest `^29` — server unit (`server/package.json` `jest` block) and e2e-style tests (`server/test/jest-e2e.json`)
- Vitest `^4` — web unit tests; Storybook browser tests via Playwright (`web/vite.config.ts`, `web/package.json`)
- Nest CLI / SWC — `@nestjs/cli`, `@swc/core` (`server/package.json`)
- Vite — `web` build and dev server
- concurrently — root `start` scripts run server + web (`package.json`)
- Prettier `^3` — repo-wide formatting (root `devDependencies`)

## Key Dependencies

- `typeorm` + `@nestjs/typeorm` — persistence; drivers via `sqlite3` and PostgreSQL client (`server/package.json`, options in `server/src/database/database.config.ts`)
- `dockerode` — Docker Engine API (`server/src/libs/docker/docker-client.service.ts`)
- `@nestjs/platform-socket.io` / `@nestjs/websockets` + `socket.io` — real-time session gateway (`server/src/gateways/session.gateway.ts`; client `socket.io-client` in `web/package.json`)
- `@octokit/rest` — GitHub REST API for PAT validation and repo listing (`server/src/libs/github/github.service.ts`)
- `@nestjs/jwt` + `class-validator` / `class-transformer` — auth and DTO validation (`server/src/libs/auth/`, `server/src/libs/app-factory/application.factory.ts`)
- `nest-typed-config` — hierarchical YAML config bound to DTOs (`server/src/libs/config/config.module.ts`, `server/src/libs/config/app.config.ts`)
- `nestjs-pino`, `pino`, `pino-pretty` — structured logging (`server/src/libs/logger/logger.module.ts`)
- `@tanstack/react-query`, `axios`, `zustand` — web data fetching and state (`web/package.json`)
- `@mui/material`, `@emotion/react` — web UI (`web/package.json`)
- `electron-updater` — desktop auto-update (`electron/package.json`)
- `@nestjs/terminus` — health checks (`server/src/health/health.module.ts`)
- `@nestjs/swagger` — OpenAPI UI at `/api/docs` (`server/src/bootstrap.ts`)
- `@nestjs/event-emitter` — internal events (`server/src/app.module.ts`)
- `@nestjs/schedule` — scheduled jobs subsystem (`server/package.json`, scheduled-jobs modules under `server/src/interactors/scheduled-jobs/`)
- `js-yaml` — YAML use in server and `docker/` tooling

## Configuration

- Server: **no** `process.env` for app settings in application code — use `nest-typed-config` with YAML files under `server/src/config/` (see `server/src/libs/config/config.module.ts`). `fileLoader` supports environment variable substitution in YAML (e.g. `electron/config/.env.yaml` uses `${VAR:-default}` patterns for the bundled server).
- Web: Vite env — `VITE_API_URL` and `VITE_WS_URL` override defaults in `web/src/api/client.ts` and `web/src/hooks/useWebSocket.tsx` (default `http://localhost:4919`).
- User-operational settings (Docker socket, port ranges, Git tokens, etc.) persist in the database via the `Settings` entity, not YAML (`server/src/domain/settings/settings.entity.ts`).
- TypeScript — `server/tsconfig.json`, `server/tsconfig.build.json`, `web/tsconfig.json`, `electron/tsconfig.json`
- Nest — `server/nest-cli.json`
- Vite — `web/vite.config.ts`
- Electron packaging — `electron/scripts/package.js`, `electron/electron-builder.config.js` (referenced by package script)

## Platform Requirements

- Node 24+, npm; Docker Engine accessible via socket path configured in app settings (used by `DockerClientService` in `server/src/libs/docker/docker-client.service.ts`)
- For full stack: `npm run install:all`, `npm run build`; optional Docker image builds via `docker/` Make targets
- Deployed as Node process serving API + optional static web assets (`ServeStaticModule` in `server/src/app.module.ts` when `staticAssetsPath` is set); or Electron bundle embedding the server; or container workflows in `.github/workflows/docker-*.yml`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- **Server (NestJS):** Kebab-case stem with a role suffix: `*.service.ts`, `*.controller.ts`, `*.module.ts`, `*.entity.ts`, `*.repository.ts`, `*.interactor.ts`, `*.guard.ts`, `*.filter.ts`, `*.dto.ts`, `*.enum.ts`, `*.config.ts`, `*.factory.ts`, `*.tokens.ts`. Nested feature folders use kebab-case (e.g. `create-session/create-session-request.service.ts`).
- **Web (React/Vite):** PascalCase for components under `web/src/components/` (e.g. `SessionCard.tsx`), camelCase for utilities and hooks (e.g. `cron-helpers.ts`, hooks named `use*.ts`).
- **Tests:** Server unit tests co-located as `*.spec.ts` next to the implementation; server HTTP E2E as `*.e2e.spec.ts` under `server/test/e2e/`. Web unit tests as `*.test.ts` / `*.test.tsx` under `web/src/`.
- camelCase for methods and standalone functions.
- Class names: PascalCase (`CreateSessionRequestService`, `HttpExceptionFilter`).
- camelCase for locals and properties; `UPPER_SNAKE_CASE` for module-level constants when used (e.g. test credentials in `server/test/helpers/app-test.helper.ts`).
- PascalCase for classes, interfaces, and type aliases. Enum members use PascalCase or SCREAMING_SNAKE depending on the enum file (domain enums in `server/src/domain/**` use descriptive names per file).

## Code Style

- **Tool:** Prettier (`^3.6.2`), run from repo root via `npm run format` (see root `package.json`).
- **Key settings** (root `.prettierrc`): `semi: true`, `singleQuote: true`, `trailingComma: "all"`, `printWidth: 80`, `tabWidth: 2`, `useTabs: false`, `arrowParens: "always"`, `endOfLine: "lf"`.
- **Server** also has `server/.prettierrc` extending single-quote and trailing-comma rules for `server/src` and `server/test`.
- **Server:** ESLint flat config in `server/eslint.config.mjs` — `@eslint/js` recommended, `typescript-eslint` **recommendedTypeChecked** (project service + `parserOptions.projectService`), `eslint-plugin-prettier` recommended integration.
- **Key rules:** `@typescript-eslint/no-explicit-any`: **off**; `@typescript-eslint/no-floating-promises` and `@typescript-eslint/no-unsafe-argument`: **warn**.
- **Layer-specific imports (enforced):**
- **Web:** ESLint flat config in `web/eslint.config.js` — JS recommended, TypeScript recommended, `eslint-plugin-react-hooks` (recommended-latest), `eslint-plugin-react-refresh` (Vite). `dist/` ignored.

## Import Organization

- **Server Jest E2E:** `^@/(.*)$` → `<rootDir>/src/$1` in `server/test/jest-e2e.json` (for tests that use `@/` imports).
- **Server TypeScript:** `baseUrl: "./"` in `server/tsconfig.json` — prefer relative paths from feature modules in application code (no `@/` in `tsconfig` paths for the compiler; alias is test-focused).

## Error Handling

- **HTTP API:** Global `ValidationPipe` in `server/src/libs/app-factory/application.factory.ts` — `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`, implicit conversion enabled.
- **Exceptions:** Nest `HttpException` subclasses (`UnauthorizedException`, etc.) in guards and services — see `server/src/libs/auth/auth.guard.ts`.
- **Global filter:** `server/src/libs/common/filters/http-exception.filter.ts` — catches all exceptions, maps to JSON `{ success: false, error: { message, code, timestamp }, statusCode }`; logs non-HTTP `Error` instances with request context.

## Logging

- **Application code:** NestJS `Logger` from `@nestjs/common` — `private readonly logger = new Logger(ClassName.name);` pattern (e.g. `server/src/interactors/sessions/chat/chat.service.ts`, `server/src/libs/docker/docker-image.service.ts`).
- **Infrastructure:** `nestjs-pino` via `LoggerModule.forRootAsync()` in `server/src/app.module.ts` and `server/src/libs/logger/logger.module.ts` for structured HTTP/request logging.
- Use `logger.debug` / `logger.warn` / `logger.error` with structured context objects where needed (see `HttpExceptionFilter` for error logging shape).

## Comments

- JSDoc on public helper classes used across tests (e.g. `AppTestHelper` in `server/test/helpers/app-test.helper.ts`).
- Inline comments sparingly for non-obvious business rules or test setup intent.
- Used on shared test utilities and some integration surfaces; not required on every private method.

## Function Design

- Prefer focused services and interactors; split files approaching ~500 lines per project guidance in `AGENTS.md`.
- Constructor injection for Nest providers; DTOs for HTTP bodies with `class-validator` / `class-transformer`.
- Interactors and services return typed objects or entities; API responses wrapped by global interceptor pattern (`ResponseInterceptor` in `server/src/libs/app-factory/application.factory.ts`).

## Module Design

- Nest modules export only what other modules need; domain contracts use injection tokens where appropriate (e.g. `SETTINGS_REPOSITORY` in `server/src/domain/settings/settings.tokens.ts`).
- No widespread `index.ts` barrel re-exports detected; imports target concrete files.

## Configuration (Project Rules)

- Application settings use **nest-typed-config** with validated DTOs under `server/src/libs/config/` (e.g. `server/src/libs/config/app.config.ts`). Inject config classes via DI — do not read raw env in feature code for infrastructure settings.
- **User-editable settings** (Docker socket, OAuth, etc.) live in the database via the Settings entity, not in YAML — see `AGENTS.md`.
- `process.env` appears in CLI scripts (`server/src/scripts/*.ts`), E2E test bootstrap (`server/test/helpers/app-test.helper.ts`), and `server/src/health/health.controller.ts` for version — prefer typed config for new server configuration paths.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## Pattern Overview

- **Dependency injection** throughout NestJS modules; configuration is injected via typed config classes (not raw `process.env` in application code).
- **Global API surface**: validation pipe, exception filter, response wrapper interceptor, and auth guard applied in `ApplicationFactory.configure` (`server/src/libs/app-factory/application.factory.ts`).
- **Dual transport**: JSON under global prefix `api` (e.g. `/api/sessions`) and real-time updates via **Socket.IO** namespace `/sessions` (`server/src/gateways/session.gateway.ts`).
- **Event-driven fan-out**: `@nestjs/event-emitter` used alongside gateway code for cross-cutting notifications (e.g. job run events from `server/src/libs/scheduled-jobs/job-run-events.ts`).

## Layers

- Purpose: Validate and map HTTP requests, delegate to interactors, shape responses (often via `ResponseService`).
- Location: `server/src/interactors/**/**.controller.ts` (e.g. `server/src/interactors/sessions/create-session/create-session.controller.ts`).
- Contains: Nest controllers, Swagger decorators, DTOs for request/response.
- Depends on: Interactors, `ResponseModule` (`server/src/libs/response/response.module.ts`), config DTOs where needed.
- Used by: HTTP clients (web `axios` client, Electron loading the SPA).
- Purpose: Authenticate and subscribe clients to session rooms; stream chat, logs, git status, job run updates.
- Location: `server/src/gateways/` (`session.gateway.ts`, subscription and fan-out services).
- Contains: `@WebSocketGateway` classes, Socket.IO handlers, gateway-specific factories.
- Depends on: `DockerModule`, `ChatModule`, `SessionPersistenceModule`, domain modules, `SessionSubscriptionsModule`.
- Used by: Web client via `socket.io-client` (`web/src/hooks/useWebSocket.tsx`).
- Purpose: Orchestrate business operations (create session, start/stop, chat, scheduled jobs, settings).
- Location: `server/src/interactors/**` — typically `*.interactor.ts` plus co-located `*.controller.ts`, `*-request.dto.ts`, `*-response.dto.ts`.
- Contains: `*Interactor` classes with `execute(...)` (or similar), feature-specific services (e.g. `server/src/interactors/sessions/create-session/create-session-startup.service.ts`).
- Depends on: Domain types, `libs` (Docker, Git, persistence), `SessionConfig` / other config tokens from `server/src/libs/config/`.
- Used by: Controllers and gateway services.
- Purpose: Entities, value objects, enums, domain DTOs, repository interfaces, factory helpers for mapping between persistence and API shapes.
- Location: `server/src/domain/` — e.g. `server/src/domain/sessions/session.entity.ts`, `server/src/domain/settings/settings.entity.ts`, `server/src/domain/settings/docker-settings.embedded.ts`, `server/src/domain/sessions/session.tokens.ts`.
- Contains: TypeORM entities, `SessionFactory` and related factories in `server/src/domain/domain.module.ts`, repository token symbols.
- Depends on: TypeORM decorators (entities), minimal coupling to Nest except where modules register providers.
- Used by: Interactors, `TypeOrmModule.forFeature([...])`, repository implementations in `libs`.
- Purpose: External I/O and cross-cutting technical services.
- Location: `server/src/libs/` — e.g. `server/src/libs/docker/` (engine, exec, provisioning, logs), `server/src/libs/git/`, `server/src/libs/github/`, `server/src/libs/auth/`, `server/src/libs/logger/`, `server/src/libs/stream-archive/`.
- Contains: Concrete repository implementations bound to domain tokens (e.g. `SessionRepositoryImpl` in `server/src/libs/sessions/session.repository.ts` exported via `server/src/libs/sessions/session-persistence.module.ts`), HTTP auth guard and JWT/session logic, GitHub OAuth wiring.
- Depends on: Domain entities and tokens, config classes, Docker/GitHub SDKs.
- Used by: Interactors, gateways, observability.
- Purpose: Consistent errors, response envelope, logging, metrics.
- Location: `server/src/libs/common/filters/http-exception.filter.ts`, `server/src/libs/common/interceptors/response.interceptor.ts`, `server/src/observability/` (`metrics.controller.ts`, `server-metrics.service.ts`, `startup-reconciliation.service.ts`).
- Contains: Global exception filter, `{ success, data, timestamp }` wrapping (unless already shaped), Prometheus-style metrics endpoint wiring.
- Depends on: Nest core, other feature modules as imported by `ObservabilityModule` (`server/src/observability/observability.module.ts`).
- Purpose: YAML-backed typed configuration (infrastructure: port, DB, auth, logging).
- Location: `server/src/libs/config/` (`config.module.ts`, `app.config.ts`, nested `database/`, `session.config.ts`, etc.); YAML files under `server/src/config/` (e.g. platform-specific samples).
- Contains: `nest-typed-config` `TypedConfigModule.forRoot` with `fileLoader` (`server/src/libs/config/config.module.ts`).
- Depends on: Files on disk at `configPath` (bootstrap passes `server/dist/config` in Electron: `electron/src/server.ts`).
- Used by: Any injectable that declares config classes in the constructor.
- Purpose: TypeORM connection and entity registration.
- Location: `server/src/database/database.config.ts` — `createTypeOrmOptions` merges `DatabaseConfig` with entities from `typeormEntities`.
- Contains: SQLite and PostgreSQL switch, entity array import from domain.
- Used by: `AppModule` (`TypeOrmModule.forRootAsync` in `server/src/app.module.ts`).

## Data Flow

- **Server:** Authoritative state in PostgreSQL/SQLite via TypeORM entities; ephemeral connection state in Socket.IO gateway services; optional reconciliation via `StartupReconciliationService` (`server/src/observability/startup-reconciliation.service.ts`).
- **Web:** React local state + **TanStack Query** for server cache (`web/src/App.tsx` `QueryClientProvider`); **Zustand** stores for auth and session lists (`web/src/stores/`); WebSocket pushes invalidate or patch client views.

## Key Abstractions

- Purpose: Single application use case, testable unit of business logic.
- Examples: `server/src/interactors/sessions/create-session/create-session.interactor.ts`, `server/src/interactors/sessions/list-sessions/list-sessions.interactor.ts`, `server/src/interactors/scheduled-jobs/runtime/scheduled-job-runtime.service.ts` (runtime orchestration).
- Pattern: Injectable class; controller calls `execute` with typed DTOs; returns domain or DTO types.
- Purpose: Abstract persistence behind an injection token so interactors depend on interfaces, not ORM details.
- Examples: `SESSION_REPOSITORY` in `server/src/domain/sessions/session.tokens.ts`, implementation `SessionRepositoryImpl` in `server/src/libs/sessions/session.repository.ts`, module `server/src/libs/sessions/session-persistence.module.ts`.
- Purpose: Construct complex domain objects or map DB JSON to DTOs (e.g. port pairs).
- Examples: `server/src/domain/domain.module.ts` exports `SessionFactory`, `SessionConfigDtoFactory`, `PortPairDtoFactory`; `server/src/domain/containers/port-pair-dto.factory.ts`.
- Purpose: Decompose Socket.IO gateway behavior (subscriptions, chat, job runs, fan-out).
- Examples: `server/src/gateways/session-gateway-subscriptions.service.ts`, `session-gateway-chat.service.ts`, `session-gateway-fanout.service.ts`, `session-gateway-job-runs.service.ts`.

## Entry Points

- Location: `server/src/main.ts` → `bootstrapServer` in `server/src/bootstrap.ts`.
- Triggers: Node process start (`npm run start` in `server/package.json` or embedded in Electron).
- Responsibilities: Create Nest app with `AppModule.forRoot`, run `ApplicationFactory.configure`, mount Swagger at `api/docs`, listen on `AppConfig.port` (or override).
- Location: `web/src/main.tsx` mounts `App` from `web/src/App.tsx`.
- Triggers: Browser or Electron `loadURL`.
- Responsibilities: Router, protected routes, theme, React Query, WebSocket provider, update overlay.
- Location: `electron/src/main.ts`.
- Triggers: OS launches packaged app.
- Responsibilities: IPC, tray, server lifecycle, load SPA, auto-update hooks.
- Location: `server/src/health/health.controller.ts` (Terminus + Docker health indicator), `server/src/observability/metrics.controller.ts`.
- Triggers: Load balancer or monitoring probes, `/api` prefixed routes.

## Error Handling

- Whitelist + forbid unknown properties on input DTOs (`ApplicationFactory` `ValidationPipe` options).
- `ResponseService` used in controllers for consistent success/error envelopes where applicable (`server/src/libs/response/response.service.ts`).
- Domain-specific errors from Docker layer (e.g. `server/src/libs/docker/container-not-found.error.ts`) mapped at boundaries.

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.

<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.

<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.

<!-- GSD:profile-end -->
