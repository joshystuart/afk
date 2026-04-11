# Codebase Structure

**Analysis Date:** 2026-04-10

## Directory Layout

```
afk/                          # Monorepo root — npm scripts orchestrate server, web, electron, docker
├── server/                   # NestJS API, Socket.IO, TypeORM, YAML config
│   ├── src/
│   │   ├── main.ts           # Delegates to bootstrap
│   │   ├── bootstrap.ts      # NestFactory, Swagger, listen
│   │   ├── app.module.ts     # Dynamic AppModule.forRoot (DB, static assets, feature modules)
│   │   ├── database/         # TypeORM options factory (database.config.ts)
│   │   ├── config/           # YAML files consumed by nest-typed-config (not secrets)
│   │   ├── domain/           # Entities, enums, domain DTOs, repository tokens, factories
│   │   ├── interactors/      # Feature areas: controllers + interactors + DTOs per use case
│   │   ├── gateways/         # Socket.IO gateway + gateway services
│   │   ├── libs/             # Infrastructure: docker, auth, git, config, common filters/interceptors
│   │   ├── health/           # Terminus health checks
│   │   ├── observability/    # Metrics, startup reconciliation
│   │   └── scripts/          # CLI maintenance (e.g. reset DB, reset jobs)
│   └── test/                 # e2e and helpers
├── web/                      # React SPA (Vite), MUI, TanStack Query, Socket.IO client
│   ├── src/
│   │   ├── main.tsx          # React root
│   │   ├── App.tsx           # Routes, providers
│   │   ├── pages/            # Route-level screens
│   │   ├── components/       # UI, chat, layout, modals
│   │   ├── hooks/            # Data + WebSocket + feature hooks
│   │   ├── api/              # Axios API modules + shared types
│   │   ├── stores/           # Zustand stores (auth, session, settings, docker images)
│   │   ├── themes/           # MUI theme overrides
│   │   ├── utils/            # constants, helpers, small tests
│   │   └── stories/          # Storybook stories
│   └── public/               # Static assets
├── electron/                 # Desktop shell: embeds server dist + web dist
│   ├── src/
│   │   ├── main.ts           # App lifecycle, IPC, tray, server start
│   │   ├── server.ts         # dynamic import of server bootstrap, static path
│   │   ├── window.ts         # BrowserWindow
│   │   ├── updater.ts        # Auto-update
│   │   └── ...
│   └── config/               # Electron build config
├── docker/                   # Language/runtime Dockerfiles and scripts for session images
├── docs/                     # Project documentation
├── plans/                    # Planning notes (legacy / future)
├── demo/                     # Demo assets
├── .github/workflows/        # CI
└── .planning/                # GSD / planning artifacts (e.g. codebase maps)
```

## Directory Purposes

**`server/src/domain/`:**

- Purpose: Persistence model and domain contracts: TypeORM entities, enums, embedded settings, repository injection tokens, factories for mapping rich types.
- Contains: `*.entity.ts`, `*.repository.ts` (interfaces), `*.tokens.ts`, `session-config.dto.ts`, etc.
- Key files: `server/src/domain/sessions/session.entity.ts`, `server/src/domain/domain.module.ts`.

**`server/src/interactors/`:**

- Purpose: Vertical feature slices: one folder per area (`sessions/`, `settings/`, `scheduled-jobs/`, `docker-images/`), each with controllers, interactors, and DTOs; `runtime/` subfolders for long-running or background behavior.
- Contains: `*.controller.ts`, `*.interactor.ts`, `*-request.dto.ts`, `*-response.dto.ts`, occasional `*.service.ts` helpers.
- Key files: `server/src/interactors/sessions/sessions.module.ts` (aggregates session HTTP surface).

**`server/src/libs/`:**

- Purpose: Reusable infrastructure and third-party integrations, registered as Nest modules.
- Contains: `docker/`, `auth/`, `config/`, `git/`, `github/`, `logger/`, `response/`, `sessions/` (repository impl), `settings/` (repository impl), `validators/`, `common/` (filters, interceptors), `app-factory/`.
- Key files: `server/src/libs/docker/docker.module.ts`, `server/src/libs/config/config.module.ts`.

**`server/src/gateways/`:**

- Purpose: WebSocket API and subscription orchestration for sessions (not HTTP).
- Contains: `session.gateway.ts`, `session-gateway-*.service.ts`, `session-subscriptions.module.ts`, event name constants.

**`server/src/database/`:**

- Purpose: Central TypeORM configuration factory and entity list.
- Key files: `server/src/database/database.config.ts`.

