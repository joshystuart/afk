# Architecture Research

**Domain:** secure agentic coding platform  
**Researched:** 2026-04-10  
**Confidence:** MEDIUM-HIGH (integration with existing AFK codebase: HIGH; industry-wide “best” patterns for multi-agent CLIs: MEDIUM — CLI surface varies by vendor)

## Standard Architecture

AFK already implements a **thin control plane** (NestJS) over a **thick runtime** (Docker containers). New capabilities should stay in that split: **authoritative session and persistence on the server**, **agent execution and repo state inside the container**, **real-time UX via Socket.IO**, and **bounded filesystem/git operations** implemented as interactors + `libs` services that wrap `dockerode` exec — same as today’s `ChatService` → `ClaudeStreamRunnerService` → `DockerContainerExecService` path and `GitService` / `SessionGitInteractor` patterns.

### System Overview (ASCII diagram)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         React SPA (Vite + MUI)                               │
│  Chat │ Terminal │ File explorer │ Diff viewer │ @mentions UI │ Agent picker │
└───────────────┬───────────────────────────────┬───────────────────────────────┘
                │ REST /api                     │ Socket.IO /sessions
                ▼                               ▼
┌───────────────────────────┐       ┌─────────────────────────────────────────┐
│ Interactors (use cases)    │       │ SessionGateway + gateway services        │
│ - chat (multi-agent)       │       │ - stream events, git status fan-out      │
│ - git (commit / PR gen)    │       │ - post-run diff / run-complete hooks     │
│ - fs (list/read bounded)   │       │   (new events alongside chatComplete)    │
│ - skills config resolve    │       └─────────────────────────────────────────┘
└───────────────┬───────────┘
                │
    ┌───────────┼───────────┬──────────────────┐
    ▼           ▼           ▼                  ▼
┌────────┐ ┌─────────┐ ┌──────────┐    ┌──────────────┐
│Domain  │ │TypeORM  │ │Docker   │    │Git / GitHub  │
│entities│ │repos    │ │libs     │    │libs          │
└────────┘ └─────────┘ └────┬────┘    └──────┬───────┘
                            │                 │
                            ▼                 ▼
                   ┌─────────────────────────────────┐
                   │  Container (per session)         │
                   │  CLIs: claude/codex/cursor-cli…  │
                   │  workspace repo, ~/.claude, etc. │
                   │  + read-only skills mount (new)  │
                   └─────────────────────────────────┘
