# Testing Patterns

**Analysis Date:** 2026-04-10

## Test Framework

**Runner:**

- **Server:** Jest `^29.7.0` with `ts-jest` `^29.2.5`. Two configurations:
  - **Default (package.json `jest` key):** `server/package.json` — `rootDir: "src"`, `testRegex: ".*\\.spec\\.ts$"`, `testEnvironment: "node"`, `transform` via `ts-jest`, `transformIgnorePatterns` for ESM packages including `@octokit/*`.
  - **E2E config file:** `server/test/jest-e2e.json` — `rootDir: ".."`, `testRegex: ".e2e.spec.ts$"`, `moduleNameMapper` for `^@/(.*)$` → `<rootDir>/src/$1`, `testTimeout: 30000`, `maxWorkers: 1`, coverage to `coverage-e2e/`.

**Assertion Library:**

- Jest built-in `expect` for server tests.

**Run Commands:**

```bash
# From repo root — runs SERVER E2E ONLY (jest-e2e.json)
npm test

# Server: unit tests (*.spec.ts under server/src)
cd server && npx jest

cd server && npx jest --watch
cd server && npx jest --coverage
```

```bash
# Web: Vitest unit project only (matches npm script)
cd web && npm test

cd web && npm run test:watch
```

**Note:** Root `package.json` script `"test"` runs `cd server && npm run test`, and server `"test"` uses **`jest --config ./test/jest-e2e.json`**, so it executes **only** files matching `*.e2e.spec.ts` (e.g. `server/test/e2e/settings.e2e.spec.ts`). **Co-located `*.spec.ts` unit tests are not run by `npm test` at repo root** — run them with `cd server && npx jest` (uses inline Jest config from `server/package.json`).

**Web:**

- Vitest `^4.0.18` configured inside `web/vite.config.ts` (`test.projects`): **unit** project includes `src/**/*.test.ts` and `src/**/*.test.tsx` with `environment: 'node'`; **storybook** project uses `@storybook/addon-vitest` and Playwright browser mode.

## Test File Organization

**Location:**

- **Server unit:** Co-located next to source — e.g. `server/src/interactors/sessions/create-session/create-session-request.service.spec.ts`.
- **Server E2E:** `server/test/e2e/*.e2e.spec.ts` with shared helpers in `server/test/helpers/`.
- **Web unit:** Under `web/src/` with `*.test.ts` / `*.test.tsx` — e.g. `web/src/utils/cron-helpers.test.ts`.

**Naming:**

- Server unit: `*.spec.ts`
- Server E2E: `*.e2e.spec.ts`
- Web: `*.test.ts` / `*.test.tsx`

**Structure:**

```
server/src/<feature>/<file>.ts
server/src/<feature>/<file>.spec.ts
server/test/e2e/<area>.e2e.spec.ts
server/test/helpers/app-test.helper.ts
web/src/<path>/<module>.test.ts
```

## Test Structure

**Suite Organization:**

```typescript
describe('CreateSessionRequestService', () => {
  let service: CreateSessionRequestService;
  let settingsRepository: jest.Mocked<SettingsRepository>;

  beforeEach(() => {
    settingsRepository = {
      get: jest.fn(),
      save: jest.fn(),
      // ...
    } as unknown as jest.Mocked<SettingsRepository>;
    service = new CreateSessionRequestService(/* deps */);
  });

  afterEach(() => {
    /* cleanup temp dirs, etc. */
  });

  it('allows prepare without repo URL when ...', async () => {
    settingsRepository.get.mockResolvedValue({ /* ... */ } as any);
    const prepared = await service.prepare({ /* ... */ });
    expect(prepared.sessionConfig.repoUrl).toBeNull();
  });
});
```

**Patterns:**

- **Setup:** `beforeEach` for fresh mocks and SUT construction; `beforeAll` for expensive E2E app boot (`server/test/e2e/settings.e2e.spec.ts`).
- **Teardown:** `afterEach` clears DB in E2E via `appTestHelper.clearDatabase()`; unit tests clean temp filesystem state where applicable.
- **Assertions:** `expect(...).toBe`, `toMatch`, `toHaveBeenCalledWith`, HTTP `.expect(200)` via supertest.

