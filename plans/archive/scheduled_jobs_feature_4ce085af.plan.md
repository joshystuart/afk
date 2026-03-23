---
name: Scheduled Jobs Feature
overview: Add a "Scheduled Jobs" feature to AFK that allows users to define recurring or one-time jobs that spin up ephemeral Docker containers, run a Claude prompt against a git repo, and optionally commit/push changes. Uses a hybrid scheduler (nestjs/schedule + macOS LaunchAgent plists for wake-from-sleep), tray icon for background execution, full CRUD, and run history with output viewing.
todos:
  - id: phase-1-tray
    content: 'Phase 1: Tray icon + background support (electron/src/tray.ts, modify main.ts and window.ts)'
    status: completed
  - id: phase-2-screens
    content: 'Phase 2: Empty screens + navigation (routes, sidebar, placeholder pages)'
    status: completed
  - id: phase-3-data-model
    content: 'Phase 3: Data model + API -- entities, DTOs, controllers, interactors for CRUD'
    status: completed
  - id: phase-4-create-ui
    content: 'Phase 4: Create job form UI -- reuse repo selector, image selector, add schedule config'
    status: completed
  - id: phase-5-execution
    content: 'Phase 5: Job execution engine + hybrid scheduler (@nestjs/schedule + macOS LaunchAgent plists)'
    status: completed
  - id: phase-6-history-ui
    content: 'Phase 6: Job list + run history UI with output viewing'
    status: completed
  - id: phase-7-edit
    content: 'Phase 7: Edit, pause/resume, delete, manual trigger'
    status: completed
isProject: false
---

# Scheduled Jobs Feature

## Architecture Decisions

- **Scheduler (hybrid):**
  - **In-process:** `@nestjs/schedule` (cron-based). Jobs stored in DB, registered on server startup. Handles scheduling while the app is running.
  - **macOS wake-from-sleep:** LaunchAgent plist files (`~/Library/LaunchAgents/com.afk.job.{jobId}.plist`) with `StartCalendarInterval` / `StartInterval`. These wake the computer from sleep and trigger the job via HTTP (`POST /scheduled-jobs/:id/trigger`). If AFK isn't running, the plist launches it first.
  - **Deduplication:** Before executing, check if a run for this job exists within the last 60 seconds. Prevents double-execution when both the in-process cron and the plist fire at the same time.
  - **Web/self-hosted mode:** Only `@nestjs/schedule` (no plists). Server is expected to be always running.
- **Containers:** Ephemeral per run -- spin up, clone repo, run prompt, capture output, optionally commit/push, tear down.
- **Tray icon:** Required prerequisite so the server stays alive when the window is closed.
- **Branch format:** `{prefix}-YYYY-MM-DD-HHmmss`.
- **Failures:** Record failure status and error message. No retries.
- **Output storage:** Use the same `streamEvents` JSON pattern as `ChatMessage` for rendering Claude output.
- **Concurrency:** Each job runs in its own ephemeral container -- naturally concurrent.
- **Deferred:** Job timeout, notifications, cancel running job -- revisit later.

## Data Model

Two new TypeORM entities:

`**ScheduledJob`\*\* (`scheduled_jobs` table):

- `id` (uuid PK)
- `name` (string)
- `repoUrl` (string)
- `branch` (string)
- `createNewBranch` (boolean)
- `newBranchPrefix` (string, nullable) -- used with `{prefix}-YYYY-MM-DD-HHmmss`
- `imageId` (string, FK to `docker_images`)
- `prompt` (text)
- `scheduleType` (enum: `cron` | `interval`)
- `cronExpression` (string, nullable) -- for specific time + recurrence
- `intervalMs` (number, nullable) -- for "every X minutes/hours"
- `commitAndPush` (boolean)
- `enabled` (boolean, default true)
- `lastRunAt` (datetime, nullable)
- `nextRunAt` (datetime, nullable)
- `createdAt`, `updatedAt`

