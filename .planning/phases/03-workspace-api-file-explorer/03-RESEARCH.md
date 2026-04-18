# Phase 3: Workspace API & File Explorer - Research

**Researched:** 2026-04-12
**Domain:** File browsing UI, REST API for container filesystem, autocomplete UX, syntax highlighting
**Confidence:** HIGH

## Summary

This phase adds a file explorer tab, `@`-mention autocomplete, and open-in-IDE support to the session UI. The server already has the foundational capability — `DockerContainerExecService.execInContainer()` can run arbitrary commands inside containers. The implementation layers a REST API for directory listing and file content retrieval on top of this, with `.gitignore` filtering via `git ls-files` (primary) and the `ignore` npm package (fallback for non-git workspaces). The web UI adds a new "Files" tab using the existing tab infrastructure from Phase 1, a tree component built with MUI primitives, a file preview pane with Shiki-based syntax highlighting, and an `@`-mention autocomplete dropdown modeled on the existing `SkillAutocomplete` component.

No external services or databases are needed — all file operations are container-local via `docker exec`. The `Settings` entity gains a single `ideCommand` field for the open-in-IDE feature. The `SessionConfigDto` already carries `hostMountPath` which provides the container→host path mapping.

**Primary recommendation:** Use `git ls-files` inside containers as the primary file listing mechanism (already .gitignore-aware), fall back to `find` + the `ignore` npm package for non-git workspaces, and use Shiki with fine-grained bundles for syntax highlighting in the file preview.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** File explorer is a new tab in the session tab bar: Chat | Terminal | Files — consistent with Phase 1's extensible tab pattern
- **D-02:** VS Code-style indented tree with expand/collapse folders, file type icons, and monospace font
- **D-03:** Split view layout — file tree on the left, read-only file content preview on the right when a file is clicked
- **D-04:** Files tab component stays mounted but hidden when viewing other tabs (consistent with Phase 1 D-13 terminal behavior)
- **D-05:** `@` character triggers file autocomplete only after a space (word boundary) — avoids false positives with email addresses or other `@` usage
- **D-06:** Fuzzy search across the full relative path — partial path segment matching like VS Code's Cmd+P
- **D-07:** Each suggestion shows: file/folder name (bold) + relative path (dimmed), like VS Code quick open
- **D-08:** Both files and folders appear in autocomplete — `@src/components/` references a whole directory as context
- **D-09:** Selection inserts `@path/to/file` as inline text in the prompt — agent receives the file path as context. No styled chips; plain text tag.
- **D-10:** `@`-mention autocomplete coexists with existing `/skill` autocomplete — different trigger characters, different data sources, both in `ChatInput`
- **D-11:** REST API endpoint (e.g., `GET /api/sessions/:id/files?path=/`) for listing directory contents — cacheable, works with React Query
- **D-12:** Lazy loading — each folder expansion fetches its children on demand (fast initial load, avoids large upfront payloads)
- **D-13:** Flat file index built on session connect for `@`-mention autocomplete — cached server-side, refreshed when files change (after agent operations complete or via periodic re-index)
- **D-14:** File listing respects .gitignore rules (CTXT-03 requirement)
- **D-15:** Configurable IDE command in Settings — user sets their editor (code, cursor, zed, etc.), server generates the appropriate protocol URL or command
- **D-16:** "Open in IDE" button appears only in the file preview header — not on individual tree rows
- **D-17:** Button is hidden entirely when workspace mount is not enabled — no disabled state, just absent (clean, no confusion)
- **D-18:** Path mapping: container path → host path derived from the session's workspace mount configuration

### Claude's Discretion

