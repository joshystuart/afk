# Server Memory And Stream Stability

## Goal

Reduce the chance that AFK can exhaust host memory or accumulate runaway background work when the browser is left open overnight, while preserving two product requirements:

- Keep Docker container log streaming enabled for server-side visibility.
- Preserve the full Claude/job event stream exactly, so historical runs can be replayed and audited later.

## What We Are Solving

The current server has three main pressure points:

1. Docker log streams can outlive the client or session that created them.
2. Claude and scheduled-job streams are accumulated in memory as full `streamEvents[]` arrays, then repeatedly cloned and rewritten into JSON columns.
3. Session containers can keep running indefinitely, and the existing idle-session primitives are not wired up.

The browser-being-left-open detail makes the first and third items especially important. Even if scheduled jobs were not active, a running session plus an open log view could leave several long-lived streams and a live container consuming resources all night.

---

## Architecture Decisions

### 1. Keep Docker Logs, But Make Them Lifecycle-Managed

We will keep background Docker log following, but change it from "fire and forget" to a tracked resource with explicit ownership and cleanup.

**Design:**

- Introduce a dedicated service, for example `ContainerLogStreamService`, responsible for all long-lived `container.logs({ follow: true })` streams.
- Track active streams in a registry keyed by session ID and container ID.
- Each tracked stream owns:
  - The Docker stream handle
  - Listener teardown callbacks
  - Subscriber count / subscriber IDs for websocket consumers
  - Lightweight in-memory metrics (`startedAt`, bytes seen, lastActivityAt)
- Only one Docker log follower should exist per running session container.
- Websocket subscribers should attach to the shared stream instead of opening their own independent Docker log stream per browser tab.

**Lifecycle rules:**

- Start the tracked stream when a session becomes running, or lazily on first log subscription.
- Reuse it for subsequent subscribers.
- Remove a websocket subscriber on:
  - `unsubscribe.logs`
  - socket disconnect
  - duplicate re-subscribe from the same socket
- Stop the tracked stream when:
  - the session stops
  - the session is deleted
  - the container is recreated
  - the container exits
  - the app shuts down
  - there are no subscribers and no server-side logging need to keep it alive

**Implementation note:**

If we want server-side Docker logs regardless of UI subscribers, that should still be one shared stream per session, not one hidden stream plus additional websocket streams.

### 2. Preserve Full Claude Streams Using Append-Only Storage

We should stop storing raw event history as a giant in-memory array that gets copied and rewritten over and over.

The efficient design is:

- Keep the exact raw event stream.
- Persist it incrementally in append-only chunks.
- Keep summary fields on the main entity for list/detail screens.
- Reconstruct the full event history only when a user explicitly opens a run/chat transcript.

**Recommended storage model:**

- Add a new stream-storage abstraction shared by chat and scheduled jobs.
- Back it with chunked NDJSON payloads rather than JSON arrays.
- Persist chunks in the database, not as ad hoc files on disk, so cleanup, backup, and portability stay aligned with the rest of the app.

**Why chunked NDJSON in DB is the best fit here:**

- It preserves exact event order and payloads.
- It avoids loading the whole stream into memory.
- It avoids rewriting the entire `streamEvents` column on every snapshot.
- It works for both chat sessions and scheduled job runs.
- It is easy to stream back to clients during replay.
- It keeps deletion behavior simple when sessions or job runs are removed.

### 3. Use Dedicated Chunk Tables, Not Giant JSON Columns

Replace the current "all events in one row" pattern with append-only chunk rows.

**Suggested schema shape:**

- `chat_stream_chunks`
  - `id`
  - `messageId`
  - `sequence`
  - `payload` (`text` or `blob`)
  - `eventCount`
  - `byteLength`
  - `createdAt`

- `scheduled_job_run_stream_chunks`
  - `id`
  - `runId`
  - `sequence`
  - `payload`
  - `eventCount`
  - `byteLength`
  - `createdAt`

**Payload format:**

- Append newline-delimited JSON entries exactly as they arrive from the parser.
- Chunk by event count and byte size, for example:
  - flush every 100 events, or
  - flush every 64-256 KB,
  - whichever comes first

**Optional optimization:**