**`server/src/config/` (YAML):**

- Purpose: Files loaded by `nest-typed-config` `fileLoader` — infrastructure defaults; user-specific secrets belong in deployment practices, not committed credentials.

**`web/src/`:**

- Purpose: Browser UI; talks to `/api` REST and Socket.IO server.
- Contains: Feature pages under `pages/`, shared UI under `components/`, data layer under `api/` + `hooks/`, client state under `stores/`.

**`electron/src/`:**

- Purpose: Native wrapper; starts the same Nest server used in development and points the window at the local HTTP server.

**`docker/`:**

- Purpose: Build and publish images used when a session selects a stack (language/runtime), not the AFK server container itself.

## Key File Locations

**Entry Points:**

- `server/src/main.ts`: process entry; calls `bootstrapServer`.
- `server/src/bootstrap.ts`: creates Nest app, Swagger, listen.
- `web/src/main.tsx`: React DOM mount.
- `electron/src/main.ts`: Electron main process.

**Configuration:**

- `server/src/libs/config/config.module.ts`: `TypedConfigModule` + `AppConfig` schema.
- `server/src/libs/config/app.config.ts`: root config class (aggregates nested configs).
- `server/src/database/database.config.ts`: TypeORM `createTypeOrmOptions`.

**Core Logic:**

- `server/src/app.module.ts`: composes all feature modules.
- `server/src/libs/app-factory/application.factory.ts`: global pipes, filters, interceptors, guards, CORS, prefix.
- `server/src/gateways/session.gateway.ts`: real-time session channel.

**Testing:**

- `server/test/e2e/`: end-to-end tests; `server/test/helpers/`: shared test utilities.
- Co-located `*.spec.ts` next to source in `server/src/` (e.g. gateway and docker specs).

## Naming Conventions

**Files:**

- Nest: `*.module.ts`, `*.controller.ts`, `*.interactor.ts`, `*.service.ts`, `*.guard.ts`, `*.dto.ts`, `*.entity.ts`, `*.spec.ts`.
- React: `PascalCase.tsx` for components and pages; `use*.ts` / `use*.tsx` for hooks.
- Config: `*.config.ts` for typed config classes; `*.yaml` under `server/src/config/` for loader input.

**Directories:**

- Feature folders use **kebab-case** (`create-session`, `scheduled-jobs`).
- `interactors/<feature>/` groups related use cases; subfolders for `runtime/` when behavior is process-oriented.

## Where to Add New Code

**New REST feature (e.g. “widgets”):**

- Primary code: `server/src/interactors/widgets/` — add `widgets.module.ts`, `create-widget/create-widget.controller.ts`, `create-widget/create-widget.interactor.ts`, DTOs.
- Register: import `WidgetsModule` in `server/src/app.module.ts`.
- If persistence needed: add `server/src/domain/widgets/widget.entity.ts`, token in `*.tokens.ts`, repository impl under `server/src/libs/widgets/` or next to domain if thin, and `TypeOrmModule.forFeature` in the module.

**New WebSocket concern:**

- Implementation: extend or add gateway under `server/src/gateways/`; register providers in `GatewaysModule` (`server/src/gateways/gateways.module.ts`) or a dedicated gateway module imported by `AppModule`.
- Client: `web/src/hooks/useWebSocket.tsx` or a dedicated hook for new events.

**New web screen:**

- Page: `web/src/pages/<Name>.tsx`.
- Route: add `ROUTES` in `web/src/utils/constants.ts` and a `<Route>` in `web/src/App.tsx`.
- API: add functions in `web/src/api/<area>.api.ts` using `apiClient` from `web/src/api/client.ts`.

**New Docker image for sessions:**

- Definitions and scripts: `docker/` (follow existing language folders and `docker/scripts` patterns).

**Utilities:**

- Shared server helpers: prefer a small module under `server/src/libs/<name>/` with `*.module.ts` if it needs DI; otherwise `server/src/libs/common/` only if truly cross-cutting.

## Special Directories

**`server/dist/`:**

- Purpose: Compiled output; Electron loads `bootstrap` and `config` from here in production (`electron/src/server.ts`).
- Generated: Yes (build).
- Committed: No (typically gitignored).

**`web/dist/`:**

- Purpose: Vite static build; served by Nest when `staticAssetsPath` is set.
- Generated: Yes.
- Committed: No.

**`.planning/`:**

- Purpose: Planning and codebase intelligence for GSD workflows.
- Generated: Mixed; codebase docs are hand-written by mapping tasks.
- Committed: Per project policy.

---

_Structure analysis: 2026-04-10_
