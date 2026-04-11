# Phase 1: Session UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-11
**Phase:** 01-session-ux
**Areas discussed:** Terminal integration, View layout, Toggle placement, Terminal behavior

---

## Terminal Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Embed xterm.js | Add xterm.js as a dependency, connect via WebSocket. Full native terminal in-page. | ✓ |
| Iframe the terminal URL | Embed existing terminalUrl in an iframe. Less work but iframe quirks. | |

**User's choice:** Embed xterm.js
**Notes:** Recommended for most fluid UX, no iframe focus/keyboard issues.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep both (embed + popup) | Embedded by default, pop-out button for separate window | ✓ |
| Replace entirely | Remove popup, embedded terminal only | |

**User's choice:** Keep both

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse existing backend | Connect xterm.js to whatever WebSocket the current terminal URL exposes | |
| New Socket.IO channel | Add PTY stream through session gateway for tighter integration | ✓ |

**User's choice:** New Socket.IO channel

| Option | Description | Selected |
|--------|-------------|----------|
| Default shell | Drop into the container's shell, same as current popup | ✓ |
| Agent environment | Match the agent's working directory and user context | |

**User's choice:** Default shell

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-resize | xterm.js fit addon, dynamic rows/cols | ✓ |
| Fixed size | Standard terminal dimensions, scrollable if too small | |

**User's choice:** Auto-resize

---

## View Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Tab switch (one at a time) | Full-height view for whichever is active, like browser tabs | ✓ |
| Split pane (side by side) | Both visible simultaneously, resizable divider | |
| Both modes | Default to tab switch, option to split for power users | |

**User's choice:** Tab switch (one at a time)

| Option | Description | Selected |
|--------|-------------|----------|
| Instant swap | No animation, immediate switch | ✓ |
| Subtle fade | Quick crossfade between views | |

**User's choice:** Instant swap

| Option | Description | Selected |
|--------|-------------|----------|
| Chat default | Chat is primary, terminal is secondary | |
| Remember last used | Per-session persistence of which tab was active | ✓ |

**User's choice:** Remember last used

---

## Toggle Placement

| Option | Description | Selected |
|--------|-------------|----------|
| In the session status bar | Replace terminal popup button with inline toggle | |
| Dedicated tab bar | Thin MUI Tabs bar between status bar and content | ✓ |

**User's choice:** Dedicated tab bar

| Option | Description | Selected |
|--------|-------------|----------|
| MUI Tabs | Consistent with Settings page, uses existing theme overrides | ✓ |
| Icon-only tabs | Chat icon + Terminal icon, compact | |
| Icon + label tabs | Icons with text labels | |

**User's choice:** MUI Tabs

| Option | Description | Selected |
|--------|-------------|----------|
| Yes (Ctrl+`) | Keyboard shortcut similar to VS Code terminal toggle | ✓ |
| No | Mouse/touch only for now | |

**User's choice:** Yes, keyboard shortcut

| Option | Description | Selected |
|--------|-------------|----------|
| Extensible | Design tab bar for future tabs (diff viewer, file explorer) | ✓ |
| Just two for now | Keep simple, refactor when needed | |

**User's choice:** Extensible

---

## Terminal Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Stay mounted (hidden) | Preserves scrollback, running processes visible on return | ✓ |
| Unmount and reconnect | Lighter on resources but loses visual scrollback | |

**User's choice:** Stay mounted (recommended default — user skipped question)

| Option | Description | Selected |
|--------|-------------|----------|
| Badge/dot indicator | Visual cue on Terminal tab when unread output | ✓ |
| No indicator | Just switch and see | |

**User's choice:** Badge indicator on terminal tab

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, badge on chat tab | Consistent with terminal indicator | ✓ |
| No | Chat has its own notification patterns | |

**User's choice:** Badge on chat tab too (bidirectional)

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-reconnect silently | Background reconnect with brief status indicator | ✓ |
| Manual reconnect | Show reconnect button overlay | |

**User's choice:** Auto-reconnect silently

| Option | Description | Selected |
|--------|-------------|----------|
| Inherit app theme | Match MUI theme colors for cohesive look | ✓ |
| Terminal-standard theme | Classic terminal colors for familiarity | |

**User's choice:** Inherit app theme

| Option | Description | Selected |
|--------|-------------|----------|
| Selection auto-copies | Right-click to paste | |
| Ctrl+Shift+C/V | Standard Linux terminal convention | |
| You decide | Claude's discretion | ✓ |

**User's choice:** Claude's discretion

---

## Claude's Discretion

- Terminal copy/paste behavior
- Badge styling and animation details
- Terminal font family and size
- Error state handling when PTY connection fails
- Scrollback buffer size

## Deferred Ideas

None — discussion stayed within phase scope