- File listing implementation approach (hybrid `git ls-files` + `find` fallback, or alternative)
- File type icon set and styling (devicon, material file icons, or custom)
- File preview syntax highlighting library (highlight.js, Shiki, Prism, etc.)
- Debounce timing for `@`-mention search requests
- File index refresh strategy details (periodic interval, event-triggered, or both)
- Maximum file size for preview (truncation threshold for large files)
- Empty state design for the Files tab when no files exist or container is not running
- Tree sort order (folders first, then alphabetical — or alphabetical mixed)
- How to display binary files in preview (icon/message, not raw content)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                             | Research Support                                                                                                                                                                 |
| ------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CTXT-01 | User can type `@` in prompt input to get autocomplete suggestions for files and folders | `@`-mention detection in ChatInput (mirrors `findSlashToken` pattern), `FileAutocomplete` component (mirrors `SkillAutocomplete`), flat file index API, Fuse.js for fuzzy search |
| CTXT-02 | User can browse the container workspace file tree in the UI                             | Files tab in session tab bar, tree component with lazy-loaded directory listing via REST API, `execInContainer` for `ls`/`git ls-files`                                          |
| CTXT-03 | File listing respects .gitignore rules                                                  | `git ls-files` is inherently .gitignore-aware; `ignore` npm package provides fallback filtering for non-git workspaces                                                           |
| CTXT-04 | User can open files in their local IDE when workspace mount is enabled                  | IDE command in Settings entity, protocol URL generation (`vscode://file/...`, `cursor://file/...`), hostMountPath→containerPath mapping from SessionConfigDto                    |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose                                               | Why Standard                                                                                                                                                                  |
| ------- | ------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shiki   | 4.0.2   | Syntax highlighting for file preview                  | VS Code-quality highlighting using TextMate grammars; fine-grained bundles keep payload manageable; project already uses VS Code-style UX patterns [VERIFIED: npm registry]   |
| Fuse.js | 7.3.0   | Client-side fuzzy search for `@`-mention autocomplete | Lightweight (~5KB gzipped), zero-dependency, supports weighted fuzzy matching on file paths; used by thousands of projects for exactly this use case [VERIFIED: npm registry] |

### Supporting

| Library | Version | Purpose                                 | When to Use                                                                                                                             |
| ------- | ------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| ignore  | 7.0.5   | Server-side .gitignore pattern matching | Fallback for non-git workspaces where `git ls-files` is unavailable; parse .gitignore and filter `find` output [VERIFIED: npm registry] |

### Alternatives Considered

| Instead of                      | Could Use                         | Tradeoff                                                                                                                                                                                             |
| ------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shiki                           | highlight.js                      | Smaller bundle, faster render, but shallow parsing — less accurate for TypeScript/JSX; project targets VS Code-like feel so accuracy matters                                                         |
| Shiki                           | react-syntax-highlighter (16.1.1) | Wraps Prism/highlight.js; adds React layer but no quality improvement over Shiki; heavier than raw Prism with less accuracy                                                                          |
| Fuse.js                         | match-sorter                      | More opinionated ranking; Fuse.js gives more control over threshold and scoring keys                                                                                                                 |
| Fuse.js                         | Server-side search                | D-13 specifies server-cached flat index sent to client; client-side fuzzy search avoids network round-trips during typing                                                                            |
| MUI TreeView (@mui/x-tree-view) | Custom tree with MUI primitives   | MUI X TreeView is paid/pro for some features and adds a heavy dependency; a custom tree using `Box`/`Collapse` is simpler and follows the project's existing pattern of building with MUI primitives |

**Installation:**

```bash
# Server
cd server && npm install ignore

# Web
cd web && npm install shiki fuse.js
```

**Version verification:** All versions verified against npm registry on 2026-04-12.

## Architecture Patterns

### Recommended Project Structure

