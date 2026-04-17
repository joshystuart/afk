---
phase: 03-workspace-api-file-explorer
verified: 2026-04-17T11:30:00Z
status: human_needed
score: 21/21 must-haves verified (17 initial + 4 from plan 04 gap closure)
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 17/17
  trigger: Plan 03-04 gap-closure completed
  gaps_closed:
    - 'Saving ideCommand in Settings → General returns 200 (no ValidationPipe rejection)'
    - 'Saving ideCommand persists the value in the Settings entity'
    - 'GET /api/settings after save returns ideCommand so the form repopulates on reload'
    - 'Ctrl+` cycles tabs on Windows/Linux AND ⌘+` cycles tabs on macOS (chat → terminal → files → chat)'
  gaps_remaining: []
  regressions: []
  human_uat_impact:
    - test: 'IDE command persists across reload'
      previous_uat_result: 'issue (blocker)'
      status_after_fix: 'unblocked — e2e regression covers PUT→GET round-trip; human re-run required for UI reload verification'
    - test: 'Ctrl+` cycles 3 tabs'
      previous_uat_result: 'issue (major)'
      status_after_fix: 'unblocked — code fix present; human re-run required for live hotkey dispatch on macOS'
    - test: 'Open in IDE button gating'
      previous_uat_result: 'blocked (prior-phase)'
      status_after_fix: 'unblocked — ideCommand now round-trips so button gating can finally be exercised; human re-run required'
human_verification:
  - test: 'Files tab renders VS Code-style tree'
    expected: 'Indented tree with folder/file icons, expand/collapse chevrons animate on click, selected row highlighted in accent colour'
    why_human: 'Visual layout — cannot verify pixel-level rendering or motion via grep'
  - test: 'Folder expansion lazy-loads children'
    expected: 'DevTools Network tab shows GET /api/sessions/:id/files?path=<dir> fires only when the folder is first expanded (not on mount)'
    why_human: 'Runtime network timing — requires running app + DevTools'
  - test: '.gitignore filtering honoured in real container'
    expected: 'Open Files tab in a session with node_modules/ and a non-empty .gitignore; node_modules does not appear in the root listing'
    why_human: 'Requires running session container with a real git repo. git ls-files path is wired but only behaviour in-container confirms filtering end-to-end'
  - test: 'Syntax-highlighted preview'
    expected: 'Clicking a .ts/.tsx file shows Shiki-highlighted content; clicking a binary (.png) shows "Binary file — cannot preview"; clicking a >512KB file shows "File truncated (>512KB)" warning chip'
    why_human: 'Visual rendering of Shiki output and conditional UI states'
  - test: 'Open in IDE button gating'
    expected: 'When Settings.ideCommand="cursor" AND session.hostMountPath is set, button appears in preview header; when either is missing, button is completely absent (not disabled)'
    why_human: 'DOM presence/absence tied to runtime settings — requires a session with and without host mount to compare'
  - test: 'Open in IDE actually launches IDE'
    expected: 'Clicking "Open in IDE" on /workspace/repo/src/index.ts with hostMountPath=/Users/me/proj launches Cursor/VSCode at the correct local file'
    why_human: 'OS protocol handler dispatch — cannot be automated'
  - test: '@-mention triggers after a space'
    expected: 'Typing `@s` at start of input or after whitespace shows FileAutocomplete dropdown filtered for "s"; typing `user@example.com` does NOT trigger autocomplete'
    why_human: 'User input simulation + dropdown rendering — browser-level behaviour'
  - test: 'Fuzzy search ranks sensibly'
    expected: 'Typing `@src/idx` ranks src/index.ts above unrelated paths; top 20 results shown'
    why_human: 'Fuse.js ranking is deterministic in code but relevance-judgement is subjective'
  - test: 'Keyboard navigation in FileAutocomplete'
    expected: 'ArrowUp/Down moves selection, Enter inserts @path with trailing space, Escape closes, Tab selects-or-closes'
    why_human: 'Keyboard event propagation through anchor element + capture listener — requires live DOM'
  - test: '@-mention and /skill coexist without overlap'
    expected: 'Typing `/` shows SkillAutocomplete; typing `@` shows FileAutocomplete; never both simultaneously; Enter in one does not send the message'
    why_human: 'State-machine behaviour between two autocompletes — live input required'
  - test: 'IDE command persists across reload'
    expected: 'Save "cursor" in Settings > General > IDE Integration, reload the page, value remains populated'
    why_human: 'Round-trip through UpdateSettingsRequest → Settings entity → GET /settings — requires running server + DB'
  - test: 'Ctrl+` cycles 3 tabs'
    expected: 'Shortcut advances chat → terminal → files → chat'
    why_human: 'Hotkey dispatch — browser-level'
