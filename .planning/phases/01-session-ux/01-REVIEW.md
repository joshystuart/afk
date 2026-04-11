---
status: issues_found
phase: 01-session-ux
depth: standard
files_reviewed: 12
files_reviewed_list:
  - server/src/gateways/session-gateway.events.ts
  - server/src/libs/docker/docker-container-exec.service.ts
  - server/src/libs/docker/docker-engine.service.ts
  - server/src/gateways/session-gateway-terminal.service.ts
  - server/src/gateways/session.gateway.ts
  - server/src/gateways/gateways.module.ts
  - web/src/hooks/useTerminal.ts
  - web/src/hooks/useSessionTabs.ts
  - web/src/components/session/TerminalView.tsx
  - web/src/components/session/SessionTabBar.tsx
  - web/src/components/session/SessionTabPanel.tsx
  - web/src/pages/SessionDetails.tsx
findings: 6
critical: 0
high: 0
medium: 3
low: 3
---

# Phase 01-session-ux: Code Review Report

**Reviewed:** 2026-04-11T12:00:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

The phase delivers a well-structured PTY-over-WebSocket terminal with a tabbed session UI. The server-side code follows existing gateway patterns, correctly validates session ownership before PTY creation (T-1-01), limits one PTY per client per session (T-1-03), and validates terminal dimensions (T-1-04). The frontend components are cleanly separated with proper hooks, ResizeObserver for responsive fit, and a debounced resize pipeline.

Three medium-severity issues were found — a missing stream error handler that could crash the process when a container is killed, a `btoa()` encoding call that throws on non-Latin1 input, and missing type validation on terminal input data. Three low-severity items were also identified.

No critical or security vulnerabilities were found. The threat mitigations documented in the plan (T-1-01 through T-1-04) are all correctly implemented.

## Warnings

### WR-01: Missing `error` event handler on PTY stream

**File:** `server/src/gateways/session-gateway-terminal.service.ts:89-103`
**Issue:** The PTY stream listeners handle `data`, `end`, and `close` events but omit an `error` handler. In Node.js, if a stream emits `error` without a listener, the error is thrown as an uncaught exception. This can happen when the Docker container is killed (e.g., user stops the session) or the Docker daemon disconnects while the terminal is active. The unhandled error would propagate outside NestJS's exception handling and could destabilize the process.
**Fix:**

```typescript
ptySession.stream.on('data', (chunk: Buffer) => {
  client.emit(SOCKET_EVENTS.terminalData, {
    sessionId,
    data: chunk.toString('base64'),
  });
});

ptySession.stream.on('error', (err: Error) => {
  this.logger.warn('PTY stream error', {
    sessionId,
    clientId: client.id,
    error: err.message,
  });
  this.destroyClientPty(sessionId, client.id);
  client.emit(SOCKET_EVENTS.terminalError, {
    sessionId,
    error: 'Terminal connection lost',
  });
});

ptySession.stream.on('end', () => {
  // ... existing handler
});
```

### WR-02: `btoa()` throws on non-Latin1 characters in terminal input

**File:** `web/src/hooks/useTerminal.ts:35`
**Issue:** `btoa(data)` only handles characters in the U+0000–U+00FF range. If a user types or pastes non-Latin1 characters (e.g., CJK, emoji, accented characters beyond Latin1) into the xterm.js terminal, `btoa()` throws `DOMException: The string to be encoded contains characters outside of the Latin1 range`. This would silently drop the input and put the hook into an unexpected state.
**Fix:**

```typescript
const sendInput = useCallback(
  (data: string) => {
    if (!socket?.connected) return;
    const encoded = btoa(
      String.fromCodePoint(...new TextEncoder().encode(data)),
    );
    socket.emit('terminal.input', { sessionId, data: encoded });
  },
  [socket, sessionId],
);
```

Or more concisely using a helper:

```typescript
function encodeToBase64(str: string): string {
  return btoa(
    Array.from(new TextEncoder().encode(str), (b) =>
      String.fromCharCode(b),
    ).join(''),
  );
}
```