```
server/src/interactors/sessions/workspace/
├── workspace.module.ts              # NestJS module
├── workspace.controller.ts          # REST endpoints (list dir, get file, get index)
├── workspace.interactor.ts          # Orchestrates file operations
├── workspace-file-listing.service.ts # git ls-files / find + ignore
├── workspace-file-index.service.ts  # Flat file index cache management
├── workspace.routes.ts              # Route constants
├── list-directory-response.dto.ts   # Response DTO
├── file-content-response.dto.ts     # Response DTO
└── file-index-response.dto.ts       # Response DTO

web/src/components/session/files/
├── FilesPanel.tsx          # Top-level files tab (tree + preview split)
├── FileTree.tsx            # Directory tree with expand/collapse
├── FileTreeItem.tsx        # Single tree row (icon + name + indent)
├── FilePreview.tsx         # Read-only file content with syntax highlighting
├── FilePreviewHeader.tsx   # File name, path, open-in-IDE button
├── FileIcon.tsx            # File type icon mapper

web/src/components/chat/
├── FileAutocomplete.tsx    # @-mention dropdown (mirrors SkillAutocomplete)

web/src/hooks/
├── useFileTree.ts          # React Query hook for directory listing
├── useFileContent.ts       # React Query hook for file content
├── useFileIndex.ts         # Hook for flat file index (from server or WebSocket)

web/src/api/
├── workspace.api.ts        # API client functions for workspace endpoints
```

### Pattern 1: Lazy-Loaded Directory Tree via REST

**What:** Each folder expansion triggers a `GET /api/sessions/:id/files?path=<dir>` call that returns immediate children only. The server runs `docker exec` to list the directory contents inside the container.

**When to use:** Always — this is the core file browsing mechanism (D-12).

**Example:**

```typescript
// Server: workspace.controller.ts
@Get(WorkspaceRoutes.LIST_FILES)
@ApiOperation({ summary: 'List directory contents in session workspace' })
async listDirectory(
  @Param(SessionRouteParams.ITEM_ID) id: string,
  @Query('path') dirPath: string = '/',
): Promise<ApiResponseType<DirectoryListingDto>> {
  const sessionId = this.sessionIdFactory.fromString(id);
  const listing = await this.workspaceInteractor.listDirectory(sessionId, dirPath);
  return this.responseService.success(listing);
}
```

```typescript
// Server: workspace-file-listing.service.ts — core listing logic
async listDirectory(containerId: string, dirPath: string, workingDir: string): Promise<FileEntry[]> {
  // Validate path doesn't escape workspace
  const resolvedPath = this.resolveSafePath(workingDir, dirPath);

  // Try git ls-files first (inherently .gitignore-aware)
  const gitResult = await this.execService.execInContainer(
    containerId,
    ['git', 'ls-files', '--others', '--cached', '--exclude-standard', resolvedPath],
    workingDir,
  );

  if (gitResult.exitCode === 0) {
    return this.parseGitOutput(gitResult.stdout, resolvedPath);
  }

  // Fallback: find + ignore filtering
  return this.listWithFind(containerId, resolvedPath, workingDir);
}
```

### Pattern 2: Server-Cached Flat File Index for Autocomplete

**What:** On session subscribe (or explicit request), server builds a flat list of all files in the workspace via `git ls-files` (or `find`). This index is sent to the client and used for client-side fuzzy search with Fuse.js. The index is refreshed after chat completions (when files are most likely to have changed).

**When to use:** For `@`-mention autocomplete (D-13).

**Example:**

```typescript
// Server: workspace-file-index.service.ts
private fileIndexCache = new Map<string, { files: string[]; timestamp: number }>();

async getFileIndex(containerId: string, workingDir: string): Promise<string[]> {
  const cached = this.fileIndexCache.get(containerId);
  if (cached && Date.now() - cached.timestamp < this.INDEX_TTL_MS) {
    return cached.files;
  }
  const files = await this.buildFileIndex(containerId, workingDir);
  this.fileIndexCache.set(containerId, { files, timestamp: Date.now() });
  return files;
}

async invalidateIndex(containerId: string): void {
  this.fileIndexCache.delete(containerId);
}
```

### Pattern 3: `@`-Mention Detection Alongside `/skill` Detection

**What:** Add a `findAtToken` function in `ChatInput` that detects `@` after a word boundary, parallel to the existing `findSlashToken`. Both autocomplete systems coexist with different trigger characters.