```

### Component Responsibilities

| Area                                                               | Responsibility                                                         | Keeps clear of                                                                             |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Controllers + interactors**                                      | Orchestrate use cases; validate DTOs; call repositories and `libs`     | Raw `dockerode` in controllers                                                             |
| **`libs/docker`**                                                  | Exec streams, container create/update, volume binds                    | Business rules about “what prompt means”                                                   |
| **`libs` agent runners** (evolve from `ClaudeStreamRunnerService`) | Build argv/env per agent CLI; parse streaming protocol                 | UI concerns                                                                                |
| **`libs/git` + session git**                                       | Commit, push, diff, status inside container                            | Generating PR bodies (delegate to runner or small dedicated service)                       |
| **Gateway**                                                        | Fan-out to rooms; bridge long-running chat to sockets                  | Persisting chat (interactor/repo already do)                                               |
| **React**                                                          | Composer UX (`@` tagging), explorer tree, diff review, agent selection | Trust boundaries — never assume client-side paths are safe; server validates session scope |

## Recommended Project Structure

Align with existing layout; **add features as new interactors + thin controllers** and **extend `libs`**, not new top-level apps.

- **`server/src/interactors/sessions/…`** — New folders alongside `chat/`, `git-status/`: e.g. `list-path/`, `read-file/` (or a single `workspace-fs/` feature with multiple routes), `generate-pr/`, `post-run-diff/` if not folded into chat completion.
- **`server/src/libs/`** — `workspace-fs/` (path validation, max depth, size limits) calling existing Docker exec; `agent-runners/` or extend `claude/` into a small **strategy/registry** for `claude | codex | …` argv and stream parsers.
- **`server/src/domain/sessions/`** — Extend `Session` config embed / JSON for **locked agent**, **per-prompt override**, **skills host path resolution** (or reference `Settings`).
- **`server/src/libs/docker/`** — `DockerContainerProvisioningService`: additional **read-only bind** for skills directory (from `Settings` or session-scoped path), validated to prevent `..` escapes and host arbitrary writes.
- **`web/src/`** — Feature modules: file tree + `@` autocomplete (shared data source), diff viewer panel (receives structured diff from API or WS), agent selector wired to existing session + chat payloads.

## Architectural Patterns

1. **Interactor-first additions** — Every new server capability that mutates state or crosses the container boundary goes through an interactor + DTOs + tests, matching `CreateSessionInteractor` / `ChatService` style.

2. **Agent as pluggable runner** — Today `ClaudeStreamRunnerService` owns `claude -p` streaming. Multi-agent support should introduce an **`AgentRunner` interface** (execute prompt, stream events, map exit metadata) with **one implementation per CLI**, registered in a Nest module. `ChatService.sendMessage` selects implementation from **session config + optional per-message override**, without a switch statement spread across the codebase.

3. **Single source of truth for “workspace paths”** — File explorer and `@` tagging both consume the same **list/read API** with identical validation (session id → container id → chroot logical root at repo working dir). Avoid duplicating path rules in the web client.

4. **Diff as a derived artifact** — After `chatComplete`, the server (or client triggered fetch) runs **`git diff` / `git status` scoped to session** via existing git exec paths — optionally snapshot **refs before/after** if you need stable “what changed this run” (store a `prePromptSha` in memory or short-lived DB row). Prefer **server-side generation** so the UI receives a consistent structure (files + hunks or unified diff).

5. **Skills = provisioning concern** — Configuration lives in **Settings** (user path) or YAML if deployment-global; **Docker bind** at create/start is the enforcement point. No execution of skill files on the host.

6. **Auto commit / PR** — **Commit**: extend `SessionGitInteractor` flow with an optional **message generator** step (second exec of chosen agent CLI with a tight prompt, or template). **PR**: use **`GithubService`** + PAT from Settings; new interactor composes title/body from the same diff summary as the diff viewer.

## Data Flow

### Key Data Flows

**1. Chat with multi-agent selection**

1. Client sends `chat:send` on Socket.IO with `{ sessionId, content, model, agentId? }`.
2. `SessionGatewayChatService` → `ChatService.sendMessage` loads session, resolves **effective agent** = message override ?? session default ?? deployment default.
3. **Agent runner** builds container exec command; `DockerContainerExecService` streams stdout; parser emits `chatStream` events; completion emits `chatComplete` with metadata.
4. **Optional hook**: on completion, enqueue **diff snapshot** (async) → emit `workspaceDiff` or expose GET for “last run diff”.

**2. File explorer and `@` file tagging**

1. **Autocomplete / tree**: client calls `GET /api/sessions/:id/workspace/entries?path=…` (example shape); interactor validates path segment rules, uses Docker exec `ls` or a small Node-side read via exec API.
2. **Tag resolution**: composer inserts `@src/foo.ts`; **send** includes plain text (or structured blocks). Server **does not** need to re-fetch file contents if the client already loaded them for preview — but for robustness, **server-side injection** (optional phase) could re-read files at send time to prevent stale context; that’s a product decision with latency tradeoffs.
3. Minimum viable: **client** resolves `@` to paths and **prepends or appends** file contents to the prompt string; server still enforces size limits on total prompt.

**3. Skills mounting**

1. Admin/user sets **skills root path** in Settings (and format hints if needed).
2. On **create/start session**, provisioning adds `HostConfig.Binds` entry: `skillsRoot:/path/in/container:ro` (exact container mount point should be fixed and documented in image contract).
3. Agents discover skills via their normal mechanism (e.g. env var pointing at mount). No hot-reload requirement in v1 beyond container restart.

**4. Diff viewer (post-run)**

1. **Trigger**: `chatComplete` (and optionally manual “refresh diff” button).
2. **Server**: `git diff`, `git diff --stat`, or `git status --porcelain` via existing git exec in container; return JSON (files, additions/deletions) + optional patch text with size cap.
3. **Client**: renders file list + side-by-side or unified from structured response; large diffs paginate or lazy-load per file.

**5. Auto commit / PR**

1. **Commit**: user clicks “Auto commit” → interactor runs **status → optional message generation CLI** → `git commit` → `git push` (existing patterns).
2. **PR**: interactor calls GitHub API with branch name derived from session/repo config; body from template filled by **same summary** as diff viewer.

### Internal Boundaries

| Boundary                 | Contract                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Client ↔ API            | JWT; session id in path; all paths relative to workspace root                                                  |
| Interactor ↔ Docker     | Only through `DockerEngine` / exec services — **never** pass user strings into shell `-c` without sanitization |
| Interactor ↔ Git        | Container-scoped working directory; same as current git flows                                                  |
| Gateway ↔ Chat          | Gateway stays thin; heavy logic in `ChatService` and runners                                                   |
| Settings ↔ Provisioning | Skills path and agent defaults are **validated once** at write and **again** at bind time                      |

## Integration Points

### Build order (dependency-aware)

1. **Path validation + workspace FS API** — Unlocks file explorer and `@` autocomplete data; no dependency on multi-agent.
2. **Session/Settings model extensions** — Skills host path, default agent id, per-session overrides; migration if persisted.
3. **Docker provisioning: read-only skills bind** — Depends on (2).
4. **Agent runner abstraction + second CLI** — Depends on chat pipeline understanding; implement registry before adding many CLIs.
5. **Post-run diff pipeline** — Depends on git exec + chat completion hook; can ship after (4) but ideally right after FS API for consistent “workspace root”.
6. **Auto commit message + PR generation** — Depends on diff/summary text and GitHub service; last in chain.

Parallel tracks: **UI file tree + `@` UX** can proceed against stubbed API once (1) is stable; **Electron** needs no change unless IDE deep-links expand.

### What not to change

- **Config discipline**: keep `nest-typed-config` for infra; user knobs in **Settings** entity.
- **Transport**: prefer extending existing Socket events and REST namespaces under `/api/sessions` before introducing new gateways.
- **Security**: skills and mounts remain **read-only** where promised; explorer **read-only** by default; any future “write” is explicit and audited.

## Sources

- `.planning/PROJECT.md` — requirements and constraints (2026-04-10)
- `.planning/codebase/ARCHITECTURE.md` — layers, interactors, gateway, data flow (2026-04-10)
- `.planning/codebase/INTEGRATIONS.md` — Docker, GitHub, auth (2026-04-10)
- Code inspection: `ChatService`, `SessionGatewayChatService`, `ClaudeStreamRunnerService`, `DockerContainerProvisioningService` (`server/src/`)

---

_Architecture research for: secure agentic coding platform_  
_Researched: 2026-04-10_
