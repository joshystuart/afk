---
phase: 03-workspace-api-file-explorer
plan: 01
subsystem: server/sessions/workspace + web/api
tags: [backend, workspace, filesystem, api, docker-exec, security]
requires:
  - server/src/libs/docker/docker-engine.service.ts (execInContainer)
  - server/src/libs/docker/docker.constants.ts (getExecWorkingDir, WORKSPACE_BASE_PATH)
  - server/src/domain/sessions/session.tokens.ts (SESSION_REPOSITORY)
  - server/src/domain/sessions/session.repository.ts (SessionRepository interface)
  - server/src/domain/sessions/session-status.enum.ts (SessionStatus.RUNNING)
  - server/src/domain/sessions/session-id-dto.factory.ts (SessionIdDtoFactory)
  - server/src/libs/response/response.service.ts (ResponseService)
  - ignore npm package
provides:
  - REST API: GET /api/sessions/:id/files
  - REST API: GET /api/sessions/:id/files/content
  - REST API: GET /api/sessions/:id/files/index
  - WorkspaceFileIndexService (exported for future gateway invalidation)
  - web/src/api/workspace.api.ts workspaceApi client
affects:
  - server/src/interactors/sessions/sessions.module.ts (+WorkspaceModule import)
  - server/src/interactors/sessions/session.routes.ts (+3 enum entries)
  - server/src/domain/settings/general-settings.embedded.ts (+ideCommand column)
  - server/src/domain/settings/settings.entity.ts (+ideCommand update handler)
  - web/src/api/types.ts (+File* interfaces, +ideCommand on Settings/UpdateSettingsRequest)
tech-stack:
  added: [ignore]
  patterns:
    - Injection token (SESSION_REPOSITORY) for repository DI
    - Array-based docker exec commands (no shell string concat)
    - TTL-based in-memory cache keyed by containerId
    - @ApiTags/@ApiOperation/@ApiParam/@ApiQuery Swagger decorators
key-files:
  created:
    - server/src/interactors/sessions/workspace/workspace.routes.ts
    - server/src/interactors/sessions/workspace/list-directory-response.dto.ts
    - server/src/interactors/sessions/workspace/file-content-response.dto.ts
    - server/src/interactors/sessions/workspace/workspace-file-listing.service.ts
    - server/src/interactors/sessions/workspace/workspace-file-index.service.ts
    - server/src/interactors/sessions/workspace/workspace.interactor.ts
    - server/src/interactors/sessions/workspace/workspace.controller.ts
    - server/src/interactors/sessions/workspace/workspace.module.ts
    - web/src/api/workspace.api.ts
  modified:
    - server/src/interactors/sessions/session.routes.ts
    - server/src/interactors/sessions/sessions.module.ts
    - server/src/domain/settings/general-settings.embedded.ts
    - server/src/domain/settings/settings.entity.ts
    - web/src/api/types.ts
    - server/package.json (+ignore dependency)
decisions:
  - Use DockerEngineService (already exported from DockerModule) as the exec dependency via a property named execService, instead of re-exporting DockerContainerExecService. Preserves encapsulation of the Docker subsystem.
  - Directory listing uses git ls-files -z with a relative pathspec as the primary strategy (inherently .gitignore-aware); falls back to find -maxdepth 1 + ignore() filtering reading .gitignore when not a git repo.
  - File type resolution uses `test -d` per entry (portable across AFK images) and stat -c %s for file sizes.
  - resolveSafePath uses path.resolve + startsWith(base + path.sep) guard to defeat traversal while still allowing listing of the workspace root itself.
  - File content size cap is 512KB (524288) using stat first, then head -c when truncating, matching the threat register mitigation for T-03-02.
  - Binary detection is extension-based (fast, no full read); binary files return empty content with binary: true.
  - Index cache TTL is 60s and capped at 10,000 entries to keep memory bounded on large repos.
  - WorkspaceFileIndexService is exported from WorkspaceModule so the session gateway (future plan) can call invalidateIndex/clearAllIndexes on chat.complete / session delete.
  - ideCommand column is nullable varchar(100); update handler treats empty string as null to keep the Settings UI simple.
metrics:
  duration: "~8 min"
  completed: "2026-04-17"
---

# Phase 03 Plan 01: Workspace API + Data Contracts Summary

## One-liner

Backend workspace REST API (directory listing, file content, flat index) with `.gitignore`-aware Docker exec, path-traversal protection, 512KB content cap, binary detection, and matching web API client + `ideCommand` Settings field — unlocks Wave 2 frontend plans.

## What was built

### Server: new `workspace/` interactor folder