**When to use:** In the `ChatInput.handleChange` handler.

**Example:**

```typescript
// web/src/components/chat/ChatInput.tsx
const findAtToken = (text: string, cursorPos: number) => {
  const before = text.slice(0, cursorPos);
  // @ must follow a space or be at start of line (word boundary per D-05)
  const match = before.match(/(^|\s)@([\w./-]*)$/);
  if (!match) return null;
  return {
    filter: match[2],
    start: before.lastIndexOf('@'),
  };
};
```

### Pattern 4: Open-in-IDE via Protocol URL

**What:** Generate IDE-specific protocol URLs that open files directly. VS Code, Cursor, and Zed all support `editor://file/<path>` protocol URLs. The server maps container paths to host paths using `hostMountPath` from the session config.

**When to use:** When user clicks "Open in IDE" in file preview header, and the session has workspace mount enabled (D-15 through D-18).

**Example:**

```typescript
// Utility for generating IDE URLs
function buildIdeUrl(
  ideCommand: string,
  hostFilePath: string,
  line?: number,
): string {
  const encodedPath = encodeURIComponent(hostFilePath);
  switch (ideCommand) {
    case 'code':
    case 'cursor':
      // vscode://file/<path>:<line> or cursor://file/<path>:<line>
      return `${ideCommand}://file/${hostFilePath}${line ? `:${line}` : ''}`;
    case 'zed':
      return `zed://file/${hostFilePath}${line ? `:${line}` : ''}`;
    default:
      return `${ideCommand}://file/${hostFilePath}`;
  }
}
```

### Anti-Patterns to Avoid

- **Recursive full-tree fetch on mount:** Never fetch the entire directory tree upfront. Workspaces can have tens of thousands of files. Lazy load per D-12.
- **Running `find` without depth limits:** Always limit depth for directory listing (`find -maxdepth 1`). The flat index uses `git ls-files` which is already optimized.
- **Storing file content in the database:** File content is ephemeral container state — always fetch on demand via `docker exec`.
- **Building custom .gitignore parsing:** The `ignore` npm package handles the full git ignore spec correctly. Never hand-roll this.
- **Sharing one autocomplete state for both `/skill` and `@` triggers:** Keep them independent — different state, different dropdowns, different data sources.

## Don't Hand-Roll

| Problem                     | Don't Build                           | Use Instead                                                     | Why                                                                                                                                                     |
| --------------------------- | ------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| .gitignore pattern matching | Custom regex or glob matching         | `ignore` npm package (server) + `git ls-files`                  | .gitignore spec has 20+ edge cases (negation, directory-only, anchoring, cascading); `ignore` is spec-compliant and used by ESLint [VERIFIED: npm docs] |
| Fuzzy path search           | Custom scoring algorithm              | Fuse.js (client)                                                | Threshold tuning, weighted keys, and Unicode support are deceptively complex; Fuse.js handles all of this [VERIFIED: npm registry]                      |
| Syntax highlighting         | Custom tokenizer or regex highlighter | Shiki with fine-grained bundles                                 | TextMate grammar parsing is thousands of lines; Shiki uses VS Code's exact engine [VERIFIED: shiki.style docs]                                          |
| File type icon mapping      | Manual icon assignment per extension  | Extension→icon lookup map (use MUI icons + a small curated set) | Dozens of file types; a lookup map with sensible defaults covers 95% of cases without a heavy icon library                                              |
| Path traversal prevention   | Manual string checking                | `path.resolve()` + prefix validation                            | Must prevent `../../etc/passwd` style attacks; path resolution with strict prefix check is the standard approach                                        |

**Key insight:** File operations inside containers are inherently sandboxed — the container filesystem is the security boundary. But the REST API still needs path traversal validation to prevent accessing files outside the workspace directory within the container.

## Common Pitfalls

### Pitfall 1: Path Traversal in File API

**What goes wrong:** API accepts `?path=../../etc/passwd` and returns sensitive container files outside the workspace.
**Why it happens:** Naive string concatenation of user-supplied path with workspace base.
**How to avoid:** Resolve the full path with `path.resolve(workingDir, userPath)`, then verify the result starts with the workspace base path. Reject any path that escapes.
**Warning signs:** Path parameter not validated in controller or interactor.

### Pitfall 2: Large File Preview Crashing the Browser

**What goes wrong:** User clicks a 50MB log file and the browser tab freezes while Shiki tries to tokenize it.
**Why it happens:** No size cap on file content fetch.
**How to avoid:** Set a maximum preview size (recommend 512KB). Return first N bytes with a truncation indicator. Check file size before reading content.
**Warning signs:** No `Content-Length` check or size parameter in the file content API.

### Pitfall 3: Binary File Detection

**What goes wrong:** User clicks a `.png` or `.woff2` file and sees garbled binary text in the preview.
**Why it happens:** No binary detection — all files treated as text.
**How to avoid:** Check file extension against a known binary set, or use `file --mime-type` inside the container, or check for null bytes in the first 8KB of content. Show a "Binary file — cannot preview" message.
**Warning signs:** No MIME type detection or extension checking in the file content API.

### Pitfall 4: Stale File Index After Agent Operations

**What goes wrong:** Agent creates new files during a chat, but `@`-mention autocomplete doesn't show them.
**Why it happens:** File index cached and never refreshed.
**How to avoid:** Invalidate the file index cache when a `chat.complete` event fires for the session. The `SessionGatewayChatService` already emits this event — listen for it in the file index service and invalidate. Push the updated index to the client via WebSocket, or let the client re-fetch on `chat.complete`.
**Warning signs:** No cache invalidation logic tied to chat completion events.

### Pitfall 5: Race Condition Between Directory Listing and Container State

**What goes wrong:** User browses files, container stops mid-request, API returns a cryptic Docker error.
**Why it happens:** No container status check before exec.
**How to avoid:** Verify container is running before executing file commands. Return a clear "Container not running" response (400 or 503) that the UI handles gracefully.
**Warning signs:** Raw Docker errors surfacing to the client.

### Pitfall 6: `@` Trigger Firing Inside Words or Email Addresses

**What goes wrong:** Typing `user@example.com` triggers file autocomplete.
**Why it happens:** `@` detection not checking word boundary.
**How to avoid:** D-05 specifies word boundary requirement — the regex must check for whitespace or start-of-string before `@`. The `findAtToken` regex pattern `(^|\s)@` handles this correctly.
**Warning signs:** Autocomplete appearing when typing email addresses in prompts.

## Code Examples

### Container Path Safety

```typescript
// Source: Standard Node.js path security pattern
import * as path from 'path';

