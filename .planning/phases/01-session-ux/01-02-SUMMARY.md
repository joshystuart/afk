---
phase: 01-session-ux
plan: 02
subsystem: ui
tags: [xterm.js, react, mui, websocket, terminal]

requires:
  - phase: 01-session-ux/01
    provides: 'Terminal socket events (terminal.start/data/input/resize/close) on server'
provides:
  - 'useTerminal hook — PTY socket lifecycle with auto-reconnect'
  - 'useSessionTabs hook — tab state management with sessionStorage persistence'
  - 'TerminalView component — xterm.js wrapper with themed terminal and state overlays'
  - 'SessionTabBar component — extensible MUI Tabs from SessionTab[] registry'
  - 'SessionTabPanel component — mounted-but-hidden panel wrapper'
affects: [01-session-ux/03]

tech-stack:
  added:
    [
      '@xterm/xterm@6.0.0',
      '@xterm/addon-fit@0.11.0',
      '@xterm/addon-web-links@0.12.0',
    ]
  patterns:
    [
      'socket hook pattern (useTerminal follows useChat)',
      'tab registry pattern (SessionTab[])',
      'mounted-but-hidden panel toggling',
    ]

key-files:
  created:
    - web/src/hooks/useTerminal.ts
    - web/src/hooks/useSessionTabs.ts
    - web/src/components/session/TerminalView.tsx
    - web/src/components/session/SessionTabBar.tsx
    - web/src/components/session/SessionTabPanel.tsx
  modified:
    - web/package.json
    - web/package-lock.json

key-decisions:
  - 'Used atob/Uint8Array for base64 decode instead of Node Buffer for browser compatibility'
  - 'Terminal container always mounted with visibility:hidden when inactive to preserve xterm.js state'
  - 'ResizeObserver with 50ms debounce for responsive terminal sizing'

patterns-established:
  - 'Socket hook pattern: useTerminal mirrors useChat structure for terminal.* events'
  - 'Tab registry pattern: SessionTab[] interface for extensible tab definitions'
  - 'Panel visibility pattern: display flex/none for mounted-but-hidden tab content'

requirements-completed: [SEUX-01]

duration: 2min
completed: 2026-04-11
---

# Phase 01 Plan 02: Frontend Building Blocks Summary

**xterm.js terminal component with PTY socket hook, tab state management, and extensible tab bar using MUI**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-11T00:57:27Z
- **Completed:** 2026-04-11T00:59:45Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Installed xterm.js v6 with fit and web-links addons
- Created useTerminal hook with full PTY socket lifecycle (start/input/resize/close) and auto-reconnect on WebSocket drop (max 3 attempts)
- Created useSessionTabs hook with sessionStorage persistence keyed by session ID
- Built TerminalView with themed xterm.js instance, FitAddon auto-resize via ResizeObserver, and all five panel states (ready/connecting/not-running/disconnected/error) per UI-SPEC.md
- Built SessionTabBar as extensible MUI Tabs consuming SessionTab[] registry
- Built SessionTabPanel with display flex/none visibility toggle (no unmounting)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install xterm.js dependencies and create useTerminal + useSessionTabs hooks** - `02cdd11` (feat)
2. **Task 2: Create TerminalView, SessionTabBar, and SessionTabPanel components** - `e281702` (feat)

## Files Created/Modified

- `web/package.json` - Added @xterm/xterm, @xterm/addon-fit, @xterm/addon-web-links dependencies
- `web/package-lock.json` - Lock file updated with new deps
- `web/src/hooks/useTerminal.ts` - PTY socket lifecycle hook with auto-reconnect
- `web/src/hooks/useSessionTabs.ts` - Tab state management with sessionStorage persistence
- `web/src/components/session/TerminalView.tsx` - xterm.js wrapper with theme, fit addon, ResizeObserver, and state overlays
- `web/src/components/session/SessionTabBar.tsx` - Extensible MUI Tabs from SessionTab[] registry with badge support
- `web/src/components/session/SessionTabPanel.tsx` - Mounted-but-hidden panel wrapper

## Decisions Made

- Used `atob` + `Uint8Array` for base64 decoding instead of Node's `Buffer` for browser compatibility
- Terminal container kept always-mounted with `visibility: hidden` when inactive to preserve xterm.js internal state and avoid re-initialization costs
- ResizeObserver debounced at 50ms to batch rapid resize events without perceived lag

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All frontend building blocks ready for Plan 03 to wire into SessionDetails.tsx
- SessionTabBar accepts any SessionTab[] — future phases add tabs without modifying the component
- useTerminal hook ready to connect to server-side terminal events from Plan 01

## Self-Check: PASSED

All 5 created files verified present. Both commit hashes confirmed in git log. TypeScript compilation clean (`tsc --noEmit` exits 0). All acceptance criteria met.

---

_Phase: 01-session-ux_
_Completed: 2026-04-11_
