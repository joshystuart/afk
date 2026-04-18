# Phase 3: Workspace API & File Explorer - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can browse and reference container files directly from the web UI. This phase delivers a file explorer tab with a VS Code-style tree and read-only file preview, an `@`-mention autocomplete in the chat input for referencing files and folders, a REST API for listing files inside containers (.gitignore-aware), and a configurable open-in-IDE action for files when workspace mount is enabled. This phase does NOT deliver file editing, file upload/download, or real-time file watching.

</domain>

<decisions>
## Implementation Decisions

### Explorer Placement & Layout

- **D-01:** File explorer is a new tab in the session tab bar: Chat | Terminal | Files — consistent with Phase 1's extensible tab pattern
- **D-02:** VS Code-style indented tree with expand/collapse folders, file type icons, and monospace font
- **D-03:** Split view layout — file tree on the left, read-only file content preview on the right when a file is clicked
- **D-04:** Files tab component stays mounted but hidden when viewing other tabs (consistent with Phase 1 D-13 terminal behavior)

### @-Mention Autocomplete

- **D-05:** `@` character triggers file autocomplete only after a space (word boundary) — avoids false positives with email addresses or other `@` usage
- **D-06:** Fuzzy search across the full relative path — partial path segment matching like VS Code's Cmd+P
- **D-07:** Each suggestion shows: file/folder name (bold) + relative path (dimmed), like VS Code quick open
- **D-08:** Both files and folders appear in autocomplete — `@src/components/` references a whole directory as context
- **D-09:** Selection inserts `@path/to/file` as inline text in the prompt — agent receives the file path as context. No styled chips; plain text tag.
- **D-10:** `@`-mention autocomplete coexists with existing `/skill` autocomplete — different trigger characters, different data sources, both in `ChatInput`

### File Listing & API

- **D-11:** REST API endpoint (e.g., `GET /api/sessions/:id/files?path=/`) for listing directory contents — cacheable, works with React Query
- **D-12:** Lazy loading — each folder expansion fetches its children on demand (fast initial load, avoids large upfront payloads)
- **D-13:** Flat file index built on session connect for `@`-mention autocomplete — cached server-side, refreshed when files change (after agent operations complete or via periodic re-index)
- **D-14:** File listing respects .gitignore rules (CTXT-03 requirement)

### Open-in-IDE

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

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Session tab infrastructure (Phase 1)

- `web/src/hooks/useSessionTabs.ts` — Tab state management, extensible tab registry
- `web/src/components/session/SessionTabBar.tsx` — Tab bar component (add Files tab here)
- `web/src/components/session/SessionTabPanel.tsx` — Tab panel wrapper (mount Files panel)
- `web/src/components/session/TerminalView.tsx` — Pattern for a tab content component
- `web/src/pages/SessionDetails.tsx` — Session page integrating tabs, status bar, chat

### Existing autocomplete pattern

- `web/src/components/chat/ChatInput.tsx` — `findSlashToken` pattern for `/skill` autocomplete; add parallel `findAtToken` for `@` files
- `web/src/components/chat/SkillAutocomplete.tsx` — Autocomplete dropdown component pattern (keyboard nav, scroll, selection)
- `web/src/hooks/useSkills.ts` — Data hook pattern for autocomplete (mirror for file index)

### Docker exec infrastructure

- `server/src/libs/docker/docker-container-exec.service.ts` — `execInContainer()` runs commands inside containers (use for `ls`, `git ls-files`, `cat`, etc.)
- `server/src/libs/docker/docker.constants.ts` — `WORKSPACE_BASE_PATH`, `DEFAULT_EXEC_WORKING_DIR`, `getExecWorkingDir()`

### Settings and session config

- `server/src/domain/settings/settings.entity.ts` — Settings entity (add IDE command field)
- `web/src/pages/settings/GeneralSettings.tsx` — Settings form pattern (add IDE command field)
- `server/src/domain/sessions/session-config-dto.factory.ts` — Session config with mount path info (for host path derivation)
- `server/src/libs/docker/docker-container-provisioning.service.ts` — Container provisioning with bind mount paths

### Interactor/controller patterns

- `server/src/interactors/sessions/` — Existing session controllers (pattern for adding workspace file endpoints)
- `server/src/gateways/session.gateway.ts` — WebSocket gateway (for pushing file index updates)

### Requirements

- `.planning/REQUIREMENTS.md` — CTXT-01 through CTXT-04

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `SkillAutocomplete` component — Autocomplete dropdown with keyboard navigation, scroll-into-view, click-outside-close. Model for `FileAutocomplete`.
- `ChatInput.findSlashToken()` — Pattern for detecting trigger characters at cursor position. Duplicate for `@` with word-boundary check.
- `useSessionTabs` hook — Tab registration and state. Extend with `files` tab type.
- `DockerContainerExecService.execInContainer()` — Run commands inside containers and capture stdout/stderr. Foundation for file listing, file content reading, and file search.
- `useWebSocket` / `WebSocketProvider` — Session subscription pattern for pushing file index updates.
- `afkColors` theme — Consistent color palette for tree, preview, and autocomplete styling.

### Established Patterns

- REST + React Query for data fetching (`sessions.api.ts`, `useSession.ts`)
- Gateway service decomposition (`session-gateway-chat.service.ts`) — pattern if file index push is needed via WebSocket
- Settings embedded columns for new config fields (`GeneralSettings`, `DockerSettings`)
- Container options flow: settings → session config → container create options

### Integration Points

- `SessionDetails.tsx` — Add `files` to tab bar via `useSessionTabs`
- `ChatInput.tsx` — Add `@`-mention detection alongside existing `/skill` detection
- `server/src/interactors/sessions/` — New `workspace/` subfolder for file listing controller + interactor
- `server/src/libs/docker/docker-container-exec.service.ts` — Used by workspace interactor for file operations
- `web/src/api/sessions.api.ts` — Add file listing API functions
- `web/src/pages/settings/GeneralSettings.tsx` — Add IDE command configuration field

</code_context>

<specifics>
## Specific Ideas

- File explorer should feel like a lightweight VS Code explorer — expand/collapse folders, click to preview, instant and responsive
- `@`-mention should feel like VS Code's Cmd+P quick open — fuzzy search, file name prominent, path as secondary info
- The flat file index must stay current — stale autocomplete suggestions would be frustrating. Refresh after agent chat completions is the natural trigger since that's when files change.
- File preview should support syntax highlighting for common languages — making it useful for quick code review without leaving the browser
- The REST API approach keeps the architecture simple and cacheable, while the background file index handles the autocomplete performance requirement

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 03-workspace-api-file-explorer_
_Context gathered: 2026-04-12_
