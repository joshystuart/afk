---
phase: 01-session-ux
plan: 03
subsystem: ui
tags: [react, tabs, keyboard-shortcut, badges, integration]

requires:
  - phase: 01-session-ux/01
    provides: "Terminal socket events (terminal.start/data/input/resize/close) on server"
  - phase: 01-session-ux/02
    provides: "useTerminal, useSessionTabs hooks, TerminalView, SessionTabBar, SessionTabPanel components"
provides:
  - "Integrated tabbed session page with chat and terminal panels"
  - "Keyboard shortcut (Ctrl+`/Cmd+`) for tab toggling"
  - "Unread badge indicators on both chat and terminal tabs"
affects: []

tech-stack:
  added: []
  patterns: [tabbed-interface-integration, socket-badge-detection, hotkey-tab-toggle]

key-files:
  created: []
  modified:
    - web/src/pages/SessionDetails.tsx

key-decisions:
  - "Socket listeners for terminal.data and chat.stream provide badge signals without polling"
  - "Both tab panels always mounted (display toggle) to preserve xterm.js and chat state"
  - "Separate useHotkeys calls for ctrl+` and meta+` to support both Windows/Linux and macOS"

patterns-established:
  - "Badge state managed in parent component, cleared on tab switch via useEffect"
  - "Tab registry defined as useMemo SessionTab[] array wired to SessionTabBar"

requirements-completed: [SEUX-01]

duration: 2min
completed: 2026-04-11
status: checkpoint-pending
---

# Phase 01 Plan 03: Tabbed Session Page Integration Summary

**Integrated tab bar, keyboard shortcut, and badge indicators into SessionDetails — wiring Plans 01 and 02 building blocks into the running-session view**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-11T01:02:58Z
- **Tasks:** 1/2 (Task 2 is human-verify checkpoint)
- **Files modified:** 1

## Accomplishments

- SessionTabBar rendered between status bar and content area in the running-session view
- ChatPanel and TerminalView wrapped in SessionTabPanel components with display flex/none toggle
- Keyboard shortcut Ctrl+`/Cmd+` toggles between chat and terminal tabs via react-hotkeys-hook
- Unread badge state tracked from `terminal.data` and `chat.stream` socket events, cleared on tab switch
- Popup terminal button preserved in status bar unchanged
- Tab state persisted per session via useSessionTabs hook (sessionStorage)
- Terminal tab disabled when health check reports terminal not ready

## Task Commits

1. **Task 1: Integrate tab bar, terminal panel, keyboard shortcut, and badge indicators into SessionDetails** - `eae6973` (feat)

## Files Created/Modified

- `web/src/pages/SessionDetails.tsx` - Added imports for tab components/hooks, useSessionTabs hook call, unread badge state and socket listeners, sessionTabs registry, useHotkeys keyboard shortcut, SessionTabBar and dual SessionTabPanel/TerminalView in JSX

## Decisions Made

- Used separate socket event listeners for `terminal.data` and `chat.stream` to detect cross-tab activity without polling
- Both panels always mounted with visibility toggle to preserve xterm.js terminal state and chat scroll position
- Two separate `useHotkeys` calls for `ctrl+\`` and `meta+\`` rather than combined pattern for explicit platform support

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Pending

Task 2 (checkpoint:human-verify) awaiting human verification of the complete tabbed session UX.

## Known Stubs

None — all data sources wired, no placeholder content.

## Self-Check: PENDING

Task 1 complete. Task 2 checkpoint pending human verification.

---
*Phase: 01-session-ux*
*Status: Checkpoint pending*