`**ScheduledJobRun`\*\* (`scheduled_job_runs` table):

- `id` (uuid PK)
- `jobId` (FK to `scheduled_jobs`, indexed)
- `status` (enum: `pending` | `running` | `completed` | `failed`)
- `branch` (string) -- actual branch used (may be generated)
- `containerId` (string, nullable)
- `streamEvents` (JSON, nullable) -- Claude output in same format as `ChatMessage.streamEvents`
- `errorMessage` (text, nullable)
- `committed` (boolean)
- `filesChanged` (number, nullable)
- `commitSha` (string, nullable)
- `durationMs` (number, nullable)
- `startedAt`, `completedAt` (datetime)

## Phase Breakdown

---

### Phase 1: Tray Icon + Background Support

**Goal:** Keep the Electron app alive in the system tray when the window is closed.

**Files to modify:**

- [electron/src/main.ts](../../electron/src/main.ts) -- change `window-all-closed` to hide to tray instead of quit
- [electron/src/window.ts](../../electron/src/window.ts) -- add tray creation logic
- New: `electron/src/tray.ts` -- tray icon, context menu (Show Window, Quit)

**Key changes:**

- Create `Tray` with icon and context menu on `app.whenReady()`
- On `window-all-closed`: hide window, don't quit (on macOS this is already convention)
- Tray context menu: "Show AFK", "Quit AFK"
- Clicking tray icon shows the window
- `before-quit` flag to distinguish close vs quit
- Tray icon asset needed (can reuse existing `icon.png` from `electron/build/`)

---

### Phase 2: Empty Screens + Navigation

**Goal:** Add "Scheduled Jobs" section to the sidebar and create placeholder pages.

**Files to modify:**

- [web/src/utils/constants.ts](../../web/src/utils/constants.ts) -- add routes: `SCHEDULED_JOBS: '/jobs'`, `CREATE_SCHEDULED_JOB: '/jobs/create'`, `SCHEDULED_JOB_DETAILS: '/jobs/:id'`
- [web/src/components/Layout.tsx](../../web/src/components/Layout.tsx) -- add "Scheduled Jobs" to `menuItems` array (use `Schedule` icon from MUI)
- [web/src/App.tsx](../../web/src/App.tsx) -- add routes for the three new pages
- New: `web/src/pages/ScheduledJobs.tsx` -- empty list page with "No scheduled jobs" state and "Create Job" button
- New: `web/src/pages/CreateScheduledJob.tsx` -- empty form placeholder
- New: `web/src/pages/ScheduledJobDetails.tsx` -- empty detail placeholder with tabs (Settings / History)

---

### Phase 3: Data Model + API (CRUD)

**Goal:** Create entities, repository, module, and REST endpoints for scheduled job definitions.

**Server-side new files:**

- `server/src/domain/scheduled-jobs/scheduled-job.entity.ts` -- `ScheduledJob` entity
- `server/src/domain/scheduled-jobs/scheduled-job-run.entity.ts` -- `ScheduledJobRun` entity
- `server/src/domain/scheduled-jobs/scheduled-jobs.module.ts` -- domain module (TypeORM registration)
- `server/src/interactors/scheduled-jobs/` -- controllers and interactors:
  - `create-scheduled-job.controller.ts` / `create-scheduled-job.interactor.ts`
  - `list-scheduled-jobs.controller.ts` / `list-scheduled-jobs.interactor.ts`
  - `get-scheduled-job.controller.ts` / `get-scheduled-job.interactor.ts`
  - `update-scheduled-job.controller.ts` / `update-scheduled-job.interactor.ts`
  - `delete-scheduled-job.controller.ts` / `delete-scheduled-job.interactor.ts`
  - `list-scheduled-job-runs.controller.ts` / `list-scheduled-job-runs.interactor.ts`
  - DTOs: `create-scheduled-job.dto.ts`, `update-scheduled-job.dto.ts`
  - `scheduled-jobs.module.ts` -- interactor module