**Web unit example** (`web/src/utils/cron-helpers.test.ts`):

```typescript
import { describe, expect, it } from 'vitest';
import { buildCronExpression } from './cron-helpers';

describe('buildCronExpression', () => {
  it('should build a daily expression', () => {
    expect(buildCronExpression({ frequency: 'daily', time: { hour: 9, minute: 30 } })).toBe(
      '30 9 * * *',
    );
  });
});
```

## Mocking

**Framework:**

- **Server:** Jest mocks (`jest.fn()`, `jest.Mocked<T>`, `jest.spyOn` where needed).

**Patterns:**

```typescript
let chatService: jest.Mocked<ChatService>;

beforeEach(() => {
  chatService = {
    getExecutionInfo: jest.fn(),
    sendMessage: jest.fn(),
  } as unknown as jest.Mocked<ChatService>;
  service = new SessionGatewayChatService(deps, chatService);
});

chatService.sendMessage.mockImplementation(async (...args) => {
  /* capture callbacks */
});
```

**E2E external systems:**

- `AppTestHelper` in `server/test/helpers/app-test.helper.ts` builds a `TestingModule` from `AppModule.forRoot()` and **overrides** `DockerEngineService` (and related) with `jest.fn()` implementations so Docker is not required during E2E.

**What to Mock:**

- Repositories and peer services in **unit** tests; infrastructure boundaries (Docker) in **E2E** helpers.

**What NOT to Mock:**

- E2E tests use real SQLite in-memory (`process.env.DATABASE_TYPE = 'sqlite'`, `DB_SQLITE_DATABASE = ':memory:'`) and real HTTP pipeline — see `initializeApp()` in `app-test.helper.ts`.

## Fixtures and Factories

**Test Data:**

- Inline object literals for settings/session payloads in specs; UUIDs as fixed strings where determinism matters (e.g. `sessionId` in `server/src/gateways/session-gateway-chat.service.spec.ts`).
- `SessionConfig` instances built with `Object.assign` for minimal test doubles in unit tests.

**Location:**

- Shared E2E setup: `server/test/helpers/app-test.helper.ts` (`AppTestHelper`, auth token helper, `clearDatabase`).

## Coverage

**Requirements:**

- No enforced coverage threshold in CI detected from configs reviewed; `collectCoverageFrom` in `server/package.json` Jest block covers `**/*.(t|j)s` with output `server/coverage`. E2E Jest config excludes `*.spec.ts`, `*.e2e.spec.ts`, and `main.ts` from coverage collection.

**View Coverage:**

```bash
cd server && npx jest --coverage
cd server && npm run test:cov   # uses jest-e2e.json — E2E coverage only
```

## Test Types

**Unit Tests:**

- **Server:** Isolated classes with mocked repositories/services — `*.spec.ts` under `server/src/`.
- **Web:** Pure functions and utilities — Vitest `unit` project, `environment: 'node'`.

**Integration Tests:**

- **Server E2E:** Supertest against running `INestApplication`, real TypeORM/SQLite, mocked Docker — `server/test/e2e/*.e2e.spec.ts`.

**E2E / Browser:**

- **Web:** Storybook + Vitest browser project (Playwright, Chromium) in `web/vite.config.ts` — not the same as full product E2E against a deployed stack; no separate Playwright app suite under `web/` beyond Storybook integration.

**Electron:**

- `electron/package.json` has no `test` script — **Not applicable** for automated tests in-repo.

## Common Patterns

**Async Testing:**

```typescript
it('should return initial empty settings', async () => {
  const response = await authGet('/api/settings').expect(200);
  expect(response.body).toHaveProperty('success', true);
});
```

**Error Testing:**

- Assert HTTP status with supertest `.expect(4xx)`; for unit tests, `expect(() => ...).toThrow()` or rejected promises where applicable.

---

*Testing analysis: 2026-04-10*
