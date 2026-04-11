---
phase: 01-session-ux
plan: 01
subsystem: api
tags: [websocket, socket.io, docker, pty, terminal]

requires: []
provides:
  - Terminal socket event constants (SOCKET_EVENTS.terminal*)
  - SessionGatewayTerminalService for PTY lifecycle management
  - DockerContainerExecService.execInteractive for TTY-allocated Docker exec
  - DockerEngineService.execInteractive facade
affects: [01-02, 01-03]

tech-stack:
  added: []
  patterns:
    [gateway-service-decomposition, pty-over-websocket, base64-binary-transport]

key-files:
  created:
    - server/src/gateways/session-gateway-terminal.service.ts
  modified:
    - server/src/gateways/session-gateway.events.ts
    - server/src/libs/docker/docker-container-exec.service.ts
    - server/src/libs/docker/docker-engine.service.ts
    - server/src/gateways/session.gateway.ts
    - server/src/gateways/gateways.module.ts

key-decisions:
  - 'Base64 encoding for terminal data transport over Socket.IO for binary safety'
  - 'One PTY per session per client with auto-destroy of previous PTY on re-open'
  - 'Terminal cleanup runs before subscription cleanup on disconnect to prevent zombie execs'

patterns-established:
  - 'Gateway terminal service follows same DI/decomposition pattern as SessionGatewayChatService'
  - 'execInteractive returns destroy + resize closures for caller-managed lifecycle'

requirements-completed: [SEUX-01]

duration: 3min
completed: 2026-04-11
---

# Phase 01 Plan 01: Server PTY-over-WebSocket Infrastructure Summary

**PTY-over-WebSocket backend with interactive Docker exec, terminal socket events, and session-scoped lifecycle management with all four STRIDE threats mitigated**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-11T00:57:05Z
- **Completed:** 2026-04-11T01:00:13Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- 7 terminal event constants added to SOCKET_EVENTS (start, data, input, resize, close, error, started)
- Interactive PTY exec method on DockerContainerExecService with TTY allocation, bidirectional stream, and resize support
- SessionGatewayTerminalService managing full PTY lifecycle with session ownership checks, dimension validation, and disconnect cleanup
- All four STRIDE threats mitigated: session ownership (T-1-01), input authorization (T-1-02), DoS via PTY limits (T-1-03), dimension bounds (T-1-04)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add terminal socket events and interactive PTY exec method** - `543fa27` (feat)
2. **Task 2: Create SessionGatewayTerminalService and wire into gateway** - `73a5680` (feat)

## Files Created/Modified

- `server/src/gateways/session-gateway.events.ts` - Added 7 terminal event constants to SOCKET_EVENTS
- `server/src/gateways/session-gateway-terminal.service.ts` - New service handling PTY lifecycle, stream management, and security checks
- `server/src/libs/docker/docker-container-exec.service.ts` - Added execInteractive method for TTY-allocated Docker exec
- `server/src/libs/docker/docker-engine.service.ts` - Added execInteractive facade delegating to exec service
- `server/src/gateways/session.gateway.ts` - Added 4 @SubscribeMessage handlers and disconnect cleanup
- `server/src/gateways/gateways.module.ts` - Registered SessionGatewayTerminalService as provider

## Decisions Made

- **Base64 encoding for terminal I/O:** Binary-safe transport over Socket.IO — terminal data is base64-encoded in both directions to handle non-UTF-8 bytes from PTY streams
- **One PTY per session per client:** Prevents resource exhaustion while allowing re-open (destroys old PTY before creating new one)
- **Terminal cleanup before subscription cleanup:** In handleDisconnect, PTYs are destroyed before session subscriptions are cleared to prevent zombie Docker exec processes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Server-side PTY infrastructure complete, ready for web client terminal component (Plan 02)
- All terminal socket events defined and handler wiring in place
- execInteractive provides the stream interface that the frontend terminal will consume

## Self-Check: PASSED

All 6 files verified present. Both commits (543fa27, 73a5680) verified in git log.

---

_Phase: 01-session-ux_
_Completed: 2026-04-11_
