---
phase: 03-workspace-api-file-explorer
reviewed: 2026-04-17T00:00:00Z
gap_closure_reviewed: 2026-04-17T11:35:00Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - server/src/interactors/sessions/workspace/workspace.routes.ts
  - server/src/interactors/sessions/workspace/list-directory-response.dto.ts
  - server/src/interactors/sessions/workspace/file-content-response.dto.ts
  - server/src/interactors/sessions/workspace/workspace-file-listing.service.ts
  - server/src/interactors/sessions/workspace/workspace-file-index.service.ts
  - server/src/interactors/sessions/workspace/workspace.interactor.ts
  - server/src/interactors/sessions/workspace/workspace.controller.ts
  - server/src/interactors/sessions/workspace/workspace.module.ts
  - web/src/api/workspace.api.ts
  - server/src/interactors/sessions/session.routes.ts
  - server/src/interactors/sessions/sessions.module.ts
  - server/src/domain/settings/general-settings.embedded.ts
  - server/src/domain/settings/settings.entity.ts
  - web/src/api/types.ts
  - web/src/hooks/useFileTree.ts
  - web/src/hooks/useFileContent.ts
  - web/src/components/session/files/FileIcon.tsx
  - web/src/components/session/files/FileTreeItem.tsx
  - web/src/components/session/files/FileTree.tsx
  - web/src/components/session/files/FilePreviewHeader.tsx
  - web/src/components/session/files/FilePreview.tsx
  - web/src/components/session/files/FilesPanel.tsx
  - web/src/pages/SessionDetails.tsx
  - web/src/hooks/useFileIndex.ts
  - web/src/components/chat/FileAutocomplete.tsx
  - web/src/components/chat/ChatInput.tsx
  - web/src/components/chat/ChatPanel.tsx
  - web/src/pages/settings/GeneralSettings.tsx
gap_closure_files_reviewed:
  - server/src/interactors/settings/update-settings/update-settings-request.dto.ts
  - server/src/interactors/settings/update-settings/update-settings.interactor.ts
  - server/src/interactors/settings/get-settings/get-settings-response.dto.ts
  - server/test/e2e/settings.e2e.spec.ts
  - web/src/pages/SessionDetails.tsx
findings:
  critical: 0
  warning: 6
  info: 10
  total: 16
gap_closure_findings:
  critical: 0
  warning: 0
  info: 1
  total: 1
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-04-17
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

Reviewed the workspace API (file tree/content/index endpoints) plus the web file-explorer, Shiki preview, and `@`-mention file autocomplete wiring. Overall implementation is sound:

- Path-traversal guard in `WorkspaceFileListingService.resolveSafePath` is correct (uses `path.resolve` + `startsWith(base + sep)`), and there is no shell invocation — all commands go through `docker exec` with an `argv` array (`Cmd: cmd`), so classic shell injection is not possible.
- Resolved paths always live under `/workspace[/repo]`, so flag-injection into `stat`/`head`/`cat`/`test` is not reachable (the first positional argument always starts with `/workspace/…`).
- Shiki output rendered via `dangerouslySetInnerHTML` is safe in intended use — `highlighter.codeToHtml` HTML-escapes user content.
- React Query keys are well-scoped (`['workspace', 'files' | 'content' | 'index', sessionId, ...]`) and loading/error states are handled.

The main concerns are **correctness and resource-use risks at scale**, plus **defense-in-depth gaps** around symlinks and cache lifecycle, and **accessibility gaps** in the tree and autocomplete. No Critical issues found, but several Warnings should be addressed before the explorer is considered production-ready on large repos or with adversarial prompts.

## Warnings

### WR-01: File-index cache leaks entries for removed containers