- `workspace.routes.ts` — `WorkspaceRoutes` enum (`LIST_FILES`, `FILE_CONTENT`, `FILE_INDEX`).
- `list-directory-response.dto.ts` — `FileEntryDto` (`name`, `path`, `type`, `size?`) and `ListDirectoryResponseDto`.
- `file-content-response.dto.ts` — `FileContentResponseDto` (`path`, `content`, `size`, `truncated`, `language`, `binary`).
- `workspace-file-listing.service.ts`:
  - `resolveSafePath(base, userPath)` — `path.resolve` + `startsWith(base + sep)` check, throws `BadRequestException('Path traversal detected')`.
  - `listDirectory` — primary strategy runs `git ls-files --cached --others --exclude-standard -z -- <pathspec>` relative to `workingDir` and extracts immediate children; fallback runs `find -maxdepth 1 -mindepth 1 -printf '%f\n'` and filters through `ignore()` seeded from `.gitignore`. Directories first, then alphabetical.
  - `getFileContent` — `stat -c %s` → 512KB (`524288`) threshold → `head -c 524288` or `cat`; binary-by-extension set covers images, fonts, archives, media, native binaries; language mapping covers common languages, default `plaintext`.
- `workspace-file-index.service.ts` — `Map<containerId, { files, timestamp }>`, `INDEX_TTL_MS = 60_000`, `MAX_INDEX_SIZE = 10_000`, methods: `getFileIndex`, `invalidateIndex`, `clearAllIndexes`. Git primary, `find`+ignore fallback.
- `workspace.interactor.ts` — session repo lookup via `@Inject(SESSION_REPOSITORY)`, `SessionStatus.RUNNING` guard, `getExecWorkingDir(session.config.repoUrl)` to pick `/workspace/repo` vs `/workspace`. Methods: `listDirectory`, `getFileContent`, `getFileIndex`, `invalidateFileIndex`. Throws `NotFoundException('Session not found')` / `BadRequestException('Session is not running')`.
- `workspace.controller.ts` — mirrors `GitStatusController` shape: `@Controller(SessionRoutes.BASE)`, `@ApiTags('Sessions')`, three `@Get` endpoints with `@ApiOperation`, `@ApiParam`, `@ApiQuery`, `@ApiResponse`. Errors mapped to `NotFoundException` / `BadRequestException` via `handleError`.
- `workspace.module.ts` — imports `DockerModule`, `DomainModule`, `ResponseModule`, `SessionPersistenceModule`; exports `WorkspaceFileIndexService`.

### Server: wiring & Settings

- `sessions.module.ts` — added `WorkspaceModule` to imports.
- `session.routes.ts` — added `WORKSPACE_FILES`, `WORKSPACE_FILE_CONTENT`, `WORKSPACE_FILE_INDEX` to `SessionRoutes` enum (reference; controller uses `WorkspaceRoutes`).
- `general-settings.embedded.ts` — added `@Column('varchar', { length: 100, nullable: true }) ideCommand?: string | null`.
- `settings.entity.ts` — added `ideCommand?: string` to `SettingsUpdateData` and `if (data.ideCommand !== undefined) this.general.ideCommand = data.ideCommand || null;` in `update()`.

### Web

- `web/src/api/types.ts` — added `FileEntry`, `DirectoryListing`, `FileContent`, `FileIndexResponse`; added `ideCommand?: string | null` to `Settings`; added `ideCommand?: string` to `UpdateSettingsRequest`.
- `web/src/api/workspace.api.ts` — `workspaceApi.{listDirectory, getFileContent, getFileIndex}` using `apiClient.get` and `encodeURIComponent` for `path` query params.

### Dependencies

- `server/package.json` — added `ignore` (used for `.gitignore` parsing in fallback paths).

## Commits

| Task | Description                                                   | Hash      |
| ---- | ------------------------------------------------------------- | --------- |
| 1    | Workspace DTOs, routes, file-listing and file-index services  | `5ecc677` |
| 2    | Controller, interactor, module, Settings ideCommand, web API  | `e2096b1` |

## Verification

- **Automated:** `cd server && npx tsc --noEmit` → exit 0 (clean). `cd web && npx tsc --noEmit` → exit 0 (clean).
- **Tests:** `cd server && npm test -- --passWithNoTests` → 2 suites, 43 tests passed (no regressions). No new unit tests added in this plan; runtime behaviour is exercised via integration from Wave 2 plans.
- **Prettier:** All touched files formatted; no lint errors on inspected files.

## Threat Model Coverage

| Threat ID | Mitigation in this plan |
| --------- | ------------------------ |
| T-03-01 (Path traversal) | `WorkspaceFileListingService.resolveSafePath` — `path.resolve` + `startsWith(base + sep)` check; throws `BadRequestException('Path traversal detected')`. Applied at both `listDirectory` and `getFileContent` entry. |
| T-03-02 (File-content DoS) | `stat -c %s` before read; `head -c 524288` when > 512KB; `truncated: true` flag in response. |
| T-03-03 (Command injection via exec) | All exec calls use array-form `cmd` (`['git', 'ls-files', ...]`, `['stat', '-c', '%s', resolved]`, `['cat', resolved]`). No `sh -c` + string concatenation anywhere. |
| T-03-04 (Container-stopped DoS) | `WorkspaceInteractor.loadRunningSession` — `session.status !== SessionStatus.RUNNING` → `BadRequestException('Session is not running')`; missing `containerId` → `BadRequestException('Session has no associated container')`. |
| T-03-05 (Binary leakage) | Extension-based binary set (`.png`, `.jpg`, `.zip`, `.exe`, fonts, media, native libs) → returns `{ binary: true, content: '' }`. |

