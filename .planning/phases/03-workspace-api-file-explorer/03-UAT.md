---
status: diagnosed
phase: 03-workspace-api-file-explorer
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md]
started: 2026-04-17T09:19:21Z
updated: 2026-04-17T09:35:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Files Tab Appears in Session
expected: |
  Open a running session. A "Files" tab (folder icon) appears in the tab bar
  alongside Chat and Terminal. The tab is disabled (greyed out) while the
  session is initializing and becomes enabled once the container is running
  and healthy.
result: pass

### 2. File Tree Lists Workspace with .gitignore Filtering
expected: |
  Click the Files tab. The left pane renders the workspace tree: directories
  listed first, then files, alphabetical within each group. Paths covered by
  .gitignore (e.g. node_modules, .env, dist) do NOT appear. Files shown use
  monospace font with type-appropriate icons (code, json, image, etc.).
result: pass

### 3. Lazy Folder Expansion
expected: |
  Click a folder row. Its chevron rotates 90° and immediate children render
  indented below (a brief loading spinner may flash). Clicking again collapses.
  Clicking a deeply nested folder only fetches that folder's children —
  siblings stay collapsed.
result: pass

### 4. File Preview with Syntax Highlighting
expected: |
  Click a text file (e.g. a .ts/.py/.md file). The right pane shows the file
  content with Shiki syntax highlighting (github-dark theme). The header shows
  the file's relative path (monospace) and a language chip matching the file
  type. Unknown extensions render as plain text without crashing.
result: pass

### 5. Binary File Preview Placeholder
expected: |
  Click a binary file (an image, .zip, font, etc.). The right pane shows
  "Binary file — cannot preview" instead of dumping bytes. No syntax
  highlighting is attempted.
result: pass

### 6. Large File Truncation Warning
expected: |
  Open a file larger than 512KB. The preview shows the first 512KB of content
  and the header displays an amber warning "File truncated (>512KB)" next to
  the language chip.
result: pass

### 7. Ctrl+` Cycles Tabs (chat → terminal → files → chat)
expected: |
  With focus in the session page, press Ctrl+` repeatedly. Active tab cycles
  in order: chat → terminal → files → chat. Works from any starting tab.
result: issue
reported: "this isnt working for me. Im on a mac, would it be command+` ?"
severity: major

### 8. Settings: IDE Command Field Persists
expected: |
  Open Settings → General. An "IDE Integration" section sits between Skills
  and Claude Configuration with a text field labelled "IDE Command"
  (placeholder "cursor", helper text mentions cursor/code/zed). Enter
  "cursor", save. Reload the page — the value is still "cursor".
result: issue
reported: |
  It fails to persist. The response error is:
  {success: false, error: {message: ["property ideCommand should not exist"],
  code: "INTERNAL_ERROR"}, statusCode: 400}
severity: blocker

### 9. Open in IDE Button (gated on ideCommand + workspace mount)
expected: |
  With ideCommand set (e.g. "cursor") and a session that has a host workspace
  mount: selecting a file shows an "Open in IDE" button (with external-link
  icon) in the preview header. Clicking it asks the OS to hand off the URL to
  the IDE (cursor://file/...). Clearing ideCommand (or using a session with
  no host mount) completely removes the button from the header — not just
  disabled, the DOM node is absent.
result: blocked
blocked_by: prior-phase
reason: "I cant test this because it wont save. (blocked by Test 8 — ideCommand DTO whitelist bug)"

### 10. Chat @-Mention Autocomplete Opens
expected: |
  In the chat input of a running session, type "@". A dropdown appears ABOVE
  the input, labelled "Files", showing up to 20 workspace paths. Filenames
  appear bold in accent colour (JetBrains Mono); full relative paths render
  dimmed below each filename. Folder entries (paths ending "/") get a folder
  icon prefix.
result: pass

