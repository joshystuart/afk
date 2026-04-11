# Coding Conventions

**Analysis Date:** 2026-04-10

## Naming Patterns

**Files:**

- **Server (NestJS):** Kebab-case stem with a role suffix: `*.service.ts`, `*.controller.ts`, `*.module.ts`, `*.entity.ts`, `*.repository.ts`, `*.interactor.ts`, `*.guard.ts`, `*.filter.ts`, `*.dto.ts`, `*.enum.ts`, `*.config.ts`, `*.factory.ts`, `*.tokens.ts`. Nested feature folders use kebab-case (e.g. `create-session/create-session-request.service.ts`).
- **Web (React/Vite):** PascalCase for components under `web/src/components/` (e.g. `SessionCard.tsx`), camelCase for utilities and hooks (e.g. `cron-helpers.ts`, hooks named `use*.ts`).
- **Tests:** Server unit tests co-located as `*.spec.ts` next to the implementation; server HTTP E2E as `*.e2e.spec.ts` under `server/test/e2e/`. Web unit tests as `*.test.ts` / `*.test.tsx` under `web/src/`.

**Functions:**

- camelCase for methods and standalone functions.
- Class names: PascalCase (`CreateSessionRequestService`, `HttpExceptionFilter`).

**Variables:**

- camelCase for locals and properties; `UPPER_SNAKE_CASE` for module-level constants when used (e.g. test credentials in `server/test/helpers/app-test.helper.ts`).

**Types:**

- PascalCase for classes, interfaces, and type aliases. Enum members use PascalCase or SCREAMING_SNAKE depending on the enum file (domain enums in `server/src/domain/**` use descriptive names per file).

## Code Style

**Formatting:**

- **Tool:** Prettier (`^3.6.2`), run from repo root via `npm run format` (see root `package.json`).
- **Key settings** (root `.prettierrc`): `semi: true`, `singleQuote: true`, `trailingComma: "all"`, `printWidth: 80`, `tabWidth: 2`, `useTabs: false`, `arrowParens: "always"`, `endOfLine: "lf"`.
- **Server** also has `server/.prettierrc` extending single-quote and trailing-comma rules for `server/src` and `server/test`.

**Linting:**

- **Server:** ESLint flat config in `server/eslint.config.mjs` — `@eslint/js` recommended, `typescript-eslint` **recommendedTypeChecked** (project service + `parserOptions.projectService`), `eslint-plugin-prettier` recommended integration.
- **Key rules:** `@typescript-eslint/no-explicit-any`: **off**; `@typescript-eslint/no-floating-promises` and `@typescript-eslint/no-unsafe-argument`: **warn**.
- **Layer-specific imports (enforced):**
  - Files under `server/src/services/**/*.ts`: **must not** import from `**/interactors/**` (services depend on domain ports or libs, not interactors).
  - Files under `server/src/gateways/**/*.ts`: **must not** import interactor `*response*` or `*factory*` paths — gateways own realtime mapping.
- **Web:** ESLint flat config in `web/eslint.config.js` — JS recommended, TypeScript recommended, `eslint-plugin-react-hooks` (recommended-latest), `eslint-plugin-react-refresh` (Vite). `dist/` ignored.

## Import Organization

**Order (observed):**

1. Node built-ins (`import * as fs from 'fs'`, `import path from 'path'`).
2. External packages (`@nestjs/common`, `socket.io`, `vitest`, etc.).
3. Parent/sibling relative imports (`../../../domain/...`, `./foo.service`).

**Path aliases:**

- **Server Jest E2E:** `^@/(.*)$` → `<rootDir>/src/$1` in `server/test/jest-e2e.json` (for tests that use `@/` imports).
- **Server TypeScript:** `baseUrl: "./"` in `server/tsconfig.json` — prefer relative paths from feature modules in application code (no `@/` in `tsconfig` paths for the compiler; alias is test-focused).

## Error Handling

**Patterns:**

- **HTTP API:** Global `ValidationPipe` in `server/src/libs/app-factory/application.factory.ts` — `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`, implicit conversion enabled.
- **Exceptions:** Nest `HttpException` subclasses (`UnauthorizedException`, etc.) in guards and services — see `server/src/libs/auth/auth.guard.ts`.
- **Global filter:** `server/src/libs/common/filters/http-exception.filter.ts` — catches all exceptions, maps to JSON `{ success: false, error: { message, code, timestamp }, statusCode }`; logs non-HTTP `Error` instances with request context.

## Logging

**Framework:**

- **Application code:** NestJS `Logger` from `@nestjs/common` — `private readonly logger = new Logger(ClassName.name);` pattern (e.g. `server/src/interactors/sessions/chat/chat.service.ts`, `server/src/libs/docker/docker-image.service.ts`).
- **Infrastructure:** `nestjs-pino` via `LoggerModule.forRootAsync()` in `server/src/app.module.ts` and `server/src/libs/logger/logger.module.ts` for structured HTTP/request logging.

**Patterns:**

- Use `logger.debug` / `logger.warn` / `logger.error` with structured context objects where needed (see `HttpExceptionFilter` for error logging shape).

## Comments

**When to Comment:**

- JSDoc on public helper classes used across tests (e.g. `AppTestHelper` in `server/test/helpers/app-test.helper.ts`).
- Inline comments sparingly for non-obvious business rules or test setup intent.

**JSDoc/TSDoc:**

- Used on shared test utilities and some integration surfaces; not required on every private method.

## Function Design

**Size:**

- Prefer focused services and interactors; split files approaching ~500 lines per project guidance in `AGENTS.md`.

**Parameters:**

- Constructor injection for Nest providers; DTOs for HTTP bodies with `class-validator` / `class-transformer`.

**Return Values:**

- Interactors and services return typed objects or entities; API responses wrapped by global interceptor pattern (`ResponseInterceptor` in `server/src/libs/app-factory/application.factory.ts`).

## Module Design

**Exports:**

- Nest modules export only what other modules need; domain contracts use injection tokens where appropriate (e.g. `SETTINGS_REPOSITORY` in `server/src/domain/settings/settings.tokens.ts`).

**Barrel Files:**

- No widespread `index.ts` barrel re-exports detected; imports target concrete files.

## Configuration (Project Rules)

**YAML / typed config:**

- Application settings use **nest-typed-config** with validated DTOs under `server/src/libs/config/` (e.g. `server/src/libs/config/app.config.ts`). Inject config classes via DI — do not read raw env in feature code for infrastructure settings.
- **User-editable settings** (Docker socket, OAuth, etc.) live in the database via the Settings entity, not in YAML — see `AGENTS.md`.

**Exceptions in codebase:**

- `process.env` appears in CLI scripts (`server/src/scripts/*.ts`), E2E test bootstrap (`server/test/helpers/app-test.helper.ts`), and `server/src/health/health.controller.ts` for version — prefer typed config for new server configuration paths.

---

_Convention analysis: 2026-04-10_