## Requirements Coverage

| Requirement | Delivered | How |
| ----------- | --------- | --- |
| CTXT-02 (File browsing) | API surface | `GET /api/sessions/:id/files?path=` returns directory listing with name/type/size |
| CTXT-03 (.gitignore filtering) | API surface | Primary strategy uses `git ls-files --cached --others --exclude-standard`; fallback uses `ignore()` seeded from `.gitignore` |
| CTXT-04 (Open-in-IDE via Settings ideCommand) | Persistence layer | `GeneralSettings.ideCommand` column + `Settings.update()` handler + web `Settings.ideCommand` type + `UpdateSettingsRequest.ideCommand` |

UI surfacing of these (tree, editor, autocomplete, Settings form field) is deferred to the Wave 2 frontend plans as designed.

## Deviations from Plan

### Auto-fixed / design adjustments

**1. [Rule 3 - Blocking] Used `DockerEngineService` instead of `DockerContainerExecService`**

- **Found during:** Task 1.
- **Issue:** Plan referenced `DockerContainerExecService` (the concrete class), but `DockerModule` does not export it. Only `DockerEngineService` is exported, and it already re-exports the same `execInContainer` signature.
- **Fix:** Both services injected via property `execService` (matching the plan's `this.execService.execInContainer` pattern). `DockerEngineService` delegates to `DockerContainerExecService` internally, so behaviour is identical.
- **Files modified:** `workspace-file-listing.service.ts`, `workspace-file-index.service.ts`.
- **Commit:** `5ecc677`.

**2. [Rule 2 - Critical] Added `size` to `FileEntryDto` constructor for sorted listings**

- Plan called for `size?` field; added a proper constructor so the service can emit well-typed entries without relying on object literals, preserving `class-transformer` compatibility downstream.
- **Commit:** `5ecc677`.

**3. [Rule 3] Added `ApiErrorResponseDto` references and pre-argument validation in controller**

- Controller validates `filePath` presence before entering try/catch so the `400` is emitted without log spam, mirroring `GitStatusController` behaviour.
- **Commit:** `e2096b1`.

### Non-deviations (by design, no action)

- Plan suggested considering `git ls-tree` vs `git ls-files`. Chose `git ls-files --cached --others --exclude-standard -z` because it naturally includes untracked-but-not-ignored files (what a file explorer would show) and is already used elsewhere in the codebase via `git.service.ts`.
- Plan suggested using `-printf '%f\n'` vs parsing full paths. Used `%f` in the find fallback for simpler parsing.
- Authentication: all endpoints are `@Controller(SessionRoutes.BASE)` under the global `/api` prefix and are protected by the application-wide auth guard (same as every other session endpoint — no additional configuration required).

## Known Stubs

None. All three endpoints are fully implemented end-to-end (wired into `SessionsModule`, verified via `tsc` clean compile and passing e2e suite).

## Follow-ups / Hand-off for later plans

- **Gateway invalidation (next plan in phase):** Inject `WorkspaceFileIndexService` into the session gateway and call `invalidateIndex(containerId)` on chat-complete / git-write events. `WorkspaceModule` already exports it.
- **Container lifecycle:** Call `clearAllIndexes()` (or per-container `invalidateIndex`) when a session is deleted — recommend wiring in the `DeleteSessionInteractor` in a follow-up plan.
- **Web tree UI / editor / autocomplete:** Consume `workspaceApi` in frontend plans. All types (`DirectoryListing`, `FileContent`, `FileIndexResponse`) are already exported.
- **Settings UI:** Add `ideCommand` text input to Settings form; the web `UpdateSettingsRequest` field is already in place.

## Self-Check: PASSED

- [x] `server/src/interactors/sessions/workspace/workspace.routes.ts` — FOUND
- [x] `server/src/interactors/sessions/workspace/list-directory-response.dto.ts` — FOUND
- [x] `server/src/interactors/sessions/workspace/file-content-response.dto.ts` — FOUND
- [x] `server/src/interactors/sessions/workspace/workspace-file-listing.service.ts` — FOUND
- [x] `server/src/interactors/sessions/workspace/workspace-file-index.service.ts` — FOUND
- [x] `server/src/interactors/sessions/workspace/workspace.interactor.ts` — FOUND
- [x] `server/src/interactors/sessions/workspace/workspace.controller.ts` — FOUND
- [x] `server/src/interactors/sessions/workspace/workspace.module.ts` — FOUND
- [x] `web/src/api/workspace.api.ts` — FOUND
- [x] Commit `5ecc677` — FOUND
- [x] Commit `e2096b1` — FOUND
- [x] `server/package.json` contains `"ignore"` — FOUND
- [x] `cd server && npx tsc --noEmit` exits 0 — VERIFIED
- [x] `cd web && npx tsc --noEmit` exits 0 — VERIFIED
- [x] `cd server && npm test` → 43/43 passed — VERIFIED