**File:** `server/src/interactors/sessions/workspace/workspace-file-index.service.ts:16,48`
**Issue:** `fileIndexCache` is a `Map<containerId, FileIndexCacheEntry>` with TTL-based *lookup-time* freshness (`now - cached.timestamp < INDEX_TTL_MS`) but **no eviction policy**. Entries for containers that have been stopped/deleted stay in the Map until `invalidateIndex` is called. `WorkspaceInteractor.invalidateFileIndex` exists but is **never called from any lifecycle hook** (grep confirms no caller; the phase plan acknowledges this as a follow-up). Over time this is an unbounded memory leak — each cache entry can be up to ~10,000 path strings (single-digit MB per container).
**Fix:** Wire `WorkspaceFileIndexService.invalidateIndex(containerId)` into `DeleteSessionInteractor`/`StopSessionInteractor` (the exported service is already available from `WorkspaceModule`), and add a periodic sweep or cap on Map size. Minimal fix:

```typescript
@Injectable()
export class WorkspaceFileIndexService {
  private readonly MAX_CACHE_ENTRIES = 100;

  async getFileIndex(...) {
    // existing logic...
    this.fileIndexCache.set(containerId, { files: capped, timestamp: now });
    if (this.fileIndexCache.size > this.MAX_CACHE_ENTRIES) {
      // evict oldest
      const oldestKey = [...this.fileIndexCache.entries()]
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.fileIndexCache.delete(oldestKey);
    }
    return capped;
  }
}
```
And subscribe to `SessionDeletedEvent` (or call from `DeleteSessionInteractor`) to call `invalidateIndex`.

### WR-02: File-index buildIndex materialises full `git ls-files` output before truncating

**File:** `server/src/interactors/sessions/workspace/workspace-file-index.service.ts:60-71`
**Issue:** `execInContainer(['git', 'ls-files', …])` buffers the entire stdout into memory (`Buffer.concat` in `DockerContainerExecService`). For a monorepo with hundreds of thousands of files, this can be tens/hundreds of MB. The code then splits into a string array and only afterwards slices to `MAX_INDEX_SIZE = 10_000`. The bound is enforced too late — peak memory is proportional to repo size, not cache size.
**Fix:** Either (a) pass a `head -n 20000` pipeline so the container truncates output (but this requires a shell so use `sh -c`), or (b) impose a stdout-size cap in `DockerContainerExecService` and document it, or (c) pre-check file count:

```typescript
const countResult = await this.execService.execInContainer(
  containerId,
  ['sh', '-c', 'git ls-files --cached --others --exclude-standard | wc -l'],
  workingDir,
);
// If count > threshold, warn and take a smaller sample or return empty
```
Simplest mitigation: pipe through `head`:
```typescript
['sh', '-c', `git ls-files --cached --others --exclude-standard | head -n ${MAX_INDEX_SIZE * 2}`]
```

### WR-03: Symlinks inside the workspace are followed without revalidation

**File:** `server/src/interactors/sessions/workspace/workspace-file-listing.service.ts:110-123,172-209,360-389`
**Issue:** `resolveSafePath` validates the **requested** path is under `workspaceBase`, but all subsequent filesystem calls (`stat`, `cat`, `head`, `test -d`, `find`) follow symlinks by default. A symlink at `/workspace/repo/link → /etc/shadow` (or a secret mount like `/root/.claude/…`) would pass the traversal check and then be read/streamed back. While the user already has terminal access to the container and can read the same data via shell, the file API should not be a simpler exfiltration path — especially given agents can be prompted to create symlinks. Similarly, `test -d` on a symlink to a directory outside the workspace reports it as a directory.
**Fix:** Either resolve symlinks with `realpath` before validating, or pass `-P` / `-L`-disabling flags:

```typescript
// Option A: re-check resolved symlink target
const realpathResult = await this.execService.execInContainer(
  containerId,
  ['readlink', '-f', resolved],
  workingDir,
);
const realPath = realpathResult.stdout.trim();
if (!realPath.startsWith(normalizedBase + path.sep) && realPath !== normalizedBase) {
  throw new BadRequestException('Path traversal via symlink');
}

// Option B: refuse to follow symlinks in stat/find
// stat -c '%s' → stat --dereference=never or use `stat -L` awareness
// find <dir> -maxdepth 1 -mindepth 1 -not -type l  (skip symlinks)
```

### WR-04: `head -c N` truncation can split a UTF-8 multi-byte character