### 11. Fuzzy File Filter
expected: |
  With the file autocomplete open, continue typing characters after "@" (e.g.
  "@ses"). Results narrow via fuzzy search — paths don't need to start with
  the query; any fuzzy match (e.g. "session.service.ts", "useSession.ts")
  ranks to the top. Results hard-cap at 20.
result: pass

### 12. Autocomplete Keyboard Navigation
expected: |
  Arrow Down/Up moves the selection (highlighted row scrolls into view,
  wraps at the ends). Enter inserts "@<selected path> " as plain text into
  the chat input (trailing space, no styled chip) and closes the dropdown.
  Escape closes without inserting. Tab selects-and-closes (or just closes if
  nothing to select).
result: pass

### 13. @ Embedded in Email Does Not Trigger Dropdown
expected: |
  Type "user@example.com" into the chat input. The file autocomplete does
  NOT open — @ only triggers when preceded by start-of-input or whitespace.
result: pass

### 14. / and @ Autocompletes are Mutually Exclusive
expected: |
  Open the skill autocomplete by typing "/" — skill dropdown appears. Now
  type "@" somewhere in the same message. Only one autocomplete is visible
  at a time (slash wins when both could match). Sending a message or
  pressing Escape dismisses any open dropdown.
result: pass

## Summary

total: 14
passed: 11
issues: 2
pending: 0
skipped: 0
blocked: 1

## Gaps

- truth: "Ctrl+` cycles tabs chat → terminal → files → chat on all platforms"
  status: failed
  reason: "User reported: this isnt working for me. Im on a mac, would it be command+` ?"
  severity: major
  test: 7
  root_cause: |
    useHotkeys binding uses literal 'ctrl+`' which react-hotkeys-hook matches against
    event.ctrlKey only (not metaKey). On macOS users press ⌘+` (metaKey=true,
    ctrlKey=false) so the matcher short-circuits. The library supports a platform-aware
    'mod' token that accepts either Cmd or Ctrl.
  artifacts:
    - path: "web/src/pages/SessionDetails.tsx:166-176"
      issue: "useHotkeys bound to literal 'ctrl+`' — not cross-platform"
  missing:
    - "Change binding to 'mod+`, ctrl+`' (mod aliases ⌘ on mac / Ctrl elsewhere; ctrl+` kept as fallback when OS intercepts ⌘+` for window-cycling)"
  debug_session: .planning/debug/mac-hotkey-tab-cycle.md

- truth: "Saving ideCommand in Settings → General persists and survives reload"
  status: failed
  reason: 'User reported: It fails to persist. Response 400 with message ["property ideCommand should not exist"]'
  severity: blocker
  test: 8
  root_cause: |
    UpdateSettingsRequest DTO does not declare ideCommand, so the global ValidationPipe
    (whitelist: true, forbidNonWhitelisted: true) rejects the property with HTTP 400.
    Secondary bug: UpdateSettingsInteractor.execute also does not forward ideCommand into
    currentSettings.update({...}), so even after the DTO is fixed the value would still
    silently fail to persist. Domain entity layer (GeneralSettings.ideCommand,
    Settings.update) is already correct.
  artifacts:
    - path: "server/src/interactors/settings/update-settings/update-settings-request.dto.ts"
      issue: "ideCommand field missing from DTO — ValidationPipe rejects it"
    - path: "server/src/interactors/settings/update-settings/update-settings.interactor.ts:58-72"
      issue: "execute() does not forward ideCommand into currentSettings.update({...})"
  missing:
    - "Add `@IsOptional() @IsString() @MaxLength(100) @ApiProperty({ required: false, description: 'IDE command used to open workspaces (e.g. cursor, code)' }) ideCommand?: string;` to UpdateSettingsRequest (import MaxLength from class-validator if not already)"
    - "In UpdateSettingsInteractor.execute, add `ideCommand: request.ideCommand,` to the object literal passed to currentSettings.update({...}) around lines 59-72"
  debug_session: .planning/debug/ide-command-dto-whitelist.md
