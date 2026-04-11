# Phase 1: Session UX - Research

**Researched:** 2026-04-11
**Domain:** Frontend tabbed terminal integration with PTY-over-WebSocket backend
**Confidence:** HIGH

## Summary

This phase adds an in-page tabbed view switcher to the session page, embedding an xterm.js terminal alongside the existing chat panel. The server gets a new PTY gateway service that creates interactive Docker exec sessions and streams them over Socket.IO. Both views stay mounted for instant switching with no context loss.

The approach is straightforward: xterm.js v6 is the de facto browser terminal library, the project already has Socket.IO plumbing and MUI Tabs theme overrides, and Docker's exec API natively supports PTY allocation. The primary complexity lies in clean WebSocket lifecycle management (connect, resize, reconnect, cleanup) and making the terminal visually cohesive with the existing dark theme.

**Primary recommendation:** Use `@xterm/xterm` 6.0.0 with the fit and web-links addons on the frontend, and `dockerode` exec with `Tty: true` on the backend, piped through the existing Socket.IO session gateway as a new `SessionGatewayTerminalService`.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Embed xterm.js as a direct dependency in the web app — no iframe, no external terminal URL for the in-page view
- **D-02:** Keep the existing terminal popup as a "pop-out" option alongside the embedded terminal (both available)
- **D-03:** Add a new PTY-over-WebSocket channel through the existing Socket.IO session gateway — do not reuse the current external terminal backend for the embedded view
- **D-04:** Terminal connects to the container's default shell (same as current popup behavior)
- **D-05:** Use xterm.js fit addon for auto-resize — terminal dynamically adjusts rows/cols to available space
- **D-06:** Full-view tab switch — only one view (chat or terminal) visible at a time, no split-pane
- **D-07:** Instant swap between tabs, no transition animation
- **D-08:** Remember last-used tab per session — persist which tab was active and restore it when reopening the session
- **D-09:** Dedicated MUI Tabs bar between the session status bar and the content area — not inline in the status bar
- **D-10:** Use MUI Tabs component consistent with the existing Settings page pattern and existing theme overrides in `afk.ts`
- **D-11:** Keyboard shortcut to toggle between chat and terminal (Ctrl+` style, similar to VS Code)
- **D-12:** Design the tab bar component with extensibility in mind — future phases (diff viewer, file explorer) should be able to add tabs trivially
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

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                       | Research Support                                                                                                                                |
| ------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| SEUX-01 | User can tab between chat view and terminal view within a session | Tab infrastructure (MUI Tabs + extensible registry), embedded xterm.js terminal, PTY-over-Socket.IO backend, keyboard shortcut, activity badges |

</phase_requirements>

## Standard Stack

### Core

| Library                      | Version    | Purpose                           | Why Standard                                                                                                           |
| ---------------------------- | ---------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| @xterm/xterm                 | 6.0.0      | Terminal emulator in browser      | [VERIFIED: npm registry] De facto standard for browser terminals. Used by VS Code, Theia, Gitpod. v6 is current major. |
| @xterm/addon-fit             | 0.11.0     | Auto-resize terminal to container | [VERIFIED: npm registry] Official addon, required for responsive layouts (D-05)                                        |
| @xterm/addon-web-links       | 0.12.0     | Clickable URLs in terminal output | [VERIFIED: npm registry] Official addon, standard UX enhancement                                                       |
| dockerode                    | (existing) | Docker Engine API — exec with PTY | [VERIFIED: codebase] Already in server/package.json, used by DockerContainerExecService                                |
| socket.io / socket.io-client | (existing) | Real-time PTY data transport      | [VERIFIED: codebase] Already powering chat, logs, job runs via session gateway                                         |
| react-hotkeys-hook           | (existing) | Keyboard shortcut for tab toggle  | [VERIFIED: codebase] Already a web dependency, used in ChatInput for Shift+Tab                                         |
| @mui/material Tabs           | (existing) | Tab bar UI component              | [VERIFIED: codebase] Already themed in afk.ts, used in Settings page                                                   |

### Supporting

| Library                | Version | Purpose                   | When to Use                                                        |
| ---------------------- | ------- | ------------------------- | ------------------------------------------------------------------ |
| @xterm/addon-unicode11 | latest  | Unicode width calculation | If terminal text alignment issues appear with CJK/emoji characters |
| @xterm/addon-clipboard | latest  | Enhanced clipboard API    | If cross-browser clipboard issues arise                            |

### Alternatives Considered

| Instead of            | Could Use          | Tradeoff                                                                                              |
| --------------------- | ------------------ | ----------------------------------------------------------------------------------------------------- |
| @xterm/xterm          | terminal.js        | xterm.js is industry standard, massive ecosystem, VS Code-backed. No reason to consider alternatives. |
| Socket.IO PTY channel | Separate WebSocket | Would require new auth, connection lifecycle. Reusing Socket.IO is simpler and consistent with D-03.  |

**Installation:**

```bash
cd web && npm install @xterm/xterm@6.0.0 @xterm/addon-fit@0.11.0 @xterm/addon-web-links@0.12.0
```

**Version verification:** All versions confirmed against npm registry on 2026-04-11.

## Architecture Patterns

### Recommended Project Structure

**Frontend:**

```
web/src/
├── components/
│   ├── session/
│   │   ├── SessionTabBar.tsx          # Extensible tab bar (D-09, D-12)
│   │   ├── SessionTabPanel.tsx        # Tab content wrapper (show/hide, D-13)
│   │   └── TerminalView.tsx           # xterm.js wrapper component
│   └── chat/
│       └── ChatPanel.tsx              # (existing, no changes needed)
├── hooks/
│   ├── useTerminal.ts                 # PTY socket lifecycle hook
│   └── useSessionTabs.ts             # Tab state management + persistence (D-08)
└── pages/
    └── SessionDetails.tsx             # Refactored: status bar → tab bar → tab panels
```

**Backend:**

```
server/src/
├── gateways/
│   ├── session-gateway-terminal.service.ts  # PTY lifecycle (new, follows chat service pattern)
│   └── session-gateway.events.ts            # Add terminal.* events
└── libs/docker/
    └── docker-container-exec.service.ts     # Add execInteractive() for PTY
```

### Pattern 1: Gateway Service Decomposition (Existing)

**What:** Each Socket.IO concern gets its own injectable service, injected into the main gateway.
**When to use:** For the new terminal PTY service — follows `SessionGatewayChatService` pattern exactly.
**Example:**

```typescript
// Source: server/src/gateways/session-gateway-chat.service.ts (existing pattern)
@Injectable()
export class SessionGatewayTerminalService {
  constructor(
    private readonly subscriptions: SessionGatewaySubscriptionsService,
    private readonly dockerExec: DockerContainerExecService,
  ) {}

  async handleTerminalStart(
    server: Server,
    data: { sessionId: string; cols: number; rows: number },
  ) {
    // Create PTY exec, pipe to socket room
  }
}
```

### Pattern 2: Socket Event Naming Convention (Existing)

**What:** Events use dot-delimited namespaces: `{domain}.{action}`.
**When to use:** New terminal events follow: `terminal.start`, `terminal.data`, `terminal.resize`, `terminal.close`.
**Example:**

```typescript
// Source: server/src/gateways/session-gateway.events.ts (extend existing)
export const SOCKET_EVENTS = {
  // ... existing events ...
  terminalStart: 'terminal.start',
  terminalData: 'terminal.data',
  terminalInput: 'terminal.input',
  terminalResize: 'terminal.resize',
  terminalClose: 'terminal.close',
  terminalError: 'terminal.error',
  terminalStarted: 'terminal.started',
} as const;
```

### Pattern 3: Mounted-but-Hidden Tab Panels (D-13)

**What:** Both chat and terminal components stay in the DOM; visibility toggled via CSS `display: none` / `display: flex`.
**When to use:** Required by D-13 — terminal must preserve scrollback and not disconnect when switching to chat.
**Example:**

```typescript
// Keep both mounted, toggle visibility
<Box sx={{ display: activeTab === 'chat' ? 'flex' : 'none', flex: 1, minHeight: 0 }}>
  <ChatPanel sessionId={sessionId} />
</Box>
<Box sx={{ display: activeTab === 'terminal' ? 'flex' : 'none', flex: 1, minHeight: 0 }}>
  <TerminalView sessionId={sessionId} />
</Box>
```

### Pattern 4: Extensible Tab Registry (D-12)

**What:** Tab definitions as a typed array/registry that components can extend without modifying the tab bar itself.
**When to use:** Designing the tab bar so future phases (file explorer, diff viewer) add tabs trivially.
**Example:**

```typescript
interface SessionTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: boolean;
  disabled?: boolean;
}