function resolveSafePath(workspaceBase: string, userPath: string): string {
  const resolved = path.resolve(workspaceBase, userPath);
  if (!resolved.startsWith(workspaceBase)) {
    throw new BadRequestException('Path traversal detected');
  }
  return resolved;
}
```

### Shiki Fine-Grained Bundle (Client)

```typescript
// Source: https://shiki.style/guide/bundles
import { createHighlighter } from 'shiki/core';
import { createJavaScriptRegExpEngine } from 'shiki/engine/javascript';

const highlighter = await createHighlighter({
  themes: [import('shiki/themes/github-dark-default.mjs')],
  langs: [
    import('shiki/langs/typescript.mjs'),
    import('shiki/langs/javascript.mjs'),
    import('shiki/langs/json.mjs'),
    import('shiki/langs/css.mjs'),
    import('shiki/langs/html.mjs'),
    import('shiki/langs/python.mjs'),
    import('shiki/langs/bash.mjs'),
    import('shiki/langs/yaml.mjs'),
    import('shiki/langs/markdown.mjs'),
  ],
  engine: createJavaScriptRegExpEngine(),
});
```

### Fuse.js Configuration for File Path Search

```typescript
// Source: Fuse.js documentation pattern
import Fuse from 'fuse.js';

const fuse = new Fuse(fileIndex, {
  threshold: 0.4,
  distance: 200,
  includeScore: true,
  keys: ['path'],
  shouldSort: true,
});

