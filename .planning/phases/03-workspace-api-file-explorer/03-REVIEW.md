---
phase: 03-workspace-api-file-explorer
reviewed: 2026-04-17T00:00:00Z
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
findings:
  critical: 0
  warning: 6
  info: 9
  total: 15
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