- Modify [server/src/app.module.ts](../../server/src/app.module.ts) to import new modules

**Follows the same pattern as sessions:** separate controller per action, interactor for business logic, repository via TypeORM.

---

### Phase 4: Create Job Form (UI)

**Goal:** Build the create form, reusing session creation patterns.

**Files:**

- `web/src/pages/CreateScheduledJob.tsx` -- full form implementation
- New: `web/src/api/scheduled-jobs.api.ts` -- API client
- New: `web/src/api/types.ts` -- add `ScheduledJob`, `ScheduledJobRun`, request/response types
- New: `web/src/hooks/useScheduledJobs.ts` -- React Query hooks
- New: `web/src/stores/scheduled-jobs.store.ts` -- Zustand store (if needed)

**Form sections (mirroring CreateSession.tsx):**

1. **Repository** -- reuse the GitHub Autocomplete / manual URL toggle pattern from [web/src/pages/CreateSession.tsx](../../web/src/pages/CreateSession.tsx) lines 425-560
2. **Branch** -- branch input + "Create new branch" toggle with prefix field
3. **Environment** -- Docker image selector (same pattern as CreateSession)
4. **Schedule** -- toggle between "Specific time" (date/time picker + recurrence: daily/weekly/monthly) and "Every X" (number + unit dropdown: minutes/hours/days)
5. **Prompt** -- multiline text field for the Claude prompt
6. **Options** -- "Commit and push changes" toggle

---

### Phase 5: Job Execution Engine + Scheduler

**Goal:** Actually run scheduled jobs in ephemeral containers, with wake-from-sleep support on macOS.

#### 5a: Job Executor Service

**New file:** `server/src/services/scheduled-jobs/job-executor.service.ts`

Orchestrates a single job run:

1. **Dedup check:** Query `ScheduledJobRun` for this job in the last 60 seconds with status `running` or `completed`. If found, skip.
2. Create `ScheduledJobRun` record (status: `pending`, then `running`)
3. Resolve Docker image via `DockerImageService`
4. Allocate ports via `PortManagerService`
5. Create ephemeral container via `DockerEngineService.createContainer()` (similar to `CreateSessionInteractor` but no session entity)
6. Clone repo + checkout branch. If `createNewBranch`, create `{prefix}-YYYY-MM-DD-HHmmss`.
7. Run Claude prompt via `DockerEngineService.execStreamInContainer()` -- capture `streamEvents` in the same format as `ChatService` does for `ChatMessage`
8. If `commitAndPush`: exec `git add -A && git commit && git push`
9. Capture files changed count via `git diff --stat`
10. Update run record (streamEvents, status, filesChanged, committed, commitSha, duration)
11. Tear down container + release ports (always, even on failure)

#### 5b: In-Process Scheduler

**New file:** `server/src/services/scheduled-jobs/job-scheduler.service.ts`

- On module init: load all enabled jobs from DB, register each with `SchedulerRegistry` (from `@nestjs/schedule`)
- `registerJob(job)` / `unregisterJob(jobId)` / `updateJob(job)` methods
- Uses `CronJob` from `cron` package for cron-type, `setInterval` wrapper for interval-type
- Each registered job calls `JobExecutorService.execute(jobId)` when triggered

**Modify:** [server/src/app.module.ts](../../server/src/app.module.ts) to import `ScheduleModule.forRoot()` from `@nestjs/schedule`

#### 5c: macOS LaunchAgent Integration (Electron only)

**Goal:** Wake computer from sleep to run scheduled jobs.

**New file:** `server/src/services/scheduled-jobs/launchd.service.ts`

This service manages LaunchAgent plist files. Only active when running in Electron mode on macOS (detected via `process.platform === 'darwin'` and an Electron flag in config).

**Plist lifecycle:**

- `createPlist(job)` -- writes `~/Library/LaunchAgents/com.afk.job.{jobId}.plist`
- `removePlist(jobId)` -- deletes plist + `launchctl unload`
- `updatePlist(job)` -- remove old + create new
- Called by `JobSchedulerService` whenever a job is created/updated/deleted/paused/resumed