const results = fuse.search(query).slice(0, 20);
```

### Directory Entry Type Detection via Docker Exec

```typescript
// Single command to get typed directory listing inside container
const cmd = [
  'sh',
  '-c',
  `find "${safePath}" -maxdepth 1 -mindepth 1 -printf '%y %P\\n' 2>/dev/null | sort`,
];
// Output: "d src\nf README.md\nd node_modules\n..."
// 'd' = directory, 'f' = file, 'l' = symlink
```

### File Index via git ls-files

```typescript
// Build flat file index — inherently .gitignore-aware
const result = await this.execService.execInContainer(
  containerId,
  ['git', 'ls-files', '--cached', '--others', '--exclude-standard'],
  workingDir,
);
// Returns all tracked + untracked-but-not-ignored files
const files = result.stdout.split('\n').filter(Boolean);
```

## State of the Art

| Old Approach                                 | Current Approach                         | When Changed      | Impact                                                           |
| -------------------------------------------- | ---------------------------------------- | ----------------- | ---------------------------------------------------------------- |
| highlight.js / Prism for syntax highlighting | Shiki with JS RegExp engine (no WASM)    | Shiki 1.0+ (2024) | Full VS Code accuracy without WASM overhead when using JS engine |
| Custom .gitignore regex                      | `ignore` npm package                     | Stable for years  | Spec-compliant, maintained, used by ESLint                       |
| Full tree fetch on page load                 | Lazy-loaded tree with on-demand children | Industry standard | Essential for repos with >10K files                              |

**Deprecated/outdated:**

- `react-syntax-highlighter`: Wraps Prism/highlight.js but hasn't kept up with Shiki's quality; many projects migrating away
- WASM-only Shiki: Shiki 1.0+ added `engine/javascript` for non-WASM environments

## Assumptions Log

| #   | Claim                                                                    | Section               | Risk if Wrong                                                                                                                         |
| --- | ------------------------------------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `git ls-files` is available in all AFK Docker container images           | Architecture Patterns | If containers don't have git installed, the primary listing strategy fails — fallback to `find` + `ignore` would become the only path |
| A2  | Shiki JS RegExp engine provides sufficient language support without WASM | Standard Stack        | Some complex grammars (e.g., Haskell) may not work with JS engine — fallback to plaintext for unsupported languages                   |
| A3  | Container `find` command supports `-printf` format                       | Code Examples         | Alpine/busybox `find` may not support `-printf`; use `stat` or `ls -la` as portable alternative                                       |
| A4  | 512KB is a reasonable maximum file preview size                          | Pitfalls              | If users commonly work with larger files, they'll see truncation — but this matches VS Code's web preview behavior                    |

## Open Questions (RESOLVED)

1. **Docker image git availability**
   - What we know: AFK containers are purpose-built for coding agents, likely have git installed
   - What's unclear: Whether ALL registered images guarantee git
   - Recommendation: Verify at exec time; if `git ls-files` returns non-zero exit code, fall back to `find` + `ignore`. Log a warning.

2. **File index size for large monorepos**
   - What we know: `git ls-files` in a monorepo can return 50K+ paths
   - What's unclear: Whether sending 50K paths to the client causes performance issues
   - Recommendation: Cap the index at 10,000 entries (configurable). For larger repos, the `@`-mention search can fall back to server-side search with debounce.

3. **Shiki bundle size impact**
   - What we know: Fine-grained Shiki imports with JS engine are much smaller than the full bundle
   - What's unclear: Exact bundle impact in this project's Vite build
   - Recommendation: Import only the top 8-10 languages initially. Add more via dynamic import if the file extension demands it.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies beyond Docker exec, which is the existing foundation of the project).

## Validation Architecture

### Test Framework

| Property           | Value                                                            |
| ------------------ | ---------------------------------------------------------------- |
| Framework          | Jest 29 (server), Vitest 4 (web)                                 |
| Config file        | `server/test/jest-e2e.json` (server), `web/vite.config.ts` (web) |
| Quick run command  | `cd server && npm test -- --testPathPattern=workspace`           |
| Full suite command | `cd server && npm test`                                          |

### Phase Requirements → Test Map

| Req ID  | Behavior                                            | Test Type     | Automated Command                                                                           | File Exists? |
| ------- | --------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------- | ------------ |
| CTXT-01 | `@`-mention autocomplete triggers and filters files | unit (web)    | `cd web && npx vitest run --reporter=verbose src/components/chat/FileAutocomplete.test.tsx` | ❌ Wave 0    |
| CTXT-02 | Directory listing returns children with types       | e2e (server)  | `cd server && npm test -- --testPathPattern=workspace`                                      | ❌ Wave 0    |
| CTXT-03 | .gitignore entries excluded from listing            | e2e (server)  | `cd server && npm test -- --testPathPattern=workspace`                                      | ❌ Wave 0    |
| CTXT-04 | Open-in-IDE generates correct protocol URL          | unit (server) | `cd server && npx jest --testPathPattern=ide-url`                                           | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** `cd server && npm test -- --testPathPattern=workspace`
- **Per wave merge:** `cd server && npm test && cd ../web && npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `server/test/e2e/workspace.e2e.spec.ts` — covers CTXT-02, CTXT-03
- [ ] `web/src/components/chat/FileAutocomplete.test.tsx` — covers CTXT-01
- [ ] `server/src/interactors/sessions/workspace/workspace-file-listing.service.spec.ts` — covers path traversal prevention

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                  |
| --------------------- | ------- | --------------------------------------------------------------------------------- |
| V2 Authentication     | no      | Existing auth guard covers all API routes                                         |
| V3 Session Management | no      | Existing session management unchanged                                             |
| V4 Access Control     | yes     | Verify session belongs to requesting user before serving files                    |
| V5 Input Validation   | yes     | Path parameter validation — prevent traversal via `path.resolve()` + prefix check |
| V6 Cryptography       | no      | No crypto operations in this phase                                                |

