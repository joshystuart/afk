# Project Research Summary

**Project:** AFK (Away From Keyboard)  
**Domain:** secure agentic coding platform  
**Researched:** 2026-04-10  
**Confidence:** MEDIUM-HIGH

## Executive Summary

Research across stack, features, architecture, and pitfalls converges on a single thesis: AFK should extend its existing **thin NestJS control plane + thick Docker runtime** model rather than introducing parallel agent SDKs or in-browser IDEs. Agents stay **CLI-invoked inside session containers** (Claude today; Codex via npm, Cursor via official install script); the UI gains **git-aware review** (`react-diff-view` + unified diff from container `git diff`), **bounded workspace APIs** for explorer and `@file` context, **read-only skills bind mounts** from Settings, and a **pluggable agent-runner layer** replacing ad-hoc CLI branching.

The main risks are not library choice but **concurrency and trust boundaries**: multiple agents share one working tree unless you define an explicit isolation model (lock, serial execution, or worktrees); **path and git surfaces** must avoid shell interpolation and traversal (OpenHands-class command-injection advisories apply); **WebSocket subscriptions** must bind `(user, session)` before streaming richer file/diff data; and **AI-generated commit/PR text** must run behind secret scanning and explicit user confirmation. Mitigation is layered: interactor-first APIs, argv-based git, caps on diff size, session-scoped socket auth, and clear UX for prompt-injection via attached files.

Product-wise, **v1** should deliver the Active list in PROJECT.md—`@` context, diff viewer + explorer, read-only centralized skills, multi-agent CLI paths, and auto commit/PR messaging—while deferring browser-in-agent, marketplace plugins, and micro-VM isolation unless a later milestone demands them.

## Key Findings

### Recommended Stack

- **Keep dockerode + container exec** as the integration point; add skills as **read-only `-v host:container:ro`** (validated paths in Settings / nest-typed-config defaults)—no writable skills mounts.
- **Codex:** `@openai/codex` **^0.118.0** global in image; pin in CI matrix builds.
- **Cursor:** install via official script (not npm); document `CURSOR_API_KEY` and re-verify current Cursor docs before locking production images (**MEDIUM** confidence on Docker edge cases).
- **Git UX:** **simple-git** ^3.35.2 for status/diff metadata; **react-diff-view** ^3.3.3 + **gitdiff-parser** / optional **prismjs** for the post-run diff UI; pick **one** primary diff stack (avoid dual theming with diff2html in-app).
- **Explorer / @ mentions:** **@mui/x-tree-view** ^9.0.1 (align with MUI 7 + React 19), **react-mentions-ts** ^5.4.7 for async suggestions, **fast-glob** ^3.3.3 for host-side listing when the workspace is host-mounted; **ignore** / optional **fuse.js** for `.gitignore`-aware lists.
- **GitHub:** extend existing **@octokit/rest**—no second GitHub client.
- **Do not** use Anthropic/OpenAI SDKs for primary agent turns—conflicts with CLI-in-container constraint.

### Expected Features

**Must have (table stakes):**

Streaming output; chat/task loop; terminal execution; git awareness (branch/diff/commit/push); model/BYOK; plan vs execute; context selection (`@` files/folders); change review (diff); session persistence; multi-session work; auth for shared installs; real-time UI; skills/rules memory; plus **container-platform** expectations: isolation, lifecycle management, controlled workspace I/O, audit-friendly logging, secrets hygiene, health/recovery.

**Should have (competitive):**

Isolation-first / CLI harness / self-hosted story (core AFK positioning); Electron control plane; MCP where first-class in-container; deeper git-native workflow (auto-commit, undo patterns); checkpoints/rollback (research-only for now); optional browser-in-agent (gated, v2+).

**Defer (v2+):**

In-browser IDE, multiplayer editing, hosted agent marketplace, silent auto-merge to main, unrestricted host FS from container, arbitrary MCP without policy, mobile-native surface, micro-VM/Firecracker unless Docker proves insufficient.

**MVP (next milestone) alignment:** `@` + autocomplete; diff viewer + file explorer; centralized read-only skills; multi-agent CLI support with explicit concurrency rules; auto-generated commit and PR text.

### Architecture Approach

- **Pattern:** Interactors + DTOs for every new capability; **AgentRunner** interface with one implementation per CLI (evolve from `ClaudeStreamRunnerService`); gateway stays thin—`ChatService` + runners own behavior.
- **Boundaries:** Authoritative session/persistence on server; agent execution and repo state in container; Socket.IO for realtime; **single validated workspace path API** for both tree and `@` tagging.
- **Diff:** Treat as **derived artifact** after `chatComplete`—server-side `git diff` / status with optional pre/post SHA; structured payload to UI.
- **Skills:** Provisioning-only—Settings-resolved path → Docker `Binds` at create/start; document container mount point in image contract.
- **Suggested integration layout:** New interactors under `server/src/interactors/sessions/…`; extend `libs/docker`, `libs/git`, domain `Session` config; web modules for tree, diff panel, agent selector, mentions.

### Critical Pitfalls