- Store `payload` as compressed `blob` if profiling shows SQLite file growth becomes a real issue.
- Do not start with compression first. It adds complexity to debugging and replay, and the first win comes from eliminating full-row rewrites and large in-memory arrays.

### 4. Keep Summary Data On Main Records

The primary entities should still store lightweight summary data used in lists and details:

For `ChatMessage`:

- `content`
- `conversationId`
- `costUsd`
- `durationMs`
- `streamEventCount`
- `streamByteCount`

For `ScheduledJobRun`:

- `errorMessage`
- `committed`
- `filesChanged`
- `commitSha`
- `durationMs`
- `streamEventCount`
- `streamByteCount`

**Important API change:**

- Do not include full stream history in default list/history responses.
- Keep summaries in list APIs.
- Add explicit transcript endpoints for full replay when needed.

This still satisfies the "know exactly what the agent did" requirement, but avoids sending megabytes of historical event data in normal page loads.

### 5. Minimize In-Memory State For Active Executions

`ChatService` and `JobExecutorService` should keep only the state needed to control a live run:

- cancel/kill handle
- active run/message ID
- conversation ID / result summary fields
- current chunk writer
- small parser buffer
- optional recent tail buffer for diagnostics

They should not retain the full event stream in process memory once it has been flushed to storage.

### 6. Add Real Idle Session Cleanup

The existing `lastAccessedAt` and `findExpiredSessions()` logic should be completed and used.

**Activity sources that should update access time:**

- session websocket subscribe
- terminal/log websocket activity
- chat send / chat cancel
- terminal page load or session detail fetch if that reflects active use
- optional heartbeat event from the frontend while the session page is open

**Cleanup behavior:**

- Add a periodic cleanup job that finds stale running sessions and stops them.
- Make timeout configurable in settings, with "disabled" allowed for users who want always-on sessions.
- Log when a session is auto-stopped due to idleness.

This is the safety net that prevents a forgotten browser tab plus running container from living forever.

---

## Proposed Phases

### Phase 1: Log Stream Lifecycle Hardening

**Goal:** Eliminate leaked Docker log streams without removing log streaming.

**Server changes:**

- Add `ContainerLogStreamService` under `server/src/services/docker/`
- Move all long-lived `container.logs({ follow: true })` handling into that service
- Update `SessionGateway` log subscribe/unsubscribe paths to use the shared registry
- Ensure `handleDisconnect()` always unregisters any active log subscriptions
- Ensure duplicate `subscribe.logs` calls do not orphan the previous stream
- Hook stream cleanup into:
  - `stopSession()`
  - `deleteSession()`
  - session container recreation
  - app shutdown

**Deliverable:**

- Exactly one tracked Docker log stream per running session container
- Zero orphaned websocket log streams after disconnect/unsubscribe/recreate/stop

### Phase 2: Full-Fidelity Stream Persistence Refactor

**Goal:** Preserve every Claude event exactly, but stop holding and rewriting entire histories in memory.

**Server changes:**

- Add new stream chunk entities + repositories in `server/src/domain/`
- Add a shared stream writer service, for example `ClaudeEventArchiveService`
- Refactor `ClaudeStreamRunnerService` so it:
  - parses events
  - forwards events to live listeners
  - appends events to the archive writer
  - updates only lightweight aggregate state in memory
- Remove the requirement that `startPrompt()` returns full `streamEvents[]`
- Update chat and scheduled-job flows to finalize summaries from archive metadata instead

**Deliverable:**

- No large `streamEvents[]` arrays retained for active runs
- No full-array cloning on every persistence checkpoint
- Exact raw stream retained in ordered append-only storage

### Phase 3: Transcript Read APIs

**Goal:** Keep normal APIs cheap while still allowing full historical inspection.

**API changes:**

- Chat history endpoint returns message summaries, not full event arrays
- Scheduled job run list returns summaries, not full event arrays
- Add explicit endpoints such as:
  - `GET /sessions/:id/messages/:messageId/stream`
  - `GET /scheduled-jobs/runs/:runId/stream`
- Support:
  - paginated chunk retrieval, or
  - whole-transcript streaming for the viewer page

**Frontend follow-up:**

- Update viewers to request full transcripts only when the user opens a specific message/run

**Deliverable:**

- Small list responses even with very large historical runs
- Full replay still available on demand

### Phase 4: Idle Session Safety Net