const SESSION_TABS: SessionTab[] = [
  { id: 'chat', label: 'Chat', icon: <ChatIcon /> },
  { id: 'terminal', label: 'Terminal', icon: <TerminalIcon /> },
  // Future phases add here: { id: 'files', ... }, { id: 'diff', ... }
];
```

### Anti-Patterns to Avoid

- **Unmounting terminal on tab switch:** Would destroy xterm instance, lose scrollback, and disconnect PTY. Use CSS visibility instead.
- **Creating a new WebSocket connection for terminal:** The project already has Socket.IO with auth, rooms, and reconnection. Adding a separate WS connection duplicates auth and complicates lifecycle.
- **Sharing the TTY exec between embedded and popup terminal:** They're different transport mechanisms (Socket.IO vs ttyd). Each should have its own shell session. The container already runs tmux so users can create multiple sessions.
- **Polling for terminal data:** PTY data must stream in real-time. Use Socket.IO event-driven push.

## Don't Hand-Roll

| Problem                   | Don't Build                          | Use Instead                            | Why                                                                                                      |
| ------------------------- | ------------------------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Terminal emulation        | Custom ANSI parser                   | @xterm/xterm                           | Thousands of ANSI escape sequences, Unicode width tables, selection, accessibility. Years of edge cases. |
| Terminal auto-resize      | Manual ResizeObserver + row/col math | @xterm/addon-fit                       | Correctly calculates rows/cols from pixel dimensions accounting for font metrics                         |
| URL detection in terminal | Regex over terminal buffer           | @xterm/addon-web-links                 | Handles URLs wrapped across lines, various URL formats                                                   |
| PTY allocation in Docker  | Raw Docker API calls                 | dockerode exec with `Tty: true`        | Handles stream multiplexing, hijack protocol                                                             |
| Keyboard shortcuts        | addEventListener('keydown')          | react-hotkeys-hook (already installed) | Handles focus scoping, form element conflicts, platform differences                                      |

## Common Pitfalls

### Pitfall 1: xterm.js CSS Not Imported

**What goes wrong:** Terminal renders as unstyled text, no cursor, broken layout.
**Why it happens:** xterm.js v6 requires importing `@xterm/xterm/css/xterm.css`. Easy to forget since it's a JS library.
**How to avoid:** Import CSS in the TerminalView component or in the app's entry point. Vite handles CSS imports natively.
**Warning signs:** Terminal text visible but no cursor blinking, text not in a grid.

### Pitfall 2: Terminal Resize Race Condition

**What goes wrong:** Terminal shows wrong number of columns after container resize, text wraps incorrectly.
**Why it happens:** `fit()` called before the container has its final dimensions (during CSS transitions or initial render).
**How to avoid:** Use ResizeObserver on the terminal container div, debounce fit() calls by ~50ms, and call fit() after the tab becomes visible.
**Warning signs:** Terminal content rewraps when switching tabs, or shows one-column-wide text.

### Pitfall 3: Docker Exec Stream Not in TTY Mode

**What goes wrong:** Terminal shows garbled output, no colors, no interactive programs (vim, htop).
**Why it happens:** Docker exec created without `Tty: true` — defaults to multiplexed stdout/stderr which requires demuxing.
**How to avoid:** Always set `Tty: true` and `AttachStdin: true` when creating the exec for the embedded terminal. With TTY mode, the stream is a raw PTY — no demuxing needed.
**Warning signs:** Output has binary-looking prefixes (8-byte headers from demux protocol).

### Pitfall 4: xterm.js Instance Opened Multiple Times

**What goes wrong:** Terminal appears to duplicate, flickers, or becomes unresponsive.
**Why it happens:** React strict mode or re-renders call `terminal.open(container)` multiple times.
**How to avoid:** Use a ref to track initialization state. Open terminal only once per mount. Clean up with `terminal.dispose()` on unmount.
**Warning signs:** Two cursors visible, terminal not responding to input.

### Pitfall 5: PTY Session Not Cleaned Up on Disconnect

**What goes wrong:** Zombie exec processes accumulate inside the container, consuming resources.
**Why it happens:** Client disconnects (tab close, navigation) without sending a close event, or server doesn't handle socket disconnect.
**How to avoid:** On server: track active PTY exec streams per client socket ID. In `handleDisconnect`, destroy all streams for that client. On client: send `terminal.close` before unmounting.
**Warning signs:** `docker exec` processes accumulating in container (`ps aux` shows many bash processes).

### Pitfall 6: fit() on Hidden Element Returns 0 Rows/Cols

**What goes wrong:** Terminal sends resize event with 0x0 dimensions, which either errors or makes the PTY unusable.
**Why it happens:** When terminal container has `display: none`, `fitAddon.proposeDimensions()` returns undefined or 0.
**How to avoid:** Only call `fit()` when the terminal tab is active/visible. Call `fit()` when switching TO the terminal tab.
**Warning signs:** Terminal goes blank after switching away and back.

## Code Examples

### Docker Interactive Exec with PTY

```typescript
// Based on existing DockerContainerExecService pattern + dockerode TTY mode
async execInteractive(
  containerId: string,
  cols: number,
  rows: number,
  workingDir: string,
): Promise<{ stream: NodeJS.ReadWriteStream; execId: string }> {
  const docker = await this.dockerClient.getClient();
  const container = docker.getContainer(containerId);

  const exec = await container.exec({
    Cmd: ['/bin/bash'],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true, // Critical: allocate PTY
    WorkingDir: workingDir,
  });

  const stream = await exec.start({
    hijack: true,
    stdin: true,
    Tty: true,
  });

  // Resize PTY to match client terminal dimensions
  await exec.resize({ h: rows, w: cols });

  return { stream, execId: exec.id };
}
```

### xterm.js React Integration

```typescript
// TerminalView component pattern
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