**File:** `server/src/interactors/sessions/workspace/workspace-file-listing.service.ts:200-224`
**Issue:** For `truncated === true`, the content is cut at a byte offset (`head -c 524288`). If the 524,288th byte is in the middle of a multi-byte UTF-8 sequence, `Buffer.toString('utf8')` produces a U+FFFD replacement character at the end, and Shiki may produce slightly garbled tokens on the last line. More importantly, for any character-oriented diff/search on the client, the byte-truncation is silently lossy.
**Fix:** After decoding, drop any trailing replacement char / incomplete sequence, or trim to the last newline:

```typescript
let content = result.stdout;
if (truncated) {
  const lastNewline = content.lastIndexOf('\n');
  if (lastNewline > 0) {
    content = content.slice(0, lastNewline);
  }
}
return new FileContentResponseDto(relative, content, size, truncated, language, false);
```

### WR-05: File tree and autocomplete lack keyboard navigation and ARIA roles

**File:** `web/src/components/session/files/FileTree.tsx:103-134`, `web/src/components/session/files/FileTreeItem.tsx:39-97`, `web/src/components/chat/FileAutocomplete.tsx:115-232`
**Issue:** Multiple accessibility problems:
- `FileTreeItem` is a plain `<Box onClick>` with `userSelect: 'none'` — no `role`, no `tabIndex`, no `onKeyDown`. Keyboard-only users cannot expand folders or select files. It has no `aria-expanded` / `aria-selected` / `aria-level`, so screen readers cannot announce state.
- `FileTree` has no wrapping `role="tree"`.
- `FileAutocomplete` relies on a `keydown` listener attached to `anchorEl` (the textarea) for Arrow/Enter/Tab navigation, but the popup itself has no `role="listbox"` or `role="option"` on the items, and no `aria-activedescendant` on the input. Screen readers will not announce the highlighted option.
**Fix:** Add ARIA semantics + keyboard handling. Minimal changes:

```tsx
// FileTreeItem.tsx
<Box
  role="treeitem"
  aria-level={depth + 1}
  aria-expanded={isDirectory ? expanded : undefined}
  aria-selected={selected}
  tabIndex={selected ? 0 : -1}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  // ...
>
```
```tsx
// FileTree.tsx — wrap the outer Box
<Box role="tree" aria-label="Workspace files" /* ... */>
```
```tsx
// FileAutocomplete.tsx — add listbox/option roles + aria-activedescendant on the anchor input
<Box ref={listRef} role="listbox" id="file-autocomplete-listbox" /* ... */>
  {filtered.map((item, index) => (
    <Box
      key={item.path}
      role="option"
      id={`file-option-${index}`}
      aria-selected={index === selectedIndex}
      /* ... */
    >
```
Also set `aria-activedescendant={…}` and `aria-controls="file-autocomplete-listbox"` on the textarea in `ChatInput.tsx` when the popup is open.

### WR-06: `invalidateFileIndex` on `WorkspaceInteractor` is unreachable dead code

**File:** `server/src/interactors/sessions/workspace/workspace.interactor.ts:75-81`
**Issue:** `invalidateFileIndex(sessionId)` is defined and exported but no controller route, gateway handler, or event subscriber calls it. The only invalidation mechanism is the 60s TTL check inside `getFileIndex`. Consequence: users who create/rename/delete files via the agent won't see updates in `@`-mention until the TTL expires; and on session deletion the cache entry leaks (see WR-01). This is tracked as a follow-up in the phase plan but should at least be wired to session delete to avoid leaks.
**Fix:** Either remove the method (and stop exporting `WorkspaceFileIndexService`) or, preferably, wire it into:
- `DeleteSessionInteractor` → `invalidateFileIndex` (or `clearAllIndexes`-on-delete if multiple caches share a container ID).
- The session gateway's `chat.complete` / git-write event handler — call `invalidateIndex(containerId)` so fresh file lists surface within seconds.

## Info

### IN-01: Duplicated route definitions between `SessionRoutes` and `WorkspaceRoutes`

