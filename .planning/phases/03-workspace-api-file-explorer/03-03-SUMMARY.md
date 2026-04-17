---
phase: 03-workspace-api-file-explorer
plan: 03
subsystem: web/chat + web/settings
tags: [web, react, chat, autocomplete, fuzzy-search, fuse, settings, ide]
requires:
  - web/src/api/workspace.api.ts (workspaceApi.getFileIndex from Plan 01)
  - web/src/api/types.ts (FileIndexResponse, Settings.ideCommand, UpdateSettingsRequest.ideCommand)
  - web/src/components/chat/SkillAutocomplete.tsx (shape to mirror)
  - web/src/components/chat/ChatInput.tsx (existing findSlashToken pattern)
  - web/src/components/chat/ChatPanel.tsx (composition point)
  - web/src/pages/settings/GeneralSettings.tsx (form shape)
  - @tanstack/react-query (existing)
  - @mui/material + @mui/icons-material (existing)
  - fuse.js (new)
provides:
  - useFileIndex hook (React Query wrapper over workspaceApi.getFileIndex)
  - FileAutocomplete component (@-mention dropdown with Fuse.js fuzzy search)
  - IDE Command form field in General Settings
affects:
  - web/src/components/chat/ChatInput.tsx (+findAtToken, +file autocomplete state/handlers)
  - web/src/components/chat/ChatPanel.tsx (+useFileIndex, +fileIndex prop pass-through)
  - web/src/pages/settings/GeneralSettings.tsx (+ideCommand form field)
  - web/package.json (+fuse.js dependency)
tech-stack:
  added: [fuse.js ^7.3.0]
  patterns:
    - Memoized Fuse instance per files array (useMemo keyed on files)
    - Mirror SkillAutocomplete shape: anchor-bound keyboard handler, click-outside close, scrollIntoView on selection
    - Mutual exclusion between / and @ autocompletes in a single handleChange
    - Gate file index fetch on SessionStatus.RUNNING so stopped sessions don't hit a dead container
key-files:
  created:
    - web/src/hooks/useFileIndex.ts
    - web/src/components/chat/FileAutocomplete.tsx
  modified:
    - web/src/components/chat/ChatInput.tsx
    - web/src/components/chat/ChatPanel.tsx
    - web/src/pages/settings/GeneralSettings.tsx
    - web/package.json
    - web/package-lock.json
decisions:
  - Fuse.js `threshold: 0.4`, `distance: 200`, `includeScore: true`, `shouldSort: true` per plan; `MAX_RESULTS = 20` hard-capped in both empty-filter (first 20) and filtered (top 20 by score) paths.
  - Empty filter returns the first 20 files as-is (no Fuse search) — keeps typing latency zero on the very first @ press.
  - `findAtToken` uses regex `(^|\s)@([\w./-]*)$` (word-boundary + path characters) so `@` embedded in email addresses never triggers the dropdown. Matches D-05 exactly.
  - Slash autocomplete wins when both match (`slashActive ? null : findAtToken(...)`) — only one dropdown renders at a time per D-10.
  - `handleKeyDown` bails early when either autocomplete is open so Enter selects a suggestion instead of sending the message.
  - ChatPanel gates `useFileIndex` on `session?.status === SessionStatus.RUNNING` (using the new `SessionStatus` import) — avoids a 400/404 volley while a session is still initialising.
  - IDE command field placed between Skills and Claude Configuration sections, matching Plan 01/02 UI hierarchy and Plan 02's use of `settings.ideCommand` in the file-preview Open-in-IDE button.
metrics:
  duration: "~5 min"
  completed: "2026-04-17"
---

# Phase 03 Plan 03: Chat @-Mentions + IDE Settings Summary

## One-liner