const TerminalView: React.FC<{ sessionId: string; visible: boolean }> = ({
  sessionId,
  visible,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Menlo', monospace",
      theme: {
        background: '#09090b',
        foreground: '#fafafa',
        cursor: '#10b981',
        selectionBackground: '#18181b',
      },
      scrollback: 5000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new WebLinksAddon());
    terminal.open(containerRef.current);
    fitAddon.fit();

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    return () => {
      terminal.dispose();
      initializedRef.current = false;
    };
  }, []);

  // Re-fit when tab becomes visible
  useEffect(() => {
    if (visible && fitAddonRef.current) {
      requestAnimationFrame(() => fitAddonRef.current?.fit());
    }
  }, [visible]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};
```

### Socket.IO Terminal Events (Client Side)

```typescript
// useTerminal hook pattern — mirrors useChat hook structure
const useTerminal = (sessionId: string) => {
  const { socket, connected } = useWebSocket();

  const startTerminal = useCallback(
    (cols: number, rows: number) => {
      socket?.emit('terminal.start', { sessionId, cols, rows });
    },
    [socket, sessionId],
  );

  const sendInput = useCallback(
    (data: string) => {
      socket?.emit('terminal.input', { sessionId, data });
    },
    [socket, sessionId],
  );

  const resize = useCallback(
    (cols: number, rows: number) => {
      socket?.emit('terminal.resize', { sessionId, cols, rows });
    },
    [socket, sessionId],
  );

  useEffect(() => {
    if (!socket || !connected) return;

    const onData = (payload: { sessionId: string; data: string }) => {
      if (payload.sessionId !== sessionId) return;
      // Write to xterm instance via callback
    };

    socket.on('terminal.data', onData);
    return () => {
      socket.off('terminal.data', onData);
    };
  }, [socket, connected, sessionId]);

  return { startTerminal, sendInput, resize };
};
```

### Tab State Persistence (D-08)

```typescript
// Simple session-scoped persistence via sessionStorage
const ACTIVE_TAB_KEY = 'afk:session-tab:';

