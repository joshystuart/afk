# Phase 3: Workspace API & File Explorer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-12
**Phase:** 03-workspace-api-file-explorer
**Areas discussed:** Explorer placement, @-mention autocomplete UX, File listing strategy, Open-in-IDE mechanism

---

## Explorer Placement

| Option | Description | Selected |
|--------|-------------|----------|
| New tab (Chat \| Terminal \| Files) | Full-width file tree, consistent with existing tab pattern, but can't see files while chatting | ✓ |
| Resizable side panel | File tree alongside chat/terminal, visible while composing prompts (like VS Code's sidebar) | |
| Slide-out drawer | Toggle open/closed with a button, overlays or pushes content | |

**User's choice:** New tab
**Notes:** Consistent with Phase 1 extensible tab bar design.

| Option | Description | Selected |
|--------|-------------|----------|
| VS Code–style indented tree | Expand/collapse folders, file icons by type, monospace font | ✓ |
| Flat breadcrumb list | Click into folders, breadcrumb trail to navigate back | |

**User's choice:** VS Code–style indented tree

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — split view | Tree on left, file content preview on right (read-only) | ✓ |
| No — tree only | Clicking opens in IDE or copies path | |

**User's choice:** Split view with read-only file preview

---

## @-Mention Autocomplete UX

| Option | Description | Selected |
|--------|-------------|----------|
| Type @ anywhere | Opens file autocomplete immediately | |
| Type @ after a space | Only triggers at word boundaries, avoids false positives | ✓ |

**User's choice:** @ after a space (word boundary trigger)

| Option | Description | Selected |
|--------|-------------|----------|
| Fuzzy search | Type partial path segments, matches across full path | ✓ |
| Prefix match | Type from start of path, folder-by-folder | |

**User's choice:** Fuzzy search (like VS Code's Cmd+P)

| Option | Description | Selected |
|--------|-------------|----------|
| File name (bold) + relative path (dimmed) | Like VS Code quick open | ✓ |
| Relative path only | Simpler, shows full context | |

**User's choice:** File name + relative path

| Option | Description | Selected |
|--------|-------------|----------|
| Both files and folders | @src/components/ references a directory | ✓ |
| Files only | Folders referenced by contents | |

**User's choice:** Both files and folders

| Option | Description | Selected |
|--------|-------------|----------|
| Inserts @path/to/file as inline text | Agent receives file path as context | ✓ |
| Styled chip/pill | Visual distinction, removable with backspace | |

**User's choice:** Inline text tag

---

## File Listing Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| git ls-files + git ls-files --others | Native .gitignore support, fast, git repos only | |
| find + parse .gitignore | Works everywhere, complex parsing | |
| Hybrid | git ls-files in git repos, find fallback | |
| You decide | Claude's discretion | ✓ |

**User's choice:** Claude's discretion (hybrid recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| REST endpoint | GET /api/sessions/:id/files?path=/, cacheable, React Query | ✓ |
| WebSocket event | Through existing session gateway | |

**User's choice:** REST endpoint

| Option | Description | Selected |
|--------|-------------|----------|
| Lazy load | Fetch children on folder expand | ✓ |
| Full tree upfront | Single request, slower for large repos | |

**User's choice:** Lazy loading

| Option | Description | Selected |
|--------|-------------|----------|
| Background index | Built on session connect, cached, refreshed periodically | |
| On-demand search | Each keystroke hits search endpoint | |

**User's choice:** Background index with live updates — must refresh when files are added or removed (after agent operations)

---

## Open-in-IDE Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| VS Code protocol handler | vscode://file/path, one click, VS Code only | |
| Configurable IDE command | User sets editor in Settings, server generates URL/command | ✓ |
| Copy host path | Universal, no IDE dependency | |

**User's choice:** Configurable IDE command

| Option | Description | Selected |
|--------|-------------|----------|
| Hide button entirely | Clean, no confusion | ✓ |
| Disabled button with tooltip | "Enable workspace mount to open files locally" | |

**User's choice:** Hide entirely when workspace mount not enabled

| Option | Description | Selected |
|--------|-------------|----------|
| Icon on each file row | Hover-revealed quick access | |
| Button in preview header | Open currently previewed file | ✓ |
| Both | Tree rows + preview header | |

**User's choice:** Preview header only

---

## Claude's Discretion

- File listing implementation approach (hybrid git ls-files + find, or alternative)
- File type icon set and styling
- File preview syntax highlighting library
- Debounce timing for @-mention search
- File index refresh strategy details
- Maximum file size for preview
- Empty state design
- Tree sort order
- Binary file display

## Deferred Ideas

None — discussion stayed within phase scope