**File:** `server/src/interactors/sessions/session.routes.ts:12-14`, `server/src/interactors/sessions/workspace/workspace.routes.ts:1-5`
**Issue:** `SessionRoutes.WORKSPACE_FILES`, `WORKSPACE_FILE_CONTENT`, `WORKSPACE_FILE_INDEX` are defined in one file, and identical paths re-declared in `WorkspaceRoutes`. Only `WorkspaceRoutes` is actually referenced by `WorkspaceController`. The `SessionRoutes` entries are unused and can drift.
**Fix:** Delete the three `WORKSPACE_*` entries from `SessionRoutes`, or have `WorkspaceRoutes` re-export them. Prefer a single source of truth per route group.

### IN-02: Unused `Logger` instances

**File:** `server/src/interactors/sessions/workspace/workspace-file-listing.service.ts:106`, `server/src/interactors/sessions/workspace/workspace.interactor.ts:24`, `server/src/interactors/sessions/workspace/workspace-file-index.service.ts:15` (partially used)
**Issue:** `WorkspaceFileListingService` and `WorkspaceInteractor` declare `private readonly logger = new Logger(…)` but never call it. Dead state.
**Fix:** Either remove the field or add logging at useful points (e.g. log failed `stat`/`cat` exit codes, traversal rejections, or cache misses).

### IN-03: Binary-extension detection is extension-only

**File:** `server/src/interactors/sessions/workspace/workspace-file-listing.service.ts:15-56,168-170`
**Issue:** `binary` is determined solely by a hardcoded `BINARY_EXTENSIONS` set. Extensionless binaries (e.g. a stripped ELF at `bin/tool`) are treated as text and the first 512 KB streamed as UTF-8 garbage. Conversely, extensionless text files (LICENSE, Makefile) are correctly treated as text.
**Fix:** Consider a content-sniffing step on the first N bytes (e.g. detect `\0` byte in the first chunk → binary) before deciding:

```typescript
if (!binary && size > 0) {
  const probe = await this.execService.execInContainer(
    containerId, ['head', '-c', '4096', resolved], workingDir,
  );
  if (probe.stdout.includes('\0')) {
    return new FileContentResponseDto(relative, '', size, false, language, true);
  }
}
```

### IN-04: `listDirectoryViaFind` fallback only honours root-level `.gitignore`

**File:** `server/src/interactors/sessions/workspace/workspace-file-listing.service.ts:272-312`
**Issue:** When `git ls-files` fails (not a git repo), the `find` fallback reads only the workspace-root `.gitignore` and uses it to filter names in a sub-directory. Nested `.gitignore` files are ignored, and the patterns are applied against bare file names (not repo-relative paths), so patterns like `build/` applied inside a sub-directory won't match.
**Fix:** Either document the limitation or aggregate all `.gitignore`s up the chain. Low priority since this is a fallback path.

### IN-05: `getFileIndex` vulnerable to concurrent-build thundering herd

**File:** `server/src/interactors/sessions/workspace/workspace-file-index.service.ts:20-46`
**Issue:** If two requests hit `getFileIndex` for the same `containerId` after TTL expiry, both will run `buildIndex` in parallel and both write to the cache. Not a correctness issue but wastes a `docker exec` on large repos.
**Fix:** Track in-flight builds:

```typescript
private readonly inFlight = new Map<string, Promise<string[]>>();

async getFileIndex(containerId: string, workingDir: string): Promise<string[]> {
  const cached = this.fileIndexCache.get(containerId);
  if (cached && Date.now() - cached.timestamp < INDEX_TTL_MS) return cached.files;
  const existing = this.inFlight.get(containerId);
  if (existing) return existing;
  const promise = this.buildAndCache(containerId, workingDir).finally(() => {
    this.inFlight.delete(containerId);
  });
  this.inFlight.set(containerId, promise);
  return promise;
}
```

### IN-06: `FilePreview` re-runs highlighter on every `data` object identity change

**File:** `web/src/components/session/files/FilePreview.tsx:125-164`
**Issue:** The effect depends on `data` (React Query re-emits a new object ref on background refetch even when content is unchanged), causing an unnecessary `codeToHtml` call. Not a correctness issue.
**Fix:** Depend on a stable signature, e.g.:

```tsx
React.useEffect(() => {
  /* ... */
}, [data?.path, data?.content, data?.language, data?.binary]);
```

