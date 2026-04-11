# Technology Stack

**Analysis Date:** 2026-04-10

## Languages

**Primary:**

- TypeScript — `server/`, `web/`, `electron/` (NestJS backend, React SPA, Electron shell)

**Secondary:**

- JavaScript — small Node scripts (e.g. `electron/scripts/package.js`), Make-driven Docker image builds under `docker/`
- YAML — server configuration loaded by `nest-typed-config` (`server/src/config/*.yaml`, platform variants like `server/src/config/.env.mac.yaml`)
- CSS/SCSS — formatted by root Prettier glob (`package.json` `format` script)

## Runtime

**Environment:**

- Node.js `>=24.0.0` (declared in root `package.json` `engines`; CI uses Node 24 in `.github/workflows/pr-ci.yml`)

**Package Manager:**

- npm — each package has its own `package-lock.json` at root, `server/`, `web/`, `electron/`, `docker/`

## Frameworks

**Core:**

- NestJS `^11` — HTTP API, WebSockets (Socket.IO), scheduling, static SPA hosting (`server/package.json`; entry `server/src/main.ts` → `server/src/bootstrap.ts`)
- React `^19` with Vite `^7` — web UI (`web/package.json`)
- Electron `^41` with electron-builder — desktop app (`electron/package.json`)

**Testing:**

- Jest `^29` — server unit (`server/package.json` `jest` block) and e2e-style tests (`server/test/jest-e2e.json`)
- Vitest `^4` — web unit tests; Storybook browser tests via Playwright (`web/vite.config.ts`, `web/package.json`)

**Build/Dev:**

- Nest CLI / SWC — `@nestjs/cli`, `@swc/core` (`server/package.json`)
- Vite — `web` build and dev server
- concurrently — root `start` scripts run server + web (`package.json`)
- Prettier `^3` — repo-wide formatting (root `devDependencies`)

## Key Dependencies

**Critical:**

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

**Infrastructure:**

- `@nestjs/terminus` — health checks (`server/src/health/health.module.ts`)
- `@nestjs/swagger` — OpenAPI UI at `/api/docs` (`server/src/bootstrap.ts`)
- `@nestjs/event-emitter` — internal events (`server/src/app.module.ts`)
- `@nestjs/schedule` — scheduled jobs subsystem (`server/package.json`, scheduled-jobs modules under `server/src/interactors/scheduled-jobs/`)
- `js-yaml` — YAML use in server and `docker/` tooling

## Configuration

**Environment:**

- Server: **no** `process.env` for app settings in application code — use `nest-typed-config` with YAML files under `server/src/config/` (see `server/src/libs/config/config.module.ts`). `fileLoader` supports environment variable substitution in YAML (e.g. `electron/config/.env.yaml` uses `${VAR:-default}` patterns for the bundled server).
- Web: Vite env — `VITE_API_URL` and `VITE_WS_URL` override defaults in `web/src/api/client.ts` and `web/src/hooks/useWebSocket.tsx` (default `http://localhost:4919`).
- User-operational settings (Docker socket, port ranges, Git tokens, etc.) persist in the database via the `Settings` entity, not YAML (`server/src/domain/settings/settings.entity.ts`).

**Build:**

- TypeScript — `server/tsconfig.json`, `server/tsconfig.build.json`, `web/tsconfig.json`, `electron/tsconfig.json`
- Nest — `server/nest-cli.json`
- Vite — `web/vite.config.ts`
- Electron packaging — `electron/scripts/package.js`, `electron/electron-builder.config.js` (referenced by package script)

## Platform Requirements

**Development:**

- Node 24+, npm; Docker Engine accessible via socket path configured in app settings (used by `DockerClientService` in `server/src/libs/docker/docker-client.service.ts`)
- For full stack: `npm run install:all`, `npm run build`; optional Docker image builds via `docker/` Make targets

**Production:**

- Deployed as Node process serving API + optional static web assets (`ServeStaticModule` in `server/src/app.module.ts` when `staticAssetsPath` is set); or Electron bundle embedding the server; or container workflows in `.github/workflows/docker-*.yml`

---

_Stack analysis: 2026-04-10_