**Goal:** Stop abandoned sessions from consuming resources forever.

**Server changes:**

- Wire `markAsAccessed()` into real activity paths
- Add a scheduled cleanup service that stops stale `RUNNING` sessions
- Add settings for idle timeout and enable/disable behavior
- Emit logs/events when a session is auto-stopped

**Deliverable:**

- Forgotten sessions do not remain alive indefinitely

### Phase 5: Reconciliation And Observability

**Goal:** Make leaks visible and recover cleanly across restart.

**Instrumentation:**

- Add metrics/logging for:
  - active Docker log streams
  - websocket log subscribers
  - active Claude executions
  - stream chunks written
  - bytes archived per run/message
  - idle sessions auto-stopped

**Startup reconciliation:**

- On boot, reconcile tracked running sessions against Docker
- Rebuild/refresh log stream registry lazily, not eagerly
- Clean up stale DB metadata for incomplete archived streams if needed

**Deliverable:**

- We can tell from logs/metrics whether the system is accumulating work again

---

## File Areas Likely To Change

### Existing

- `server/src/services/docker/docker-engine.service.ts`
- `server/src/gateways/session.gateway.ts`
- `server/src/gateways/session-subscription.service.ts`
- `server/src/services/chat/chat.service.ts`
- `server/src/services/chat/claude-stream-runner.service.ts`
- `server/src/services/scheduled-jobs/job-executor.service.ts`
- `server/src/interactors/sessions/chat-messages.controller.ts`
- `server/src/interactors/scheduled-jobs/list-scheduled-job-runs.controller.ts`
- `server/src/interactors/scheduled-jobs/scheduled-job-run-response.dto.ts`
- `server/src/interactors/sessions/session-lifecycle.interactor.ts`
- `server/src/services/repositories/session.repository.ts`
- `server/src/domain/chat/chat-message.entity.ts`
- `server/src/domain/scheduled-jobs/scheduled-job-run.entity.ts`

### New

- `server/src/services/docker/container-log-stream.service.ts`
- `server/src/services/stream-archive/stream-archive.module.ts`
- `server/src/services/stream-archive/stream-archive.service.ts`
- `server/src/domain/chat/chat-stream-chunk.entity.ts`
- `server/src/domain/chat/chat-stream-chunk.repository.ts`
- `server/src/domain/scheduled-jobs/scheduled-job-run-stream-chunk.entity.ts`
- `server/src/domain/scheduled-jobs/scheduled-job-run-stream-chunk.repository.ts`
- `server/src/interactors/sessions/get-chat-message-stream.controller.ts`
- `server/src/interactors/scheduled-jobs/get-scheduled-job-run-stream.controller.ts`
- `server/src/services/sessions/session-idle-cleanup.service.ts`

---

## Data Migration Strategy

Because the current `streamEvents` JSON columns already contain historical data, migration should be done in two steps:

1. Add the new chunk tables and summary columns while keeping existing `streamEvents` columns readable.
2. Switch new writes to the chunked archive path.
3. Update read paths to prefer chunk storage.
4. Optionally backfill old `streamEvents` rows into chunk tables with a one-time migration script.
5. Remove or deprecate the old `streamEvents` columns only after the new readers are fully stable.

This avoids breaking existing history while we refactor.

---

## Testing Strategy

### Memory / Lifecycle

- Open a session page with logs, disconnect the browser, and verify subscriber count returns to zero
- Reconnect repeatedly and verify log stream count does not increase unbounded
- Stop/delete/recreate a session and verify the old stream is torn down
- Leave a session open overnight with logs enabled and confirm stable process memory

### Stream Archiving

- Run a long Claude chat and confirm:
  - all events are present
  - event order is preserved
  - the transcript can be replayed exactly
  - heap usage does not scale linearly with transcript length
- Run a long scheduled job and confirm identical guarantees

### Idle Cleanup

- Verify activity updates `lastAccessedAt`
- Verify inactive sessions are stopped after the configured timeout
- Verify active sessions are not stopped while the page remains open and heartbeats continue

---

## Out Of Scope For This Pass

- Deduplicating scheduled-job execution races
- Transcript compression from day one
- Cross-run transcript search/indexing
- Log retention policies for old archived transcripts

Those are valid follow-ups, but the priority here is stability first, then efficient full-fidelity persistence.