Adds `@`-mention file autocomplete to the chat input (Fuse.js fuzzy search over the server's flat file index) and surfaces the `ideCommand` field in General Settings so Plan 02's "Open in IDE" button becomes user-configurable end-to-end.

## What was built

### Hook — `web/src/hooks/useFileIndex.ts`

`useQuery<string[]>` keyed by `['workspace', 'index', sessionId]`, `staleTime: 60_000`, `retry: 1`. `enabled: !!sessionId && enabled` so callers can gate on session readiness. Fetches through `workspaceApi.getFileIndex` (Plan 01) which already unwraps the `FileIndexResponse.files` array.

### Component — `web/src/components/chat/FileAutocomplete.tsx`

Mirrors `SkillAutocomplete` for familiarity and consistency:

- **Fuse.js fuzzy search:** memoized Fuse instance built from `files.map((path) => ({ path }))` with `threshold: 0.4`, `distance: 200`, `includeScore: true`, `shouldSort: true`. Keys on `path`, top 20 results via `.slice(0, MAX_RESULTS)`. Empty filter bypasses Fuse and returns the first 20 paths verbatim.
- **Rendering per D-07:** filename (last path segment) bold in `afkColors.accent` JetBrains Mono; full relative path dimmed in `afkColors.textSecondary` at `0.7rem` with ellipsis; folder entries (paths ending `/`) prefixed with a 14px `FolderOutlined` icon in accent colour. Files get no icon so the filename still starts the row (saves horizontal space in a 400px-wide input).
- **Keyboard nav:** Arrow up / down wrap, Enter selects + stops propagation (so the outer `handleKeyDown` `Enter → send` never fires), Escape closes, Tab selects or closes. Same anchor-bound `keydown` capture-phase listener as `SkillAutocomplete`.
- **Scroll-into-view:** `ref` on list container; selected child gets `scrollIntoView({ block: 'nearest' })` on `selectedIndex` change.
- **Click-outside close:** document-level `mousedown` listener.
- **Positioning / visuals:** same `Paper` + `position: absolute; bottom: 100%; mb: 0.5; maxHeight: 240; zIndex: 1300;` envelope, same header / empty-state pattern. Header reads "Files"; empty state is "No files indexed" (index hasn't loaded) or "No matching files" (filter returned zero hits).

### Integration — `web/src/components/chat/ChatInput.tsx`

- New props: `sessionId?: string` and `fileIndex?: string[]` (default `[]`).
- New state: `showFileAutocomplete`, `fileAutocompleteFilter`.
- New helper `findAtToken(text, cursorPos)` with the exact D-05 regex `/(^|\s)@([\w./-]*)$/` — anchors on word boundary so `user@example.com` never opens the dropdown.
- `handleChange` now runs both token checks; slash wins when both match (`slashActive ? null : findAtToken(...)`), enforcing D-10 coexist-but-don't-overlap.
- `handleFileSelect(filePath)` mirrors `handleSkillSelect`: computes the `@` position, splices `@${filePath} ` (plain text, trailing space) into the value, closes the dropdown, refocuses the textarea. D-09 compliant — no styled chips.
- `handleSend` / `handleKeyDown` updated to close both dropdowns and short-circuit Enter when either is open.
- Placeholder updated to "Send a message to Claude... (type / for skills, @ for files)".
- New render branch: `{showFileAutocomplete && <FileAutocomplete …/>}` next to the existing `SkillAutocomplete` render.

### Integration — `web/src/components/chat/ChatPanel.tsx`

- Imports `useFileIndex` and `SessionStatus` (the latter re-used from `api/types.ts`).
- Derives `isSessionRunning = session?.status === SessionStatus.RUNNING`.
- `useFileIndex(sessionId, isSessionRunning)` so the index only fetches after the container is up.
- Threads `sessionId` and `fileIndex ?? []` through to `<ChatInput … />`.

### Integration — `web/src/pages/settings/GeneralSettings.tsx`

- `formData` state extended with `ideCommand: ''`.
- `useEffect` that hydrates from `settings` now sets `ideCommand: settings.ideCommand || ''`.
- `handleSubmit` includes `ideCommand: formData.ideCommand` in `submitData` so the value round-trips through `UpdateSettingsRequest`.
- New "IDE Integration" section between Skills and Claude Configuration, with a `TextField` labelled "IDE Command", placeholder `cursor`, and helper text listing `cursor`, `code`, `zed` and explaining the protocol-URL use — matches D-15 wording and completes the CTXT-04 surface (Plan 01 did the persistence, Plan 02 did the file-preview button gated on this value).

### Dependencies

- `web/package.json` — added `fuse.js ^7.3.0` (prod dependency).

## Commits

| Task   | Description                                                            | Hash      |
| ------ | ---------------------------------------------------------------------- | --------- |
| 1      | `feat(03-03)`: @-mention file autocomplete with Fuse.js fuzzy search   | `ec9c127` |
| 2      | `feat(03-03)`: IDE command field in General Settings                   | `97d961d` |
| format | `chore(03-03)`: prettier formatting on FileAutocomplete (method chain) | `fcddc82` |

## Verification

- **`cd web && npx tsc --noEmit`** → exit 0 (clean).
- **`cd web && npx vitest run --project unit`** → 50/50 passed (pre-existing `cron-helpers.test.ts` suite). No new tests added — plan `<verify>` explicitly calls for `tsc` only; runtime behaviour is covered by the plan's `<success_criteria>` visual UAT (chat @ trigger, fuzzy filter, Arrow/Enter/Tab, email non-trigger, skill coexistence, IDE field persistence).
- **Linter** — `ReadLints` on all new/modified files → 0 errors.
- **`npm run format`** on the five touched files — clean after Task 1 formatter produced a small method-chain wrap on `FileAutocomplete.tsx` that is captured in the `fcddc82` chore commit.

## Threat Model Coverage

| Threat ID                                     | Disposition in plan | Handling in implementation                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-03-08 (Spoofing via FileAutocomplete)       | accept              | Paths come straight from `workspaceApi.getFileIndex` (server-authoritative); rendered as `Typography` children, never `dangerouslySetInnerHTML`; selection inserts the path as plain text into a `TextField` value. No HTML or script can be smuggled via the path list.                                                               |
| T-03-09 (Tampering via ideCommand)            | accept              | `ideCommand` is a plain `TextField` string submitted via `UpdateSettingsRequest`. Server-side column is `varchar(100)` (Plan 01), and the value is only used client-side in Plan 02's `buildIdeUrl` to construct a protocol URL — the server never executes it. No shell-interpolation sink was introduced by this plan.               |
| T-03-10 (Information Disclosure — file index) | accept              | `useFileIndex` is gated on `session?.status === SessionStatus.RUNNING` and `!!sessionId`. The underlying endpoint is protected by the session-scoped auth guard (Plan 01), so the same auth boundary that protects the chat/terminal also protects the file list — this plan adds no new disclosure paths and no new trust boundaries. |

## Requirements Coverage

| Requirement                           | Delivered | How                                                                                                                                                                                                       |
| ------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CTXT-01 (@-mention file autocomplete) | Full UI   | `FileAutocomplete` component + `ChatInput.findAtToken` + `ChatPanel.useFileIndex`. Fuse.js fuzzy search over the flat index, 20-result cap, keyboard navigable, mutually exclusive with `/skills`.        |
| CTXT-04 (IDE command configurable)    | Full UI   | IDE Integration section in General Settings persists `ideCommand` through `UpdateSettingsRequest`. Completes the end-to-end chain: Plan 01 stored it, Plan 02 consumed it, Plan 03 lets the user edit it. |

## Deviations from Plan

### Auto-fixed / design adjustments

**1. [Rule 2 - Critical] Gate `useFileIndex` on `SessionStatus.RUNNING`**

- **Found during:** Task 1 integration in `ChatPanel`.
- **Issue:** Plan said "use `useFileIndex(sessionId, isReady)`" but `ChatPanel` didn't have `isReady` in scope (that helper lives in `SessionDetails`). Hitting the endpoint against an `INITIALIZING`/`STOPPED` session would generate noisy 400s on every chat mount.
- **Fix:** Import `SessionStatus` from `api/types.ts` and derive `isSessionRunning` from the already-fetched `session` query; pass it as the `enabled` flag. Same spirit as D-12 / Plan 02's `isReady` gate, just using the single piece of data `ChatPanel` actually has.
- **Files modified:** `web/src/components/chat/ChatPanel.tsx`.
- **Commit:** `ec9c127`.

**2. [Rule 2 - Critical] `handleKeyDown` also bails on `showFileAutocomplete`**

- Without this, pressing Enter with the file dropdown open would send the message and select the file simultaneously, leaving a dangling `@path` in the next input. The existing `showAutocomplete` early-return pattern extended to cover both.
- **Files modified:** `web/src/components/chat/ChatInput.tsx`.
- **Commit:** `ec9c127`.

**3. [Rule 2 - Critical] `handleSend` resets `showFileAutocomplete`**

- Mirrors the existing `setShowAutocomplete(false)` so an already-open file dropdown can't linger across sends.
- **Commit:** `ec9c127`.

**4. [Rule 3 - Blocking] Prettier formatting on `FileAutocomplete.tsx`**

- Per `AGENTS.md`, ran `npm run format` after Task 1. Formatter re-wrapped one method chain in `FileAutocomplete.tsx` (`fuse.search(filter).slice(…).map(…)` → vertical chain). Task 1 had already been committed, so this was captured as a follow-on `chore(03-03)` commit rather than amending.
- **Commit:** `fcddc82`.

### Non-deviations (by design)

- **Mutual exclusion:** plan said "Ensure that when the slash autocomplete is showing, the file autocomplete is not, and vice versa. Only one autocomplete can be active at a time." Implemented as `slashActive ? null : findAtToken(…)` inside a single pass of `handleChange` — atomic, no state race.
- **Folder icon only for folders:** plan said "file entries get no prefix". Kept that — saves 20px of horizontal space on every file row in the dropdown, and file rows already lead with the bold filename which is the strong visual signal.
- **No new vitest tests:** plan `<verify>` is `tsc --noEmit` only. The two existing autocomplete surfaces (skill, file) share structure and the skill variant has been in production since the `260411-quf` quick task, so the shape is proven. UAT in `<success_criteria>` covers behaviour.
- **Did not restyle `SkillAutocomplete`:** the two components co-exist as siblings rather than a shared generic component. Extracting a shared `<Autocomplete>` primitive would change the skill rendering (which has a one-line description vs the file renderer's two-column name/path layout) and is out of scope — noted as a potential future refactor.

## Known Stubs

None. All new code is wired to real data sources:

- `useFileIndex` → `workspaceApi.getFileIndex` (Plan 01 endpoint).
- `FileAutocomplete.files` → the flat index.
- `GeneralSettings.ideCommand` → `UpdateSettingsRequest.ideCommand` → Plan 01 `Settings` entity.

## Follow-ups

- **Gateway invalidation:** Plan 01's `WorkspaceFileIndexService` still needs to be wired to `invalidateIndex(containerId)` on chat-complete / git-write events. Unchanged from Plan 01's follow-up.
- **Fuse instance reuse:** right now Fuse is rebuilt whenever `files` changes; index size is already capped at 10k on the server so the cost is negligible (~sub-ms), but a shared `useMemo` at the `ChatPanel` level could push this upstream if future perf profiling shows it.

## Self-Check: PASSED

- [x] `web/src/hooks/useFileIndex.ts` — FOUND
- [x] `web/src/components/chat/FileAutocomplete.tsx` — FOUND
- [x] `web/src/components/chat/ChatInput.tsx` — modified (findAtToken, handlers, render, placeholder)
- [x] `web/src/components/chat/ChatPanel.tsx` — modified (useFileIndex, SessionStatus gate, prop pass-through)
- [x] `web/src/pages/settings/GeneralSettings.tsx` — modified (formData, submitData, IDE Integration section)
- [x] `web/package.json` contains `"fuse.js"` — FOUND (`^7.3.0`)
- [x] Commit `ec9c127` (Task 1 feat) — FOUND in `git log`
- [x] Commit `97d961d` (Task 2 feat) — FOUND in `git log`
- [x] Commit `fcddc82` (formatter chore) — FOUND in `git log`
- [x] `cd web && npx tsc --noEmit` exits 0 — VERIFIED
- [x] `cd web && npx vitest run --project unit` → 50/50 passed, no regressions