### IN-07: `buildIdeUrl` does not URL-encode the host path

**File:** `web/src/components/session/files/FilePreview.tsx:53-89`
**Issue:** Paths containing spaces, `#`, `?`, or non-ASCII characters produce malformed IDE protocol URLs (`cursor://file//Users/My Dir/file.ts`). Cursor/VSCode may still accept them, but it's fragile.
**Fix:** Encode each path segment:

```tsx
const encodedHostPath = hostPath.split('/').map(encodeURIComponent).join('/');
return `${ideCommand}://file${encodedHostPath.startsWith('/') ? '' : '/'}${encodedHostPath}`;
```

### IN-08: `FileAutocomplete` treats trailing-`/` heuristic as folder detection

**File:** `web/src/components/chat/FileAutocomplete.tsx:27`
**Issue:** `isFolder` checks `path.endsWith('/')`, but `workspaceApi.getFileIndex` returns `git ls-files` output, which contains only files (no trailing slash on directories because directories aren't listed). So the folder icon will never render. Harmless but dead code path, and the empty "Files" label + absent folders is slightly misleading.
**Fix:** Either remove the folder branch, or include top-level directory stems derived from the file list:

```typescript
const dirs = new Set(files.flatMap(f => {
  const parts = f.split('/').slice(0, -1);
  return parts.map((_, i) => parts.slice(0, i + 1).join('/') + '/');
}));
```
(This would materially change behaviour; leaving as info only.)

### IN-09: `WorkspaceController.handleError` swallows non-`HttpException` errors into `BadRequestException`

**File:** `server/src/interactors/sessions/workspace/workspace.controller.ts:146-164`
**Issue:** Any non-`HttpException` failure (e.g. Docker engine unreachable, TypeORM failure) is re-thrown as `BadRequestException(message)`, which is semantically wrong (400 implies client error) and masks infrastructure failures. The global `HttpExceptionFilter` would otherwise correctly surface these as 500.
**Fix:** Let non-HTTP errors propagate so the global filter maps them to 500:

```typescript
private handleError(operation: string, sessionId: string, error: unknown): never {
  this.logger.error(`Workspace ${operation} failed`, {
    sessionId,
    error: error instanceof Error ? error.message : String(error),
  });
  if (error instanceof HttpException) throw error;
  throw error; // let global filter handle it
}
```

---

_Reviewed: 2026-04-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

---

# Gap Closure Review (03-04)

**Reviewed:** 2026-04-17T11:35:00Z
**Depth:** standard
**Scope:** 5 files modified by Plan 03-04 (ideCommand persistence chain + cross-platform hotkey)
**Gap Closure Status:** clean

## Summary

Reviewed the five-file delta from Plan 03-04, which closes the two UAT gaps recorded in `03-UAT.md` (Test 7 hotkey on macOS, Test 8 ideCommand persistence).

All five changes are minimal, focused, and internally consistent with the patterns already established in this phase (plans 03-01 through 03-03):

- **`update-settings-request.dto.ts`** — `MaxLength` import added; `ideCommand?: string` field declared with `@IsOptional @IsString @MaxLength(100) @ApiProperty({ required: false, description: ... })`. Bound (100) matches the `varchar(100)` column in `GeneralSettings` (verified against `server/src/domain/settings/general-settings.embedded.ts:20`) — a correct input-contract parity.
- **`update-settings.interactor.ts`** — single-line `ideCommand: request.ideCommand,` added to the `currentSettings.update({...})` object literal at the same position in the field list as the other general settings. Empty-string-to-null normalisation is correctly delegated to `Settings.update()` (verified at `settings.entity.ts:100-101`: `data.ideCommand || null`).
- **`get-settings-response.dto.ts`** — `ideCommand?: string | null` added with `@ApiProperty({ required: false, nullable: true, ... })`, placed next to `skillsDirectory` (good grouping). `fromDomain` uses `?? null` (not `|| null`) to stay byte-identical to the domain value for legitimate non-empty strings — matches the pattern used elsewhere in this DTO.
- **`settings.e2e.spec.ts`** — new `should persist and round-trip ideCommand` test is well-structured: covers PUT→GET round-trip AND empty-string-clears-to-null, using the same `authPut`/`authGet` helpers and `afterEach: clearDatabase()` fixture as the existing cases. Assertions target `data.ideCommand` which is valid because `SettingsController.updateSettings` wraps the interactor's return value in `GetSettingsResponseDto.fromDomain(...)` (verified at `settings.controller.ts:67-69`).
- **`SessionDetails.tsx`** — single-line change to `useHotkeys('mod+`, ctrl+`', ...)`. Handler body, `tabCycle` array, `enableOnFormTags`/`enableOnContentEditable` options are byte-identical. No new imports needed.

Security posture is preserved: the `ideCommand` value is never executed server-side (per the Plan 03 threat model, T-03-09 mitigation is exclusively "server doesn't execute the value" + `MaxLength(100)` bound). The value is only consumed client-side to build `cursor://file/...` protocol URLs in `FilePreview.buildIdeUrl` — there is no new code path from the persisted value to a shell invocation.