---

# Phase 03: Workspace API & File Explorer Verification Report

**Phase Goal:** Users can browse and reference container files directly from the web UI
**Verified:** 2026-04-17 (initial) → 2026-04-17T11:30Z (post-gap-closure re-verification)
**Status:** human_needed
**Re-verification:** Yes — after gap closure (plan 03-04 closed UAT gaps 1 & 2)
**Score:** 21/21 must-haves verified in code (17 initial + 4 from plan 04); 12 UAT items still require human testing before the phase can be marked fully complete, but the 2 previously-failing UAT tests (7 & 8) and 1 blocked UAT test (9) are now code-complete and ready for human re-run.

## Post-Gap Re-verification (Plan 03-04)

Plan 03-04 closed two UAT gaps reported in `03-UAT.md`:

- **Gap 2 (blocker, Test 8):** `ideCommand` was rejected with `400 "property ideCommand should not exist"` — caused by three missing pieces: DTO declaration, interactor forwarding, and response-DTO exposure.
- **Gap 1 (major, Test 7):** Tab-cycle hotkey bound to literal `ctrl+`` did not fire on macOS (⌘ maps to `metaKey`, not `ctrlKey`).

### Plan 04 must-have verification

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 18 | Saving ideCommand in Settings → General returns 200 (no ValidationPipe rejection) | ✓ VERIFIED | `update-settings-request.dto.ts:106-113` declares `@IsOptional() @IsString() @MaxLength(100) ideCommand?: string` with `@ApiProperty`. `MaxLength` imported at line 8. ValidationPipe whitelist now accepts the field. |
| 19 | Saving ideCommand persists the value in the Settings entity | ✓ VERIFIED | `update-settings.interactor.ts:72` — `ideCommand: request.ideCommand` added to `currentSettings.update({...})` object literal. Domain `Settings.update()` already normalises empty-string → null (`settings.entity.ts:100-102`). |
| 20 | GET /api/settings after save returns ideCommand so the form repopulates on reload | ✓ VERIFIED | `get-settings-response.dto.ts:44` declares `ideCommand?: string \| null` with `@ApiProperty`. `fromDomain` at line 91 maps `dto.ideCommand = settings.general.ideCommand ?? null` — byte-identical to the domain value (matches skillsDirectory pattern). |
| 21 | Ctrl+` cycles tabs on Windows/Linux AND ⌘+` cycles tabs on macOS | ✓ VERIFIED (code) | `SessionDetails.tsx:167` — first argument is exactly `'mod+`, ctrl+`'`. Handler body, deps, and options object byte-identical (confirmed by diff on commit `716d5a7` — 1 insertion/1 deletion total). `mod` alias from react-hotkeys-hook v5.2.4 matches `ctrlKey \|\| metaKey`; `ctrl+`` retained as fallback for macOS systems that consume ⌘+`. Live hotkey dispatch still requires human UAT re-run. |

### Plan 04 artifact verification

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `server/src/interactors/settings/update-settings/update-settings-request.dto.ts` | `ideCommand` declared with full decorator set + `MaxLength` imported | ✓ VERIFIED | 114 lines, `MaxLength` in import list (line 8), field at lines 106-113 |
| `server/src/interactors/settings/update-settings/update-settings.interactor.ts` | `ideCommand: request.ideCommand` in `currentSettings.update({...})` | ✓ VERIFIED | 83 lines, line 72 in the update() call at lines 59-73 |
| `server/src/interactors/settings/get-settings/get-settings-response.dto.ts` | `ideCommand?: string \| null` field + `fromDomain` mapping | ✓ VERIFIED | 101 lines, field at 39-44, `?? null` mapping at 91 |
| `server/test/e2e/settings.e2e.spec.ts` | Regression test `should persist and round-trip ideCommand` in `describe('PUT /api/settings')` | ✓ VERIFIED | Lines 181-201: PUT `{ideCommand: 'cursor'}` → 200 with `data.ideCommand === 'cursor'`; GET returns same; PUT `{ideCommand: ''}` → `data.ideCommand === null`. |
| `web/src/pages/SessionDetails.tsx` | First arg of tab-cycle `useHotkeys` = `'mod+`, ctrl+`'` | ✓ VERIFIED | Line 167, handler/options unchanged |

### Plan 04 key-link verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `update-settings-request.dto.ts` | ValidationPipe whitelist | `@IsOptional() @IsString() @MaxLength(100) ideCommand?: string` | ✓ WIRED | Full decorator stack + MaxLength import present |
| `update-settings.interactor.ts` | `Settings.update(SettingsUpdateData)` | `ideCommand: request.ideCommand` | ✓ WIRED | Property present in the update literal, ordered after `idleTimeoutMinutes` per plan |
| `get-settings-response.dto.ts` | `Settings.general.ideCommand` | `dto.ideCommand = settings.general.ideCommand ?? null` | ✓ WIRED | Grouped with peer general-settings fields in `fromDomain` |
| `SessionDetails.tsx` | `react-hotkeys-hook` matchesHotkey `mod` branch | `useHotkeys('mod+`, ctrl+`', handler)` | ✓ WIRED | Comma-separated accelerator list registers both bindings |

### Plan 04 behavioural spot-checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Server E2E Settings suite passes (incl. new round-trip test) | `cd server && npm run test -- --testPathPattern=settings.e2e` | 19/19 per 03-04 SUMMARY (including the new `should persist and round-trip ideCommand`) | ✓ PASS |
| Server TypeScript compiles clean | `cd server && npx tsc --noEmit` | Exit 0 per 03-04 SUMMARY | ✓ PASS |
| Web TypeScript compiles clean | `cd web && npx tsc --noEmit` | Exit 0 per 03-04 SUMMARY | ✓ PASS |
| `MaxLength` imported in DTO | `grep "MaxLength" server/.../update-settings-request.dto.ts` | Present on import line 8 and decorator line 108 | ✓ PASS |
| `ideCommand: request.ideCommand` in interactor update call | `grep "ideCommand: request.ideCommand" server/.../update-settings.interactor.ts` | Line 72 | ✓ PASS |
| `?? null` mapping in response DTO fromDomain | `grep "settings.general.ideCommand" server/.../get-settings-response.dto.ts` | Line 91: `dto.ideCommand = settings.general.ideCommand ?? null` | ✓ PASS |
| Hotkey binding uses `mod+`` and `ctrl+`` | `grep "'mod+\`, ctrl+\`'" web/src/pages/SessionDetails.tsx` | Line 167 | ✓ PASS |
| Gap-closure commits present in git log | `git log --oneline \| grep -E "66c8d0c\|716d5a7"` | Both commits found on current branch | ✓ PASS |

### Requirements coverage (post-gap)

Plan 04 frontmatter declares `requirements: [CTXT-02, CTXT-04]`. Both were already satisfied in the initial verification; the gap closure strengthens CTXT-04 (Open in IDE) by completing the persistence chain that was broken (GET /api/settings now returns `ideCommand`, unblocking the `buildIdeUrl` gate). No new requirements introduced. No orphaned requirements.

### UAT status after gap closure

| UAT # | Description | Previous | After code fix | Remaining human action |
|-------|-------------|----------|----------------|------------------------|
| 7 | Ctrl+` cycles 3 tabs (all platforms) | ❌ issue (major) | ✓ code fixed | Human re-run on macOS to confirm ⌘+` fires |
| 8 | IDE command persists across reload | ❌ issue (blocker) | ✓ code fixed + e2e regression | Human re-run to confirm Settings → General round-trip in UI |
| 9 | Open in IDE button gating | ⏸ blocked by Test 8 | ✓ unblocked | Human re-run: Test 8 no longer blocks this |

No regressions introduced — the pre-existing 11 passing UAT cases and all previously VERIFIED truths/artifacts/links remain satisfied (grep sampling confirms no touched-adjacent files changed).

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can browse the workspace directory tree in a panel within the session UI | ✓ VERIFIED | `SessionDetails.tsx:1039-1044` mounts `<FilesPanel>` in a 3rd tab; `FilesPanel.tsx` composes `<FileTree>` (lazy via `useFileTree`) + `<FilePreview>` split. Server-side `WorkspaceController.listDirectory` wired to `WorkspaceInteractor.listDirectory` → `WorkspaceFileListingService.listDirectory` (git ls-files + find fallback). |
| 2 | User can type `@` in the prompt input and see autocomplete for files and folders | ✓ VERIFIED | `ChatInput.tsx:112-145` defines `findAtToken` with regex `(^\|\s)@([\w./-]*)$`; mutual-exclusion with slash autocomplete at line 138 (`slashActive ? null : findAtToken(...)`); `<FileAutocomplete>` rendered at lines 222-230. `FileAutocomplete.tsx` uses `Fuse.js` with `threshold: 0.4, distance: 200`, capped at 20 results. |
| 3 | File and folder listings exclude entries matched by .gitignore | ✓ VERIFIED | `WorkspaceFileListingService.listDirectoryViaGit` runs `git ls-files --cached --others --exclude-standard -z -- <pathspec>` (inherently .gitignore-aware). Fallback `listDirectoryViaFind` reads root `.gitignore` and filters via `ignore` npm package. `WorkspaceFileIndexService.buildIndex` uses the same git-primary/find-fallback pattern. |
| 4 | User can click a file in the explorer to open it in local IDE when workspace mount is enabled | ✓ VERIFIED | `FilePreview.tsx:53-89` `buildIdeUrl` maps container path → host path via `hostMountPath`; returns null when either `hostMountPath` or `ideCommand` is falsy. `FilePreviewHeader.tsx:98-112` renders the "Open in IDE" button only when `ideUrl !== null`. Settings.`ideCommand` persisted via `general-settings.embedded.ts:20` (`varchar(100) nullable`) and round-trips through `settings.entity.ts:23,100-102`. |

### Plan-specific Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 5 | GET /api/sessions/:id/files returns directory listing | ✓ VERIFIED | `WorkspaceController.listDirectory` + `WorkspaceRoutes.LIST_FILES = '/:id/files'` + `WorkspaceInteractor.listDirectory` |
| 6 | GET /api/sessions/:id/files/content returns file content | ✓ VERIFIED | `WorkspaceController.getFileContent` + `WorkspaceRoutes.FILE_CONTENT = '/:id/files/content'` |
| 7 | GET /api/sessions/:id/files/index returns flat autocomplete list | ✓ VERIFIED | `WorkspaceController.getFileIndex` + `WorkspaceRoutes.FILE_INDEX = '/:id/files/index'` |
| 8 | Path traversal attempts (../../etc/passwd) rejected with 400 | ✓ VERIFIED | `WorkspaceFileListingService.resolveSafePath` (lines 110-123): `path.resolve` + `startsWith(normalizedBase + path.sep)` check; throws `BadRequestException('Path traversal detected')`. |
| 9 | Settings entity has `ideCommand` field persisted | ✓ VERIFIED | `GeneralSettings.ideCommand` at `general-settings.embedded.ts:20`, update handler in `settings.entity.ts:100-102`, web types `types.ts:88,153` |
| 10 | Files tab appears in session tab bar alongside Chat and Terminal | ✓ VERIFIED | `SessionDetails.tsx:157-159` appends `{ id: 'files', label: 'Files' }` to `sessionTabs` |
| 11 | File tree displays folders/files with expand/collapse | ✓ VERIFIED | `FileTreeItem.tsx:70-80` renders rotating ChevronRight for directories; `FileTree.tsx:103-134` recursive TreeNode with `expandedDirs: Set<string>` |
| 12 | Clicking file shows content in preview pane | ✓ VERIFIED | `FilesPanel.tsx:20,57-62` holds `selectedFile` state; passes `onFileSelect={setSelectedFile}` to tree, `filePath={selectedFile}` to preview |
| 13 | Folder expansion fetches children on demand | ✓ VERIFIED | `FileTree.tsx:44-47` each TreeNode calls `useFileTree(sessionId, path, enabled)`; `useFileTree.ts:13` `enabled: enabled && !!sessionId` — React Query fires only when directory is expanded |
| 14 | Open in IDE button hidden when workspace mount absent | ✓ VERIFIED | `FilePreview.tsx:58` `if (!hostMountPath \|\| !ideCommand) return null`; `FilePreviewHeader.tsx:98` `{ideUrl !== null && <Button...>}` — button completely absent (not disabled) |
| 15 | @-mention coexists with /skill autocomplete | ✓ VERIFIED | `ChatInput.tsx:128-144` single-pass handleChange: slash wins (`slashActive ? null : findAtToken`); `handleKeyDown:183` bails on either open; `handleSend:178-179` closes both |
| 16 | Selecting suggestion inserts `@path/to/file` as plain text | ✓ VERIFIED | `ChatInput.tsx:160-171` `handleFileSelect` splices `@${filePath} ` into `value` with no styled chip |
| 17 | User can configure IDE command in General Settings | ✓ VERIFIED | `GeneralSettings.tsx:141-152` TextField "IDE Command" with placeholder "cursor" between Skills and Claude Configuration; `formData.ideCommand` round-trips through `UpdateSettingsRequest` |

**Score:** 17/17 truths verified in code

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `server/src/interactors/sessions/workspace/workspace.routes.ts` | `WorkspaceRoutes` enum | ✓ VERIFIED | 5 lines, exports enum with 3 entries |
| `server/src/interactors/sessions/workspace/list-directory-response.dto.ts` | `FileEntryDto`, `ListDirectoryResponseDto` | ✓ VERIFIED | 27 lines, both classes with constructors |
| `server/src/interactors/sessions/workspace/file-content-response.dto.ts` | `FileContentResponseDto` | ✓ VERIFIED | 24 lines, constructor-bound fields |
| `server/src/interactors/sessions/workspace/workspace-file-listing.service.ts` | `resolveSafePath` + `listDirectory` + `getFileContent` | ✓ VERIFIED | 398 lines, git-primary + find-fallback, path-traversal guard, binary detection, 512KB cap |
| `server/src/interactors/sessions/workspace/workspace-file-index.service.ts` | TTL cache + getFileIndex/invalidate/clearAll | ✓ VERIFIED | 111 lines, 60s TTL, 10k cap, git + find fallback |
| `server/src/interactors/sessions/workspace/workspace.interactor.ts` | SESSION_REPOSITORY DI + RUNNING guard | ✓ VERIFIED | 110 lines, `loadRunningSession` rejects non-RUNNING |
| `server/src/interactors/sessions/workspace/workspace.controller.ts` | 3 @Get endpoints with Swagger decorators | ✓ VERIFIED | 165 lines, `@ApiTags('Sessions')`, `@Controller(SessionRoutes.BASE)` |
| `server/src/interactors/sessions/workspace/workspace.module.ts` | Imports DockerModule/SessionPersistence/Domain, exports WorkspaceFileIndexService | ✓ VERIFIED | 27 lines, also imports ResponseModule |
| `web/src/api/workspace.api.ts` | `workspaceApi` with 3 methods, encodeURIComponent | ✓ VERIFIED | 30 lines |
| `web/src/components/session/files/FilesPanel.tsx` | Split layout tree-left/preview-right | ✓ VERIFIED | 67 lines, 280px tree, selectedFile state |
| `web/src/components/session/files/FileTree.tsx` | Lazy-loaded TreeNode with `useFileTree` | ✓ VERIFIED | 179 lines, recursive TreeNode, `expandedDirs: Set<string>` |
| `web/src/components/session/files/FileTreeItem.tsx` | Depth indent + chevron + icon + name | ✓ VERIFIED | 100 lines, JetBrains Mono 0.8rem |
| `web/src/components/session/files/FileIcon.tsx` | Extension → MUI icon mapper | ✓ VERIFIED | 2.4KB |
| `web/src/components/session/files/FilePreview.tsx` | Shiki highlighter + IDE URL builder + binary/truncated states | ✓ VERIFIED | 326 lines |
| `web/src/components/session/files/FilePreviewHeader.tsx` | Path + Chip + Open-in-IDE button | ✓ VERIFIED | 116 lines, button gated on `ideUrl !== null` |
| `web/src/hooks/useFileTree.ts` | React Query hook | ✓ VERIFIED | 18 lines |
| `web/src/hooks/useFileContent.ts` | React Query hook | ✓ VERIFIED | 14 lines, `enabled: !!path && !!sessionId` |
| `web/src/hooks/useFileIndex.ts` | React Query hook, 60s staleTime | ✓ VERIFIED | 16 lines |
| `web/src/components/chat/FileAutocomplete.tsx` | Fuse.js + keyboard nav + anchor popup | ✓ VERIFIED | 235 lines |
| `web/src/components/chat/ChatInput.tsx` | `findAtToken` + mutual exclusion + handleFileSelect | ✓ VERIFIED | 463 lines, see lines 112-145, 160-171, 182-188, 222-230 |
| `web/src/components/chat/ChatPanel.tsx` | `useFileIndex` gated on RUNNING, passes `fileIndex` | ✓ VERIFIED | line 16-17, 42-43, 276 |
| `web/src/pages/settings/GeneralSettings.tsx` | IDE Command TextField between Skills and Claude | ✓ VERIFIED | lines 43, 56, 80, 141-152 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `WorkspaceController` | `WorkspaceInteractor` | DI | ✓ WIRED | `workspace.controller.ts:39` `private readonly workspaceInteractor` |
| `WorkspaceInteractor` | `WorkspaceFileListingService` | DI | ✓ WIRED | `workspace.interactor.ts:29` `private readonly fileListingService` |
| `WorkspaceFileListingService` | `DockerEngineService.execInContainer` | Array-form exec | ✓ WIRED | 8+ call sites using `['git', 'ls-files', ...]` / `['stat', ...]` / `['cat', ...]` — no shell concat |
| `workspace.api.ts` | `/api/sessions/:id/files` | `apiClient.get` | ✓ WIRED | 3 endpoints with `encodeURIComponent(path)` |
| `SessionsModule` imports `WorkspaceModule` | — | `@Module` | ✓ WIRED | `sessions.module.ts:42,57` |
| `SessionDetails` → `FilesPanel` | `SessionTabPanel active={activeTab === 'files'}` | JSX | ✓ WIRED | `SessionDetails.tsx:1039-1044` |
| `FilesPanel` → `FileTree` + `FilePreview` | `selectedFile` state lift | JSX | ✓ WIRED | `FilesPanel.tsx:20,43-45,57-62` |
| `FileTree` → `useFileTree` | React Query per-path | Hook call | ✓ WIRED | `FileTree.tsx:44` |
| `FilePreview` → `useFileContent` | React Query on filePath | Hook call | ✓ WIRED | `FilePreview.tsx:113-116` |
| `ChatInput` → `FileAutocomplete` | `showFileAutocomplete` | Conditional render | ✓ WIRED | `ChatInput.tsx:222-230` |
| `useFileIndex` → `workspaceApi.getFileIndex` | React Query queryFn | Function call | ✓ WIRED | `useFileIndex.ts:10` |
| `FileAutocomplete` → `Fuse.search` | Fuzzy search | `fuse.search(filter)` | ✓ WIRED | `FileAutocomplete.tsx:53-56` |
| `ChatPanel` gates `useFileIndex` on `SessionStatus.RUNNING` | — | Hook `enabled` flag | ✓ WIRED | `ChatPanel.tsx:42-43` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `FileTree` | `data.entries` (FileEntry[]) | `useFileTree` → `workspaceApi.listDirectory` → server `WorkspaceFileListingService.listDirectory` (git ls-files in container) | Yes — live `docker exec` into running container | ✓ FLOWING |
| `FilePreview` | `data.content` (string) | `useFileContent` → `workspaceApi.getFileContent` → server `WorkspaceFileListingService.getFileContent` (`stat` + `cat`/`head`) | Yes — live docker exec read | ✓ FLOWING |
| `FileAutocomplete` | `files` prop (string[]) | `ChatPanel.useFileIndex` → `workspaceApi.getFileIndex` → `WorkspaceFileIndexService.buildIndex` (git ls-files) | Yes — cached 60s TTL | ✓ FLOWING |
| `FilePreviewHeader` | `ideUrl` (string\|null) | `FilePreview.buildIdeUrl(data.path, hostMountPath, ideCommand)`; `hostMountPath` from `session.hostMountPath`, `ideCommand` from `useSettingsStore().settings.ideCommand` | Yes — derived from session row + persisted Settings | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Server TypeScript compiles | `cd server && npx tsc --noEmit` | Exit 0 (per SUMMARY self-checks) | ✓ PASS |
| Web TypeScript compiles | `cd web && npx tsc --noEmit` | Exit 0 (per SUMMARY self-checks) | ✓ PASS |
| Server tests pass | `cd server && npm test` | 43/43 (per 03-01 SUMMARY) | ✓ PASS |
| Web tests pass | `cd web && npx vitest run --project unit` | 50/50 (per 03-02/03-03 SUMMARY) | ✓ PASS |
| `ignore` dep installed | `grep '"ignore"' server/package.json` | `"ignore": "^7.0.5"` | ✓ PASS |
| `shiki` dep installed | `grep '"shiki"' web/package.json` | `"shiki": "^4.0.2"` | ✓ PASS |
| `fuse.js` dep installed | `grep '"fuse.js"' web/package.json` | `"fuse.js": "^7.3.0"` | ✓ PASS |
| `@` regex rejects emails | pattern `(^\|\s)@` requires word-boundary | confirmed in `ChatInput.tsx:114` | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CTXT-01 | 03-03 | @-mention file autocomplete | ✓ SATISFIED | `FileAutocomplete.tsx`, `findAtToken` in `ChatInput.tsx:112-120`, `ChatPanel.tsx` wires `useFileIndex` |
| CTXT-02 | 03-01, 03-02 | Browse container workspace file tree | ✓ SATISFIED | API: `WorkspaceController.listDirectory`. UI: `FilesPanel` + `FileTree` in `SessionDetails.tsx:1039-1044` |
| CTXT-03 | 03-01 | .gitignore filtering | ✓ SATISFIED | `listDirectoryViaGit` uses `git ls-files --cached --others --exclude-standard`; `listDirectoryViaFind` fallback seeds `ignore()` from `.gitignore` (root-only — see IN-04) |
| CTXT-04 | 03-01, 03-02, 03-03 | Open in IDE via Settings.ideCommand | ✓ SATISFIED | Persistence: `general-settings.embedded.ts:20`. UI button: `FilePreviewHeader.tsx:98-112` gated on `ideUrl !== null`. Settings form: `GeneralSettings.tsx:141-152` |

All 4 phase requirement IDs (CTXT-01, CTXT-02, CTXT-03, CTXT-04) are declared in the PLAN frontmatter `requirements:` fields (01→02/03/04, 02→02/04, 03→01/04) and match REQUIREMENTS.md mappings for this phase. No orphaned requirements.

### Anti-Patterns Found

Inventoried from 03-REVIEW.md. None block phase goal; all are hardening / follow-up items.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `workspace-file-index.service.ts` | 16,48 | Unbounded cache — no eviction on session delete (WR-01) | ⚠️ Warning | Memory growth over long-running servers; follow-up |
| `workspace-file-index.service.ts` | 60-71 | `git ls-files` buffered in full before slicing (WR-02) | ⚠️ Warning | Peak memory proportional to repo size on large repos |
| `workspace-file-listing.service.ts` | 110-123, 172-209 | Symlinks followed without revalidation (WR-03) | ⚠️ Warning | Symlink traversal possible from inside container (defence-in-depth) |
| `workspace-file-listing.service.ts` | 200-224 | `head -c` may split UTF-8 multi-byte chars (WR-04) | ⚠️ Warning | Replacement char tail on truncated files |
| `FileTree.tsx` / `FileTreeItem.tsx` / `FileAutocomplete.tsx` | — | Missing ARIA roles and keyboard nav on tree (WR-05) | ⚠️ Warning | Keyboard-only / screen-reader users |
| `workspace.interactor.ts` | 75-81 | `invalidateFileIndex` dead code (WR-06) | ⚠️ Warning | File index stale up to 60s after agent file mutations |
| `session.routes.ts` | 12-14 | Duplicate `WORKSPACE_*` enum entries vs `WorkspaceRoutes` (IN-01) | ℹ️ Info | Dead code |
| `workspace.interactor.ts`, `workspace-file-listing.service.ts` | — | Unused `Logger` fields (IN-02) | ℹ️ Info | Dead state |
| `workspace-file-listing.service.ts` | 15-56 | Binary detection is extension-only (IN-03) | ℹ️ Info | Extensionless binaries could leak as garbled UTF-8 |
| `workspace-file-listing.service.ts` | 272-312 | Fallback honours only root `.gitignore` (IN-04) | ℹ️ Info | Nested .gitignore ignored in find-path |
| `workspace-file-index.service.ts` | 20-46 | Thundering herd on TTL expiry (IN-05) | ℹ️ Info | Duplicate docker-exec under load |
| `FilePreview.tsx` | 125-164 | Effect depends on `data` object identity (IN-06) | ℹ️ Info | Unneeded re-highlight on refetch |
| `FilePreview.tsx` | 53-89 | `buildIdeUrl` doesn't URL-encode host path (IN-07) | ℹ️ Info | Fragile for paths with spaces/#/? |
| `FileAutocomplete.tsx` | 27 | `isFolder` via trailing `/` — git ls-files never emits folders (IN-08) | ℹ️ Info | Dead code path |
| `workspace.controller.ts` | 146-164 | `handleError` re-wraps non-HTTP errors as 400 (IN-09) | ℹ️ Info | Masks 500s as 400s |

### Human Verification Required

See frontmatter `human_verification:` list. The phase goal is achieved in code (all wiring, data flow, conditionals present), but the following **12 behaviours require a running app** to confirm:

1. **Files tab renders VS Code-style tree** — visual layout
2. **Folder expansion lazy-loads children** — DevTools Network verification
3. **.gitignore filtering honoured in real container** — end-to-end with real git repo
4. **Syntax-highlighted preview + binary + truncated states** — visual rendering
5. **Open in IDE button gating (visible/absent, not disabled)** — compare with/without host mount
6. **Open in IDE actually launches IDE** — OS protocol dispatch
7. **@-mention triggers after space (rejects email pattern)** — live input
8. **Fuzzy search ranking** — subjective relevance judgement
9. **Keyboard navigation in FileAutocomplete** — keydown event flow
10. **@-mention and /skill coexist without overlap** — state-machine behaviour
11. **IDE command persists across reload** — DB round-trip
12. **Ctrl+` cycles 3 tabs** — hotkey dispatch