**Plist structure:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "...">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.afk.job.{jobId}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>
      # Wait for AFK server, launch if needed
      if ! curl -sf http://localhost:4919/health > /dev/null 2>&1; then
        open -a AFK
        for i in $(seq 1 30); do
          sleep 2
          curl -sf http://localhost:4919/health > /dev/null 2>&1 && break
        done
      fi
      curl -sf -X POST http://localhost:4919/scheduled-jobs/{jobId}/trigger
    </string>
  </array>
  <key>StartCalendarInterval</key>  <!-- or StartInterval -->
  <dict>...</dict>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
```

**Dedup keeps this safe:** Even if both the plist trigger and the in-process cron fire within seconds of each other, the 60-second dedup window in `JobExecutorService` prevents double-execution.

**Web mode:** `LaunchdService` is a no-op (methods return immediately). Can be implemented as a conditional provider or a simple platform check.

#### 5d: Trigger Endpoint

**New controller:** `server/src/interactors/scheduled-jobs/trigger-scheduled-job.controller.ts`

- `POST /scheduled-jobs/:id/trigger` -- triggers immediate execution of a job
- Used by both the LaunchAgent plist scripts and the "Run Now" UI button (Phase 7)
- Calls `JobExecutorService.execute(jobId)` in background (returns 202 Accepted)

#### Module Setup

**New file:** `server/src/services/scheduled-jobs/scheduled-jobs.module.ts` -- exports `JobExecutorService`, `JobSchedulerService`, `LaunchdService`

**WebSocket events** (via existing `SessionGateway` or new gateway):

- `job.run.started` / `job.run.completed` / `job.run.failed` -- for real-time UI updates

---

### Phase 6: Job List + Run History (UI)

**Goal:** Display all jobs and their historical runs.

**Files:**

- `web/src/pages/ScheduledJobs.tsx` -- list page with job cards showing: name, repo, schedule summary, last run status, enabled toggle
- `web/src/pages/ScheduledJobDetails.tsx` -- detail page with two tabs:
  - **Settings tab:** read-only view of job config with "Edit" button
  - **Runs tab:** table of historical runs with columns: date, status, duration, files changed, committed (yes/no), actions (view output)
- Clicking a run expands or navigates to show the full Claude output (rendered as markdown, similar to `ChatMessageBubble`)

---

### Phase 7: Edit + Manage Jobs

**Goal:** Edit job definitions, pause/resume, delete, and trigger manual runs.

**Files:**

- `web/src/pages/CreateScheduledJob.tsx` -- support edit mode (load existing job, pre-fill form)
- `web/src/pages/ScheduledJobDetails.tsx` -- add action buttons:
  - "Run Now" -- trigger immediate execution
  - "Pause" / "Resume" -- toggle `enabled`
  - "Delete" -- with confirmation
- Server: add `POST /scheduled-jobs/:id/trigger` endpoint for manual runs
- Server: update scheduler registration when job is edited/paused/resumed

## Dependencies to Install

- `@nestjs/schedule` (server) -- cron/interval scheduling + `SchedulerRegistry`
- No new web dependencies needed (MUI already has the components we need)

## Notes

- Branch name format: `{prefix}-YYYY-MM-DD-HHmmss` (e.g., `feature-update-2026-03-17-143022`)
- Job execution reuses `DockerEngineService` and `PortManagerService` but does NOT create a `Session` entity -- jobs are a parallel concept
- Claude output captured via `execStreamInContainer` using the same `streamEvents` format as `ChatMessage`, enabling reuse of existing rendering components (`ChatMessageBubble`, `ToolCallBlock`, etc.)
- Failed runs store the error message in `errorMessage` field. No retries for now.
- `LaunchdService` is macOS + Electron only; no-op on other platforms and in web mode
- Deferred for later: job timeout, notifications, cancel running job, retry on failure
