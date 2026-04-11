# External Integrations

**Analysis Date:** 2026-04-10

## APIs & External Services

**GitHub (REST):**

- Used for validating a user-supplied Personal Access Token and resolving `login`, listing/searching repositories for session and settings flows.
- SDK: `@octokit/rest` — `server/src/libs/github/github.service.ts`
- HTTP routes: `server/src/libs/github/github.controller.ts` under `/api/github` (global prefix `api` from `server/src/libs/app-factory/application.factory.ts`)
- Auth: token stored per deployment in **Settings** (`githubAccessToken` on `server/src/domain/settings/settings.entity.ts`), not OAuth app redirect flow; token passed to Octokit per request.

**Docker Engine:**

- Container lifecycle, logs, exec, health — Docker Remote API via UNIX socket (or compatible path).
- Client: `dockerode` — `server/src/libs/docker/docker-client.service.ts` reads `settings.docker.socketPath` from `SettingsRepository`.

**Anthropic / Claude Code (indirect):**

- AFK does not embed a first-party Anthropic SDK in the server tree; Claude Code runs inside user containers. Environment such as `CLAUDE_CODE_OAUTH_TOKEN` is passed into containers by `server/src/libs/docker/docker-container-provisioning.service.ts` from session/settings context.

## Data Storage

**Databases:**

- **SQLite** or **PostgreSQL** — selected by `database.type` in YAML-bound `DatabaseConfig` (`server/src/libs/config/database/database.config.ts`); connection created in `server/src/database/database.config.ts` (`createTypeOrmOptions`).
- ORM: TypeORM — entities under `server/src/domain/` (e.g. `session.entity.ts`, `settings.entity.ts`, chat and scheduled-job entities).

**File Storage:**

- SQLite database file path when `type: sqlite` (`server/src/libs/config/database/sqlite.config.ts`)
- Local filesystem for static assets when server is configured with `staticAssetsPath` (`server/src/app.module.ts`)
- Stream/archive behavior — `server/src/libs/stream-archive/` (implementation detail for chat/job streams)

**Caching:**

- None detected as a dedicated external cache (Redis/Memcached); in-memory Nest services and DB-backed state only.

## Authentication & Identity

**Auth Provider:**

- **Custom** — username/password login against admin credentials from YAML (`AdminUserConfig` in `server/src/libs/config/admin-user.config.ts`, wired in `server/src/libs/config/app.config.ts`).
- Session tokens: **JWT** — `@nestjs/jwt`, secret from `auth.jwtSecret` in YAML (`server/src/libs/auth/auth.config.ts`, `server/src/libs/auth/auth.module.ts`).
- Route protection: global `AuthGuard` with `@Public()` for login/health (`server/src/libs/app-factory/application.factory.ts`, `server/src/libs/auth/auth.guard.ts`).
- GitHub access for git operations uses the **PAT in Settings**, not server-side OAuth web flow.

## Monitoring & Observability

**Error Tracking:**

- No Sentry/Rollbar/Datadog SDK detected in server or web `package.json`.

**Logs:**

- Pino via `nestjs-pino` — level and pretty-print from `LoggerConfig` (`server/src/libs/config/logger.config.ts`, `server/src/libs/logger/logger.module.ts`).

**Metrics:**

- Internal snapshot endpoint implemented in `server/src/observability/metrics.controller.ts` / `server/src/observability/server-metrics.service.ts` (not a third-party APM).

**Health:**

- `@nestjs/terminus` — `server/src/health/health.controller.ts`: Docker, memory heap, disk checks; public routes (`@Public()`).

## CI/CD & Deployment

**Hosting:**

- Not tied to a single cloud PaaS in code; runnable as Node + Docker host.

**CI Pipeline:**

- **GitHub Actions** — `.github/workflows/pr-ci.yml` (install, build, test); additional workflows for Docker and Electron releases (e.g. `.github/workflows/docker-release.yml`, `.github/workflows/electron-release.yml`).

## Environment Configuration

**Required env vars (typical):**

- Server YAML can rely on defaults; production should set strong `auth.jwtSecret` and `adminUser` credentials via config files or substitution patterns (see `electron/config/.env.yaml` for substitution examples).
- Web build/runtime: `VITE_API_URL`, `VITE_WS_URL` when not using localhost defaults.

**Secrets location:**

- JWT secret and admin password: YAML / env substitution for packaged Electron; GitHub PAT and other secrets: **database** `Settings` entity — do not commit real values (see app settings update flow `server/src/interactors/settings/update-settings/update-settings.interactor.ts`).

## Webhooks & Callbacks

**Incoming:**

- None identified as dedicated webhook controllers (no Stripe/GitHub webhook handlers in `server/src`).

**Outgoing:**

- HTTPS calls to **api.github.com** through Octokit when PAT operations run (`server/src/libs/github/github.service.ts`).
- Docker API calls to local engine socket.
- Electron **electron-updater** may call release/update endpoints configured in electron-builder publish settings (see `electron/` build config and `.github/workflows/electron-release.yml` for release artifacts).

---

_Integration audit: 2026-04-10_