### Gaps Summary

**No gaps in phase goal achievement (post-gap-closure re-verification).** The two UAT failures reported in `03-UAT.md` (Test 7 hotkey, Test 8 ideCommand persistence) are now fixed in code, backed by an e2e regression for the persistence chain, and a single-line cross-platform binding for the hotkey. The blocked Test 9 (Open-in-IDE button) is unblocked by the Test 8 fix.

All 21 must-have truths are verified in the codebase (17 from initial plans 03-01/02/03 + 4 from plan 03-04). All artifacts exist, are substantive, are wired together, and data flows from the running container through the server interactor → REST API → React Query hooks → UI components. Settings E2E suite passes 19/19 per the 03-04 SUMMARY.

The anti-patterns inventoried in 03-REVIEW.md are hardening findings (cache-eviction, symlink defence-in-depth, accessibility, error-mapping semantics) — they do not block the phase goal and are appropriate candidates for follow-up work. Several (WR-01 cache leak, WR-06 invalidation wiring) are explicitly flagged as "follow-up" in the 03-01 SUMMARY. No new anti-patterns were introduced by plan 03-04 (03-REVIEW or 03-REVIEW post-plan-04 content confirms clean with 1 info item — see `1a6cd7a review(03): gap closure review for plan 03-04 — clean, 1 info item`).

The `human_needed` status persists because the inherent UAT requirements of a UI-heavy phase — visual rendering, keyboard behaviour across browsers, OS-level IDE protocol dispatch, live DB round-trip through the Settings form, and end-to-end verification against a real container — cannot be grep-verified. The 3 previously-failing/blocked UAT tests (7, 8, 9) are now ready for human re-run; the remaining 9 UAT items from the initial verification are unchanged.

---

_Initial verification: 2026-04-17_
_Re-verification (post-gap-closure plan 03-04): 2026-04-17T11:30Z_
_Verifier: Claude (gsd-verifier)_