1. **Multi-agent without isolation semantics** — Shared Git/workspace writers cause corruption and blame confusion. **Fix:** Define one active writer, queue/lock, worktrees, or branch-per-agent; document in-flight behavior before shipping agent pickers.
2. **Path traversal / symlinks / TOCTOU** in file APIs — **Fix:** Canonical resolution, workspace prefix after resolve, server-side session→root binding; never authorize on raw client paths.
3. **Shell-composed git** — Command injection class (cf. OpenHands GHSA-7h8w-hj9j-8rjw). **Fix:** argv-only exec, allowlisted refs/paths; escape diff text in UI.
4. **Unbounded diff/log payloads** — DoS and bad UX. **Fix:** Byte/line caps, binary detection, per-file drill-down, backpressure.
5. **`@file` and indirect prompt injection** — **Fix:** Provenance labeling, visibility of attached text, container sandbox as real mitigation; avoid over-claiming “safe @file.”
6. **Skills mounts + symlinks** — **Fix:** Document layouts; optionally reject/pre-resolve symlinks; integration tests for GSD-style trees.
7. **AI commit/PR messages leaking secrets** — **Fix:** gitleaks/detect-secrets on staged content; never auto-commit without review; redact patterns in prompts.
8. **Agent dispatch bugs** — Wrong binary/env/PATH. **Fix:** Per-agent adapters, CI integration tests, persisted binary path and errors in session metadata.
9. **WebSocket without session-scoped authorization** — Cross-session bleed. **Fix:** Authenticate socket; authorize every join on `(user, session)` before file/diff streams.
10. **Broad workspace mount for IDE** — Widens blast radius. **Fix:** Narrow paths, UX warnings, same boundaries for explorer and `@file`.

## Implications for Roadmap

Suggested phases follow **architecture build order** while threading **pitfall controls** early—especially WebSocket auth and path-safe workspace APIs before exposing richer streams.

| Suggested phase | Rationale | Delivers (PROJECT / FEATURES) | Pitfalls to bake in |
|-----------------|-----------|-------------------------------|---------------------|
| **1. Transport security & bounded workspace FS** | Unblocks safe file/diff events; foundation for explorer/`@` data per architecture | Session-scoped WS auth; `GET` workspace list/read with validation | 2, 9, 10 |
| **2. Session/Settings model + read-only skills provisioning** | Skills bind depends on persisted paths and Docker `Binds` | Centralized skills (Active); validated host paths | 6 |
| **3. Agent runner registry & multi-agent images** | Second CLI requires abstraction—not string switches | Claude / Codex / Cursor paths; per-session or per-prompt selection | 1, 8 |
| **4. Post-run diff pipeline & diff viewer UI** | Git read paths + completion hook; structured diff to UI | Diff viewer (Active); caps and no-shell git | 3, 4 |
| **5. Composer: `@` mentions + file explorer + IDE open** | Consumes same workspace API; product-facing slice | File tagging + explorer (Active); ignore globs | 2, 5, 10 |
| **6. Auto commit & PR message generation** | Depends on diff/summary + GitHub | Auto messages (Active); secret gates | 7 |
| **7. Session UX polish (v1.x)** | Lower risk once core loop stable | Tab between chat and terminal (Active, can slip) | 4, 9 |

**Parallel track:** UI for tree/mentions can proceed against stable workspace APIs once phase 1 is API-stable; Electron unchanged unless deep-link scope expands.

### Phase Ordering Rationale

**Security and filesystem contracts first** (WS auth + workspace API) because pitfalls research flags cross-session streams and traversal as blocking-quality issues once diff/file payloads grow. **Settings and skills** follow naturally (persistence + bind). **Multi-agent** needs the runner abstraction before scaling CLIs. **Diff** sits after git/exec patterns are solid. **Composer UX** layers on the same path rules. **Auto commit/PR** is last—it consumes diff summaries and must include scanning/confirmation. **Chat/terminal tab** is polish that can trail without blocking the secure review loop.

### Research Flags

- **Likely need `/gsd-research-phase` or spike:** Cursor CLI non-interactive behavior and auth in Docker (**MEDIUM**); exact concurrency model for multi-agent on one session (**MEDIUM**); enterprise audit export narrative if pursued.
- **Well-documented patterns (lighter research):** `react-diff-view` + unified diff; Nest interactor layout; Octokit PR flows; read-only Docker binds.
- **Re-validate at planning:** Competitor feature claims (**FEATURES** MEDIUM confidence); Cursor install docs snapshot.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH (npm-verified); MEDIUM for Cursor-in-Docker | Pin Codex minor; verify Cursor docs + image CI |
| Features | MEDIUM | Strong on OSS/container patterns; vendor marketing claims need roadmap-time refresh |
| Architecture | MEDIUM-HIGH | High alignment with existing AFK code; multi-agent CLI details vary by vendor |
| Pitfalls | MEDIUM–HIGH | OWASP-class issues and OpenHands advisory are strong; multi-agent “best” patterns partly anecdotal |

**Gaps to address in planning:** Lock **multi-agent concurrency** policy; confirm **Socket.IO auth** implementation scope against CONCERNS.md; add **automated tests** for path/git/WS (per pitfalls checklist); decide **minimum** prompt-injection UX for `@file`.

---

## Sources

Aggregated from `.planning/research/STACK.md`, `FEATURES.md`, `ARCHITECTURE.md`, `PITFALLS.md`, and `.planning/PROJECT.md`, including citations therein (npm packages, Cursor docs, OpenHands advisory GHSA-7h8w-hj9j-8rjw, OpenHands Docker sandbox docs, competitor homepages, OWASP-style path guidance, AFK codebase architecture/concerns references).

---

_Research completed: 2026-04-10_  
_Ready for roadmap: yes_
