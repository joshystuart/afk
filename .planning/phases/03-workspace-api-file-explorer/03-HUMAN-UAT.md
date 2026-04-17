---
status: partial
phase: 03-workspace-api-file-explorer
source: [03-VERIFICATION.md]
started: 2026-04-17T07:20:00Z
updated: 2026-04-17T07:20:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Files tab renders VS Code-style tree
expected: Indented tree with folder/file icons, expand/collapse chevrons animate on click, selected row highlighted in accent colour
result: [pending]

### 2. Folder expansion lazy-loads children
expected: DevTools Network tab shows GET /api/sessions/:id/files?path=<dir> fires only when the folder is first expanded (not on mount)
result: [pending]

### 3. .gitignore filtering honoured in real container
expected: Open Files tab in a session with node_modules/ and a non-empty .gitignore; node_modules does not appear in the root listing
result: [pending]

### 4. Syntax-highlighted preview
expected: Clicking a .ts/.tsx file shows Shiki-highlighted content; clicking a binary (.png) shows "Binary file — cannot preview"; clicking a >512KB file shows "File truncated (>512KB)" warning chip
result: [pending]

### 5. Open in IDE button gating
expected: When Settings.ideCommand="cursor" AND session.hostMountPath is set, button appears in preview header; when either is missing, button is completely absent (not disabled)
result: [pending]

### 6. Open in IDE actually launches IDE
expected: Clicking "Open in IDE" on /workspace/repo/src/index.ts with hostMountPath=/Users/me/proj launches Cursor/VSCode at the correct local file
result: [pending]

### 7. @-mention triggers after a space
expected: Typing `@s` at start of input or after whitespace shows FileAutocomplete dropdown filtered for "s"; typing `user@example.com` does NOT trigger autocomplete
result: [pending]

### 8. Fuzzy search ranks sensibly
expected: Typing `@src/idx` ranks src/index.ts above unrelated paths; top 20 results shown
result: [pending]

### 9. Keyboard navigation in FileAutocomplete
expected: ArrowUp/Down moves selection, Enter inserts @path with trailing space, Escape closes, Tab selects-or-closes
result: [pending]

### 10. @-mention and /skill coexist without overlap
expected: Typing `/` shows SkillAutocomplete; typing `@` shows FileAutocomplete; never both simultaneously; Enter in one does not send the message
result: [pending]

### 11. IDE command persists across reload
expected: Save "cursor" in Settings > General > IDE Integration, reload the page, value remains populated
result: [pending]

### 12. Ctrl+` cycles 3 tabs
expected: Shortcut advances chat → terminal → files → chat
result: [pending]

## Summary

total: 12
passed: 0
issues: 0
pending: 12
skipped: 0
blocked: 0

## Gaps