const useSessionTabs = (sessionId: string) => {
  const [activeTab, setActiveTab] = useState<string>(() => {
    return sessionStorage.getItem(`${ACTIVE_TAB_KEY}${sessionId}`) || 'chat';
  });

  const switchTab = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      sessionStorage.setItem(`${ACTIVE_TAB_KEY}${sessionId}`, tabId);
    },
    [sessionId],
  );

  return { activeTab, switchTab };
};
```

## State of the Art

| Old Approach                              | Current Approach                             | When Changed     | Impact                                                                          |
| ----------------------------------------- | -------------------------------------------- | ---------------- | ------------------------------------------------------------------------------- |
| xterm.js v4 (`xterm`)                     | xterm.js v6 (`@xterm/xterm`)                 | 2024             | New scoped package names. v4/v5 packages deprecated. Must use `@xterm/` prefix. |
| xterm `Terminal.loadAddon()` with old API | Same API but from `@xterm/` packages         | 2024             | Import paths changed, API mostly stable                                         |
| Docker exec with demux                    | Docker exec with Tty: true (no demux needed) | Always available | When Tty is true, stream is raw PTY data — simpler                              |

**Deprecated/outdated:**

- `xterm` npm package (without `@xterm/` prefix): Deprecated. Must use `@xterm/xterm` v6+.
- `xterm-addon-fit`, `xterm-addon-web-links`: Old unscoped addon names. Use `@xterm/addon-fit`, `@xterm/addon-web-links`.

## Project Constraints (from AGENTS.md / CLAUDE.md)

- **DI-first:** All new server services must use NestJS dependency injection. No standalone imported functions.
- **nest-typed-config for infra, Settings entity for user config:** Terminal scrollback/font size are UI concerns — not config file material. Potentially a future user setting but not this phase.
- **File size limit ~500 lines:** Split if approaching. `SessionDetails.tsx` is already ~993 lines — the refactoring to extract tab infrastructure will naturally reduce it.
- **Run `npm run format` after changes:** Prettier conformance required.
- **Prefer existing libraries:** xterm.js is the standard. react-hotkeys-hook already installed.
- **SOLID/DRY principles:** Gateway service decomposition pattern already follows single-responsibility.

## Assumptions Log

| #   | Claim                                                                                          | Section       | Risk if Wrong                                                                                                                                           |
| --- | ---------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `dockerode` exec supports `Tty: true` with bidirectional stream in the current project version | Code Examples | Would need different stream handling. LOW risk — this is core dockerode functionality.                                                                  |
| A2  | xterm.js v6 Terminal constructor accepts `theme` object for custom colors                      | Code Examples | Would need to apply theme via CSS instead. LOW risk — well-documented feature.                                                                          |
| A3  | `sessionStorage` is appropriate for tab state persistence (D-08)                               | Code Examples | If persistence across browser sessions is needed, would need `localStorage` instead. MEDIUM risk — "restore when reopening" could mean browser restart. |
| A4  | Socket.IO binary data (terminal output) performs adequately for interactive terminal use       | Architecture  | If latency is too high, may need raw WebSocket. LOW risk — Socket.IO handles binary efficiently with WebSocket transport.                               |
| A5  | Container's bash shell is available at `/bin/bash` for all Docker images                       | Code Examples | Some minimal images might only have `/bin/sh`. LOW risk — AFK's base Dockerfile installs bash.                                                          |

## Open Questions

1. **Tab persistence scope (A3)**
   - What we know: D-08 says "remember last-used tab per session — persist which tab was active and restore it when reopening the session."
   - What's unclear: Does "reopening" mean navigating away and back (sessionStorage sufficient), or closing browser entirely (needs localStorage or server-side)?
   - Recommendation: Use `sessionStorage` for now — it persists across in-tab navigation. If browser-restart persistence is needed, it's a one-line change to `localStorage`.

2. **Terminal tab when session is not running**
   - What we know: Terminal requires a running container and PTY connection.
   - What's unclear: Should the terminal tab be visible but disabled when session is stopped/starting, or hidden entirely?
   - Recommendation: Show the tab but display a "Session not ready" state inside the terminal panel, gated by the existing `useSessionHealth.terminalReady` flag. This keeps the UI consistent and avoids tab count changing.

3. **Multiple embedded terminals per session**
   - What we know: D-03 specifies one PTY channel. The container already has tmux.
   - What's unclear: Should the embedded terminal attach to the existing tmux session (used by ttyd popup) or create its own?
   - Recommendation: Create a separate tmux session (e.g., `tmux new-session -s embedded`) to avoid conflicts with the popup terminal's session. Users get independent shell contexts.

## Environment Availability

Step 2.6: SKIPPED — This phase adds npm packages (frontend) and extends existing server code. No external CLI tools, databases, or services required beyond what's already running (Docker, Node.js).

## Validation Architecture

### Test Framework

| Property                    | Value                                                              |
| --------------------------- | ------------------------------------------------------------------ |
| Framework (server)          | Jest 29 via ts-jest                                                |
| Config file (server)        | `server/package.json` jest block + `server/test/jest-e2e.json`     |
| Quick run command (server)  | `cd server && npx jest --testPathPattern=session-gateway-terminal` |
| Full suite command (server) | `cd server && npx jest`                                            |
| Framework (web)             | Vitest 4                                                           |
| Config file (web)           | `web/vite.config.ts` (unit project)                                |
| Quick run command (web)     | `cd web && npx vitest run --project unit`                          |
| Full suite command (web)    | `cd web && npx vitest run --project unit`                          |

### Phase Requirements → Test Map

| Req ID   | Behavior                                                        | Test Type | Automated Command                                           | File Exists?              |
| -------- | --------------------------------------------------------------- | --------- | ----------------------------------------------------------- | ------------------------- |
| SEUX-01a | Terminal gateway service handles start/data/resize/close events | unit      | `cd server && npx jest session-gateway-terminal`            | ❌ Wave 0                 |
| SEUX-01b | Docker exec interactive PTY method creates bidirectional stream | unit      | `cd server && npx jest docker-container-exec`               | ❌ Wave 0                 |
| SEUX-01c | Tab state hook returns correct active tab and persists changes  | unit      | `cd web && npx vitest run --project unit -- useSessionTabs` | ❌ Wave 0                 |
| SEUX-01d | Terminal socket events registered in gateway events constant    | unit      | `cd server && npx jest session-gateway`                     | ✅ (extend existing spec) |

### Sampling Rate

- **Per task commit:** Quick run commands above for changed module
- **Per wave merge:** Full server + web test suites
- **Phase gate:** Full suites green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `server/src/gateways/session-gateway-terminal.service.spec.ts` — covers SEUX-01a
- [ ] `server/src/libs/docker/docker-container-exec.service.spec.ts` — covers SEUX-01b (may already exist partially)
- [ ] `web/src/hooks/useSessionTabs.test.ts` — covers SEUX-01c

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                                                         |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| V2 Authentication     | yes     | Existing Socket.IO auth guard validates JWT before any terminal events. No new auth needed.                              |
| V3 Session Management | yes     | Terminal PTY tied to session subscription — existing `SessionGatewaySubscriptionsService` verifies session ownership.    |
| V4 Access Control     | yes     | Only clients subscribed to a session room can send terminal events for that session. Room-based isolation via Socket.IO. |
| V5 Input Validation   | yes     | Validate `cols`/`rows` as positive integers within sane bounds (e.g., 1-500). Validate `sessionId` format.               |
| V6 Cryptography       | no      | No crypto operations in this phase.                                                                                      |

### Known Threat Patterns for Terminal-over-WebSocket

| Pattern                                           | STRIDE                | Standard Mitigation                                                                                      |
| ------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------- |
| Cross-session terminal access                     | Tampering / Elevation | Verify session ownership before creating PTY. Use Socket.IO room isolation (existing pattern from chat). |
| Terminal input injection from unsubscribed client | Tampering             | Reject terminal events from sockets not in the session room.                                             |
| PTY resource exhaustion                           | Denial of Service     | Limit one active PTY per session per client. Clean up on disconnect. Track active execs per socket.      |
| Oversized resize values                           | Denial of Service     | Validate cols/rows bounds server-side before calling `exec.resize()`.                                    |

## Sources

### Primary (HIGH confidence)

- **Codebase analysis:** `SessionDetails.tsx`, `useWebSocket.tsx`, `useChat.ts`, `session.gateway.ts`, `session-gateway-chat.service.ts`, `session-gateway.events.ts`, `docker-container-exec.service.ts`, `docker-container-provisioning.service.ts`, `Settings.tsx`, `afk.ts` theme, `ChatPanel.tsx`, `Layout.tsx`, `docker/scripts/entrypoint.sh`, `docker/base/Dockerfile`
- **npm registry:** @xterm/xterm@6.0.0, @xterm/addon-fit@0.11.0, @xterm/addon-web-links@0.12.0 — versions verified 2026-04-11
- **Dockerode documentation:** exec with Tty mode [VERIFIED: existing project usage in DockerContainerExecService]

### Secondary (MEDIUM confidence)

- xterm.js API patterns from official examples and VS Code integration model

### Tertiary (LOW confidence)

- None — all claims either verified against codebase or npm registry

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries either already in codebase or verified against npm registry
- Architecture: HIGH — patterns directly derived from existing codebase (gateway service decomposition, socket events, MUI Tabs usage)
- Pitfalls: HIGH — common xterm.js integration issues well-documented and verified through Docker exec API behavior

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (stable libraries, well-established patterns)