**No Critical or Warning findings in the 03-04 delta.** One Info-level testing gap below.

## Info

### IN-10: `MaxLength(100)` upper bound on `ideCommand` is not regression-tested

**File:** `server/test/e2e/settings.e2e.spec.ts:181-201`
**Issue:** The new `should persist and round-trip ideCommand` test covers the positive path (`'cursor'` round-trip) and the clear-to-null path (empty string), but does not verify that a value > 100 characters is rejected with a 400. If someone later removes `@MaxLength(100)` from the DTO (or bumps the column length without updating the DTO), this drift would silently pass CI. Given that the bound was explicitly added to match the `varchar(100)` column as a T-03-09 Tampering mitigation, it is worth pinning with a test.
**Fix:** Add one assertion inside the existing `describe('PUT /api/settings', ...)` block (co-located with the new test):

```ts
it('should reject ideCommand longer than 100 characters', async () => {
  const response = await authPut('/api/settings')
    .send({ ideCommand: 'a'.repeat(101) })
    .expect(400);

  expect(response.body.success).toBe(false);
  expect(JSON.stringify(response.body.error.message)).toContain('ideCommand');
});
```

Low priority — the existing `should reject unknown fields` case already proves the global `ValidationPipe` is wired, and `class-validator`'s `@MaxLength` is library-tested. This is pure drift-detection.

## Notes (not findings)

- **Field ordering in `UpdateSettingsRequest`.** `ideCommand` is appended at the bottom of the DTO (after `idleTimeoutMinutes`) rather than grouped with the other general-settings fields (e.g. next to `skillsDirectory`). The placement matches the plan's explicit instruction and is acceptable — the read-path DTO (`GetSettingsResponseDto`) correctly groups it near `skillsDirectory`, which is where user-facing API discovery (Swagger) matters most.
- **Hotkey double-fire on Windows/Linux.** On Windows/Linux, `Ctrl+`` matches both the `mod+`` registration (because `mod` aliases `Ctrl` on non-mac) and the `ctrl+`` registration, but `react-hotkeys-hook` v5 routes a single keypress through a single handler invocation per comma-separated accelerator set — the handler is registered once and matched once per event. No double-cycle is expected. The UAT re-run will confirm empirically; noted here only so future maintainers know this was considered.
- **No server-side execution surface for `ideCommand`.** Re-verified: the value is never passed to `exec`, `spawn`, `dockerode`, or any shell interpolation. It flows domain → read DTO → React component → `window.location.href = 'cursor://file/...'` only. No CR-grade concern.

## Gap Closure Verdict

All acceptance criteria from `03-04-PLAN.md` are met by the code as written. The delta is tight, uses existing patterns, and the new e2e regression pins all three server-side fix points with a single round-trip assertion. The hotkey fix is one line and preserves every other binding invariant.

**Gap closure review status: clean (1 Info item, 0 Warnings, 0 Critical).**

Phase-level status remains `issues_found` because the pre-gap Warnings (WR-01 through WR-06, the file-index cache + symlink + ARIA concerns) are unchanged — none are in the 03-04 scope and none were regressed by it.

---

_Gap Closure Reviewed: 2026-04-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