### Known Threat Patterns

| Pattern                                   | STRIDE                 | Standard Mitigation                                                                               |
| ----------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| Path traversal (`../../etc/passwd`)       | Information Disclosure | `path.resolve()` + workspace prefix validation; reject any path outside workspace root            |
| Large file DoS (request 1GB file preview) | Denial of Service      | File size check before reading; 512KB cap with truncation                                         |
| Command injection via path                | Tampering              | Never interpolate user paths into shell strings; use array-based `cmd` args for `execInContainer` |
| Container state mismatch                  | Denial of Service      | Verify container is running before exec; return clear 400/503 on failure                          |

## Sources

### Primary (HIGH confidence)

- Codebase inspection — `DockerContainerExecService`, `ChatInput`, `SkillAutocomplete`, `SessionTabBar`, `SessionDetails`, `SessionGatewayChatService`, `Settings` entity, `SessionConfigDto`, all read directly
- npm registry — shiki@4.0.2, fuse.js@7.3.0, ignore@7.0.5 (verified via `npm view`)

### Secondary (MEDIUM confidence)

- [Shiki bundles documentation](https://shiki.style/guide/bundles) — fine-grained import patterns [CITED]
- Web search — syntax highlighter comparison, ignore package ecosystem status [VERIFIED: cross-referenced with npm]

### Tertiary (LOW confidence)

- None — all claims verified or cited

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries verified on npm, alternatives evaluated
- Architecture: HIGH — patterns derived directly from existing codebase (controllers, gateway, tab system, autocomplete)
- Pitfalls: HIGH — based on standard web security patterns and real codebase analysis
- Discretion areas: MEDIUM — Shiki bundle sizing and file index cap are educated recommendations

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable domain, no fast-moving dependencies)
