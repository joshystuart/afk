# Milestones

## v0.3.4 Workspace release (Shipped: 2026-04-18)

**Phases completed:** 3 phases, 11 plans, 15 tasks

**Git:** `v0.3.3` → `v0.3.4` (2026-04-12 → 2026-04-18)

**Key accomplishments:**

- PTY-over-WebSocket backend with interactive Docker exec, terminal socket events, and session-scoped lifecycle management
- xterm.js terminal with tab bar, keyboard shortcut, and SessionDetails integration for chat/terminal switching
- Skills directory on Settings with read-only bind mount and entrypoint symlinks to agent discovery paths
- Skills UI in General Settings and per-session mount toggle with opt-out and restart notice
- Workspace REST API: directory listing, file content, file index; `ideCommand` persisted in settings
- File explorer tab with VS Code-style tree, Shiki preview, and open-in-local-IDE when workspace mount is enabled
- @-mention autocomplete with Fuse.js fuzzy search wired into chat input
- Gap fixes: `ideCommand` round-trip on settings API; cross-platform tab-cycle (⌘+` / Ctrl+`) for chat vs terminal

---
