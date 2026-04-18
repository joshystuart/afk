---
phase: 03-workspace-api-file-explorer
plan: 02
subsystem: web/session-ui/files
tags: [web, react, files, file-explorer, shiki, syntax-highlighting, mui]
requires:
  - web/src/api/workspace.api.ts (workspaceApi from Plan 01)
  - web/src/api/types.ts (FileEntry, DirectoryListing, FileContent, Settings.ideCommand)
  - web/src/hooks/useSessionTabs.ts (tab state)
  - web/src/components/session/SessionTabBar.tsx
  - web/src/components/session/SessionTabPanel.tsx
  - web/src/stores/settings.store.ts (useSettingsStore for ideCommand)
  - @tanstack/react-query (existing)
  - @mui/material + @mui/icons-material (existing)
  - shiki (new)
provides:
  - Files tab in session detail page
  - FilesPanel (tree + preview split layout)
  - FileTree + FileTreeItem + FileIcon (lazy-loaded directory tree)
  - FilePreview + FilePreviewHeader (shiki-highlighted read-only viewer with Open in IDE)
  - useFileTree / useFileContent React Query hooks
affects:
  - web/src/pages/SessionDetails.tsx (+Files tab, +ideCommand from settings store, Ctrl+` cycles 3 tabs)
  - web/package.json (+shiki dependency)
tech-stack:
  added: [shiki ^4.0.2]
  patterns:
    - React Query per-path queryKeys with enabled-guard for lazy folder expansion
    - Recursive TreeNode component + Set<string> expandedDirs for O(1) toggle
    - Module-level shiki highlighter singleton (Promise) with fine-grained bundle imports
    - JavaScript regex engine (no WASM) via createJavaScriptRegexEngine for Vite/SPA compatibility
    - Visibility-preserved tab pattern (SessionTabPanel stays mounted via display:none)
key-files:
  created:
    - web/src/hooks/useFileTree.ts
    - web/src/hooks/useFileContent.ts
    - web/src/components/session/files/FileIcon.tsx
    - web/src/components/session/files/FileTreeItem.tsx
    - web/src/components/session/files/FileTree.tsx
    - web/src/components/session/files/FilePreviewHeader.tsx
    - web/src/components/session/files/FilePreview.tsx
    - web/src/components/session/files/FilesPanel.tsx
  modified:
    - web/src/pages/SessionDetails.tsx
    - web/package.json
    - web/package-lock.json
decisions:
  - Used the Shiki 4.x name `createJavaScriptRegexEngine` from `shiki/engine/javascript` (plan said `createJavaScriptRegExpEngine` — the actual export in the installed version is lowercase "x"). Behaviour is identical.
  - FileTree uses a recursive TreeNode that re-renders `useFileTree` per expanded directory, which naturally implements D-12 lazy loading (React Query fires only when enabled=true).
  - Set<string> chosen for `expandedDirs` to get O(1) contains checks and cheap toggles without stale-closure worries (callback form of setState).
  - Shiki theme fixed to `github-dark-default` to match AFK dark surface; only 9 languages pre-loaded (TS/JS/JSON/CSS/HTML/Python/Bash/YAML/Markdown) — everything else falls back to `plaintext` to keep bundle cost bounded.
  - IDE URL builder maps `/workspace/repo/<rel>` and `/workspace/<rel>` container prefixes to `hostMountPath`. Files outside the workspace mount (unlikely in practice) skip the link rather than generating a bad protocol URL.
  - FilePreviewHeader renders `Open in IDE` only when `ideUrl !== null` (per D-17 — hidden, never disabled). No button DOM node is emitted at all when workspace mount is absent or `ideCommand` is empty.
  - Files tab disabled until `isReady` (session running + health check green) to avoid noisy API errors on pending containers.
  - Ctrl+\` now cycles chat → terminal → files → chat via a single tabCycle array; starting from any tab the cycle is deterministic.
metrics:
  duration: "~4 min"
  completed: "2026-04-17"
---

# Phase 03 Plan 02: Frontend File Explorer Summary

## One-liner

VS Code-style Files tab in every session — lazy-loaded directory tree, Shiki-highlighted read-only preview, and Open-in-IDE deep link (hidden unless workspace mount + ideCommand are both configured).

## What was built

### Hooks — `web/src/hooks/`

- **`useFileTree.ts`** — `useQuery<DirectoryListing>` keyed by `['workspace', 'files', sessionId, path]`, `staleTime: 30s`, `retry: 1`, guarded by `enabled && !!sessionId` so collapsed directories don't hit the API.
- **`useFileContent.ts`** — `useQuery<FileContent>` keyed by `['workspace', 'content', sessionId, path]`, `enabled: !!path && !!sessionId` so null selection doesn't fetch.

### Components — `web/src/components/session/files/`

- **`FileIcon.tsx`** — Maps file extensions to MUI icons:
  - Folders → `Folder` / `FolderOpen` (accent green)
  - `.ts/.tsx/.js/.jsx/.mjs/.cjs` → `Code`
  - `.json/.yaml/.yml/.toml` → `DataObject`
  - `.md/.mdx/.txt/.rst` → `Description`
  - `.css/.scss/.sass/.less` → `Palette`
  - `.html/.htm/.xml` → `Language`
  - `.png/.jpg/.jpeg/.gif/.svg/.webp` → `Image`
  - `.sh/.bash/.zsh/.fish` → `Terminal`
  - default → `InsertDriveFileOutlined`
    All file icons coloured `textTertiary`, size 16px.
- **`FileTreeItem.tsx`** — Single row with cursor-pointer Box, indent = `depth * 16px + 4px`, chevron (14px, rotates 90° when expanded) for directories, JetBrains Mono 0.8rem, accentMuted background when selected, 4% white hover overlay. Click routing: directory → `onToggle`, file → `onSelect`.
- **`FileTree.tsx`** — Recursive `TreeNode` fetches its own directory via `useFileTree`. Root TreeNode uses path `'/'`. `expandedDirs: Set<string>` state with O(1) toggle via the functional setState form. Sorts entries client-side (dirs first, alphabetical within). Empty-root → "No files found"; loading → 14px CircularProgress; error → red message with details.
- **`FilePreviewHeader.tsx`** — Bar 36px high: file path (monospace RTL-ellipsis for long paths, tooltip shows full path), language `Chip`, truncation warning (`WarningAmberRounded` + "File truncated (>512KB)" in `afkColors.warning`). "Open in IDE" `Button` with `OpenInNew` icon rendered **only** when `ideUrl !== null` (per D-17 — completely absent, not disabled). Clicking calls `window.open(ideUrl, '_self')` to trigger the OS protocol handler.
- **`FilePreview.tsx`** — `useFileContent(sessionId, filePath)`:
  - `filePath === null` → "Select a file to preview" empty state.
  - Loading → header skeleton + body skeleton.
  - Error → danger-coloured error message.
  - `data.binary === true` → "Binary file — cannot preview" empty state (no syntax highlight attempt).
  - Otherwise → loads Shiki highlighter (module-level singleton Promise, lazy via `import()`), calls `highlighter.codeToHtml(data.content, { lang, theme: 'github-dark-default' })`, renders via `dangerouslySetInnerHTML`. Falls back to `'plaintext'` for languages not in the preloaded set, or to unhighlighted `<pre>` on highlight failure.
  - IDE URL built by `buildIdeUrl`: maps `/workspace/repo/<rel>` or `/workspace/<rel>` container paths to `hostMountPath + '/' + <rel>`, then renders as `cursor://file/...`, `vscode://file/...`, `zed://file/...`, or `${ideCommand}://file/...`. Returns `null` when `hostMountPath` or `ideCommand` is falsy, or when the path is outside the mounted workspace.
- **`FilesPanel.tsx`** — `display: flex`, `flex: 1`, `minHeight: 0`, `overflow: hidden`. Left pane: 280px FileTree (`borderRight`, `overflowY: auto`, surface background). Right pane: FilePreview (flex:1, minWidth:0). Holds `selectedFile` state at this level (both children consume it).

### Integration — `web/src/pages/SessionDetails.tsx`

- Imported `FolderOpen as FilesIcon` from `@mui/icons-material` and `FilesPanel` + `useSettingsStore`.
- Appended a third entry `{ id: 'files', label: 'Files', icon: <FilesIcon/>, disabled: !isReady }` to the `sessionTabs` useMemo, with `isReady` added to the dep array.
- Ctrl+\` hotkey replaced with `tabCycle = ['chat', 'terminal', 'files']` round-robin — cycles deterministically from any active tab.
- Added a third `<SessionTabPanel active={activeTab === 'files'}>` wrapping `<FilesPanel sessionId={session.id} hostMountPath={session.hostMountPath ?? null} ideCommand={settings?.ideCommand ?? null} />`.

### Dependencies

- `web/package.json` now pins **`shiki ^4.0.2`**. Uses fine-grained imports (`shiki/engine/javascript`, `shiki/themes/github-dark-default.mjs`, `shiki/langs/*.mjs`) so unused languages are tree-shaken by Vite.

## Commits

| Task | Description                                                                           | Hash      |
| ---- | ------------------------------------------------------------------------------------- | --------- |
| 1    | File tree components (FileTree, FileTreeItem, FileIcon) + useFileTree/useFileContent  | `10c0b32` |
| 2    | FilePreview + FilePreviewHeader + FilesPanel + SessionDetails integration + shiki dep | `dd76e02` |

## Verification

- **`cd web && npx tsc --noEmit`** → exit 0 (clean).
- **`cd web && npx vitest run --project unit`** → 1 file, 50 tests passed (pre-existing `cron-helpers.test.ts` suite — no new tests added, per plan scope).
- **`npx eslint`** on all new/modified files → 0 errors, 1 warning (pre-existing `react-hooks/exhaustive-deps` warning on line 335 of `SessionDetails.tsx` in the document-title useEffect — out of scope, not introduced by this plan).
- **Prettier** — all touched files formatted clean.

## Threat Model Coverage

| Threat ID                                         | Disposition in plan | Handling in implementation                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-03-06 (Tampering via `dangerouslySetInnerHTML`) | accept              | HTML comes from Shiki tokenisation, not user input. Shiki output is deterministic from the fetched file content; we render it into a `<Box>` scoped by sx rules, not into the global document. Binary files short-circuit before any highlight call.                                                                                                                                  |
| T-03-07 (IDE protocol URL)                        | accept              | `ideUrl` built from `hostMountPath` (admin-configured in Settings) and `ideCommand` (admin-configured) — never from user input. Path traversal into `hostMountPath` is mechanically impossible because the container-path → host-path mapping rejects (returns null) anything outside `/workspace` or `/workspace/repo`. Browser hands the URL to the OS; AFK never executes a shell. |

## Requirements Coverage

| Requirement                                    | Delivered | How                                                                                                                                                                                                                 |
| ---------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CTXT-02 (Browse container workspace file tree) | Full UI   | Files tab renders FileTree fed by `GET /api/sessions/:id/files?path=...` with lazy-loaded folder expansion and selection → preview flow.                                                                            |
| CTXT-04 (Open file in local IDE)               | Full UI   | `FilePreviewHeader` "Open in IDE" button triggers `cursor://`, `vscode://`, `zed://`, or `${ideCommand}://` protocol URL; only shown when workspace mount **and** `settings.ideCommand` are both configured (D-17). |

## Deviations from Plan

### Auto-fixed / design adjustments

**1. [Rule 3 - Blocking] Shiki engine export name**

- **Found during:** Task 2, compile.
- **Issue:** Plan listed `createJavaScriptRegExpEngine` (camelCase with capital "E" + capital "P"). The actual Shiki 4.x export from `shiki/engine/javascript` is `createJavaScriptRegexEngine` (lowercase "x" in "Regex").
- **Fix:** Import as `createJavaScriptRegexEngine`. Behaviour identical.
- **Files modified:** `web/src/components/session/files/FilePreview.tsx`.
- **Commit:** `dd76e02`.

**2. [Rule 2 - Critical] Files tab disabled until session ready**

- The plan specified `disabled: !isReady` for the Files tab. Kept it as-is (no change from plan), but made sure `isReady` is added to the `sessionTabs` useMemo dependency array so the tab re-enables when health check flips. Prevents a stale-closure bug.
- **Commit:** `dd76e02`.

**3. [Rule 2 - Critical] Scoped FilePreview highlight cancellation**

- Added `cancelled` flag in the Shiki effect so rapid file-switching doesn't drop stale HTML into a later file's preview (race when a larger file's highlight resolves after the user has already clicked another file).
- **Files modified:** `FilePreview.tsx`.
- **Commit:** `dd76e02`.

**4. [Rule 2 - Critical] Highlight fallback for unhighlighted render**

- If Shiki fails (engine load error, unsupported lang edge case), render the raw content in an unhighlighted `<pre>` instead of showing nothing. Keeps the preview usable even if Shiki is temporarily broken.
- **Commit:** `dd76e02`.

### Non-deviations (by design)

- Recursive TreeNode per directory vs single flat fetch: chose recursive because it naturally implements D-12 lazy loading and keeps each `useQuery` independently cacheable by path.
- Kept `useQuery` staleTime at 30s to align with Plan 01's 60s server index cache (client re-fetches at half the server TTL — no staleness worse than ~90s end-to-end).
- Did not add new vitest tests for the components — plan `<verify>` was `tsc --noEmit` only; component behaviour is exercised by the manual UAT listed in `<success_criteria>`.
- RTL ellipsis on file path: provides better "prefix-visible but truncates on left" behaviour for long paths without extra JS, falling back to the Tooltip for full text.

## Known Stubs

None. All components are wired to real endpoints, all conditional rendering has fallbacks, and the IDE button is gated on real settings data.

## Self-Check: PASSED

- [x] `web/src/hooks/useFileTree.ts` — FOUND
- [x] `web/src/hooks/useFileContent.ts` — FOUND
- [x] `web/src/components/session/files/FileIcon.tsx` — FOUND
- [x] `web/src/components/session/files/FileTreeItem.tsx` — FOUND
- [x] `web/src/components/session/files/FileTree.tsx` — FOUND
- [x] `web/src/components/session/files/FilePreviewHeader.tsx` — FOUND
- [x] `web/src/components/session/files/FilePreview.tsx` — FOUND
- [x] `web/src/components/session/files/FilesPanel.tsx` — FOUND
- [x] `web/src/pages/SessionDetails.tsx` — modified (Files tab, useSettingsStore, Ctrl+\` cycle)
- [x] Commit `10c0b32` — FOUND in `git log`
- [x] Commit `dd76e02` — FOUND in `git log`
- [x] `web/package.json` contains `"shiki"` — FOUND (`^4.0.2`)
- [x] `cd web && npx tsc --noEmit` exits 0 — VERIFIED
- [x] `cd web && npx vitest run --project unit` — 50/50 passed, no regressions
