# Phase 1: Session UX - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can seamlessly switch between chat and terminal views within a session using an in-page tab toggle. The terminal is embedded directly in the session page rather than opened as a popup. Both views remain connected to the same session and reflect current state. This phase delivers the tab infrastructure, embedded terminal, and view-switching UX — not new session features or additional tab contents.

</domain>

<decisions>
## Implementation Decisions

### Terminal Integration
- **D-01:** Embed xterm.js as a direct dependency in the web app — no iframe, no external terminal URL for the in-page view
- **D-02:** Keep the existing terminal popup as a "pop-out" option alongside the embedded terminal (both available)
- **D-03:** Add a new PTY-over-WebSocket channel through the existing Socket.IO session gateway — do not reuse the current external terminal backend for the embedded view
- **D-04:** Terminal connects to the container's default shell (same as current popup behavior)
- **D-05:** Use xterm.js fit addon for auto-resize — terminal dynamically adjusts rows/cols to available space

### View Layout
- **D-06:** Full-view tab switch — only one view (chat or terminal) visible at a time, no split-pane
- **D-07:** Instant swap between tabs, no transition animation
- **D-08:** Remember last-used tab per session — persist which tab was active and restore it when reopening the session

### Toggle Placement
- **D-09:** Dedicated MUI Tabs bar between the session status bar and the content area — not inline in the status bar
- **D-10:** Use MUI Tabs component consistent with the existing Settings page pattern and existing theme overrides in `afk.ts`
- **D-11:** Keyboard shortcut to toggle between chat and terminal (Ctrl+` style, similar to VS Code)
- **D-12:** Design the tab bar component with extensibility in mind — future phases (diff viewer, file explorer) should be able to add tabs trivially

### Terminal Behavior
- **D-13:** Terminal component stays mounted but hidden when on the chat tab — preserves scrollback and running process output
- **D-14:** Badge/dot indicator on the Terminal tab when there's unread output while viewing chat
- **D-15:** Badge/dot indicator on the Chat tab when new messages arrive while viewing terminal — consistent bidirectional notification
- **D-16:** Auto-reconnect silently on WebSocket drop — brief status indicator during reconnection, no manual intervention required
- **D-17:** Terminal inherits the app's MUI dark theme colors for a cohesive look

### Claude's Discretion
- Terminal copy/paste behavior (selection auto-copy vs Ctrl+Shift+C/V — choose what works best cross-platform)
- Exact badge styling and animation
- Terminal font family and size (should feel native but match the app's design language)
- Error state handling when PTY connection fails
- Scrollback buffer size

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Session UI (existing implementation)
- `web/src/pages/SessionDetails.tsx` — Current session page layout, status bar, chat-only view, terminal popup handler
- `web/src/components/chat/ChatPanel.tsx` — Chat shell component (scroll region + ChatInput)
- `web/src/components/chat/ChatInput.tsx` — Chat input with model/agent mode controls
- `web/src/components/Layout.tsx` — App shell with top bar (48px) and sidebar

### WebSocket infrastructure
- `web/src/hooks/useWebSocket.tsx` — WebSocket provider, session subscription pattern
- `web/src/hooks/useChat.ts` — Chat-specific socket events pattern (model for new terminal events)
- `server/src/gateways/session.gateway.ts` — Server-side Socket.IO gateway (add PTY channel here)
- `server/src/gateways/session-gateway-chat.service.ts` — Pattern for gateway service decomposition

### Existing tab patterns
- `web/src/pages/Settings.tsx` — MUI Tabs usage pattern to follow
- `web/src/themes/afk.ts` — Existing MuiTab/MuiTabs theme overrides

### Session health
- `web/src/hooks/useSessionHealth.ts` — Terminal readiness check (terminalReady flag)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- MUI Tabs theme overrides in `web/src/themes/afk.ts` — reuse for the new session tab bar
- `useWebSocket` hook and `WebSocketProvider` — extend for PTY events following the same pattern as `useChat`
- `useSessionHealth` — already tracks `terminalReady`, can gate terminal tab availability
- `SessionDetails.tsx` status bar — the tab bar slots between this and the content area

### Established Patterns
- Gateway service decomposition: `session-gateway-chat.service.ts`, `session-gateway-fanout.service.ts` — new PTY service follows same pattern
- Socket event naming: `chat.send`, `chat.stream`, `chat.complete` — terminal events should follow `terminal.*` convention
- React Query + Zustand for state — tab active state could use local component state or Zustand for persistence

### Integration Points
- `SessionDetails.tsx` line ~752: `handleOpenTerminal` popup handler — keep as pop-out, add embedded view
- `server/src/gateways/gateways.module.ts` — register new PTY gateway service
- `web/package.json` — add `xterm`, `@xterm/addon-fit`, `@xterm/addon-web-links` dependencies
- `server/src/libs/docker/` — Docker exec for PTY stream creation into containers

</code_context>

<specifics>
## Specific Ideas

- Tab toggle should feel like VS Code's terminal panel — instant, keyboard-accessible, with activity indicators
- The tab bar should be designed so Phase 4 (file explorer) and Phase 5 (diff viewer) can add tabs without refactoring
- Terminal theme should feel cohesive with the rest of the app, not a jarring black box

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-session-ux*
*Context gathered: 2026-04-11*