### WR-03: No type validation on terminal input data before Buffer.from()

**File:** `server/src/gateways/session-gateway-terminal.service.ts:147`
**Issue:** `Buffer.from(data.data, 'base64')` is called without verifying that `data.data` is a string. Socket.IO message payloads are client-controlled — a malformed or malicious client could send `{ sessionId: "x", data: 12345 }`, causing `Buffer.from()` to throw `TypeError: The first argument must be of type string`. While NestJS catches the exception and returns it to the client, the error message exposes implementation details (Node.js internal error text).
**Fix:**

```typescript
handleTerminalInput(
  client: Socket,
  data: { sessionId: string; data: string },
) {
  const { sessionId } = data;

  // ... existing subscription check ...

  if (typeof data.data !== 'string') {
    return {
      event: SOCKET_EVENTS.terminalError,
      data: { sessionId, error: 'Invalid terminal input' },
    };
  }

  const ptySession = this.getClientPty(sessionId, client.id);
  if (!ptySession) {
    return {
      event: SOCKET_EVENTS.terminalError,
      data: { sessionId, error: 'No active terminal for session' },
    };
  }

  ptySession.stream.write(Buffer.from(data.data, 'base64'));
}
```

## Info

### IN-01: Terminal PTY not explicitly closed on component unmount

**File:** `web/src/components/session/TerminalView.tsx:98-103`
**Issue:** The cleanup function calls `terminal.dispose()` but does not call `closeTerminal()` from the `useTerminal` hook. The server-side PTY continues running until either the client opens a new terminal (which destroys the old one via `destroyClientPty`) or the socket disconnects. This creates a temporary resource leak where orphaned PTY exec processes persist in the container.
**Fix:** Add `closeTerminal()` to the cleanup:

```typescript
return () => {
  closeTerminal();
  terminal.dispose();
  terminalRef.current = null;
  fitAddonRef.current = null;
  initializedRef.current = false;
};
```

Note: `closeTerminal` would need to be captured as a ref to avoid stale closure issues, since the effect has `[]` as dependencies. Alternatively, emit the close event directly:

```typescript
return () => {
  socket?.emit('terminal.close', { sessionId });
  terminal.dispose();
  // ...
};
```

### IN-02: `console.error` used in production code

**File:** `web/src/hooks/useTerminal.ts:76`
**Issue:** `console.error('Terminal error:', payload.error)` will appear in production browser console. Consider using a structured logging approach or removing in favor of the status state change (which already sets `'error'`).
**Fix:**

```typescript
const onError = (payload: { sessionId: string; error: string }) => {
  if (payload.sessionId !== sessionId) return;
  setStatus('error');
};
```

### IN-03: Unsafe type cast from ReactNode to ReactElement

**File:** `web/src/components/session/SessionTabBar.tsx:41`
**Issue:** `icon={tab.icon as React.ReactElement}` casts `React.ReactNode` (from the `SessionTab` interface) to `React.ReactElement`. If a consumer passes a string or null as `icon`, MUI's Tab component may render incorrectly. The `SessionTab` interface could be tightened.
**Fix:** Update the interface in `useSessionTabs.ts`:

```typescript
export interface SessionTab {
  id: string;
  label: string;
  icon: React.ReactElement; // was React.ReactNode
  badge?: boolean;
  disabled?: boolean;
}
```

This eliminates the need for the cast in `SessionTabBar.tsx`.

---

## Recommendation

The implementation is solid overall — the threat mitigations are correctly implemented and the code follows established project patterns. **WR-01 (missing stream error handler) is the highest-priority fix** as it can cause unhandled exceptions when containers are stopped. WR-02 and WR-03 are defensive hardening that prevent edge-case crashes. The info items are minor quality improvements.

Recommended fix priority:

1. WR-01 — Add error handler to PTY stream (stability risk)
2. WR-03 — Validate input type server-side (defense in depth)
3. WR-02 — Replace btoa with UTF-8-safe encoding (edge-case crash)
4. IN-01 — Close terminal on unmount (resource hygiene)

---

_Reviewed: 2026-04-11T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
