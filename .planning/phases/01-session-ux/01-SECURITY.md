---
phase: 01
slug: session-ux
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-11
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary                          | Description                                                                             | Data Crossing                                      |
| --------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Client → Socket.IO gateway        | Untrusted terminal input (keystrokes, resize dimensions) crosses from browser to server | Raw terminal I/O (base64-encoded), resize integers |
| Gateway → Docker exec             | Server creates PTY inside container — must verify requesting client owns the session    | Docker exec API calls with container ID            |
| Browser → Socket.IO               | Terminal input from xterm.js sent as socket events                                      | Base64-encoded keystrokes                          |
| User interaction → SessionDetails | Tab switching, keyboard shortcut, badge display — all client-side                       | No trust boundary crossed                          |

---

## Threat Register

| Threat ID | Category               | Component                                          | Disposition | Mitigation                                                                                                                                                                                       | Status |
| --------- | ---------------------- | -------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| T-1-01    | Tampering / Elevation  | SessionGatewayTerminalService.handleTerminalStart  | mitigate    | `getSubscribersForSession(sessionId)` check rejects clients not subscribed to session room (lines 46-53)                                                                                         | closed |
| T-1-02    | Tampering              | SessionGatewayTerminalService.handleTerminalInput  | mitigate    | Subscription check before write (lines 143-149) + PTY existence check (lines 159-165) rejects unauthorized input                                                                                 | closed |
| T-1-03    | Denial of Service      | SessionGatewayTerminalService activePtys           | mitigate    | One PTY per session per client enforced via Map structure; `destroyClientPty` called before creating replacement (line 65); `handleDisconnect` iterates all sessions to clean up (lines 206-221) | closed |
| T-1-04    | Denial of Service      | SessionGatewayTerminalService.handleTerminalResize | mitigate    | `validateDimensions` checks integer type + range cols 1-500, rows 1-200 in both `handleTerminalStart` (line 55) and `handleTerminalResize` (line 176)                                            | closed |
| T-1-05    | Information Disclosure | TerminalView.tsx                                   | accept      | Terminal output rendered client-side only. Server enforces room isolation (T-1-01). No cross-session data possible.                                                                              | closed |
| T-1-06    | Tampering              | useTerminal.ts sendInput                           | accept      | Client sends base64-encoded keystrokes to PTY. Container sandbox is the security boundary — terminal input is expected behavior.                                                                 | closed |
| T-1-07    | Information Disclosure | Badge listeners (SessionDetails.tsx)               | accept      | Socket listeners for terminal.data and chat.stream filter by current session ID. Room isolation enforced server-side (T-1-01).                                                                   | closed |
| T-1-08    | Tampering              | Keyboard shortcut (SessionDetails.tsx)             | accept      | Shortcut toggles local tab state only. No data crosses trust boundaries.                                                                                                                         | closed |

_Status: open · closed_
_Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)_

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale                                                                                                                                                                                  | Accepted By        | Date       |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ---------- |
| AR-01   | T-1-05     | Terminal output is rendered entirely client-side; server room isolation prevents cross-session leakage. No additional client-side protection needed.                                       | gsd-security-audit | 2026-04-11 |
| AR-02   | T-1-06     | Terminal input (keystrokes) written directly to PTY stream is the fundamental purpose of a web terminal. The Docker container sandbox provides the security boundary, not input filtering. | gsd-security-audit | 2026-04-11 |
| AR-03   | T-1-07     | Badge socket listeners only match the current session ID. Room isolation is enforced server-side. No cross-session data can leak through badge detection.                                  | gsd-security-audit | 2026-04-11 |
| AR-04   | T-1-08     | Keyboard shortcut (Ctrl+`/Cmd+`) toggles local tab state only. No data transmission or trust boundary crossing occurs.                                                                     | gsd-security-audit | 2026-04-11 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By             |
| ---------- | ------------- | ------ | ---- | ------------------ |
| 2026-04-11 | 8             | 8      | 0    | gsd-security-audit |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-11
