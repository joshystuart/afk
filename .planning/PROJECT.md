# AFK (Away From Keyboard)

## What This Is

AFK is an open-source secure agentic coding platform that runs AI coding agents inside Docker containers — the ultimate sandbox. It provides a polished web interface for interacting with agents, browsing files, reviewing changes, and managing sessions, without compromising on developer experience despite prioritizing security. Anyone who wants to use AI coding agents safely can clone and run it.

## Core Value

Secure agentic coding without DX compromise — containers provide isolation that can't be circumvented, while the UI makes working inside them feel as natural as working locally.

## Requirements

### Validated

- ✓ Docker container lifecycle management (create, start, stop, restart sessions) — existing
- ✓ Chat-based web interface for Claude Code interaction via `claude -p` headless mode — existing
- ✓ Web terminal for manual shell access into containers — existing
- ✓ Chat history persistence and restoration across session restarts — existing
- ✓ Session management (multiple concurrent sessions) — existing
- ✓ GitHub OAuth authentication — existing
- ✓ Model selection for Claude (choose which model the agent uses) — existing
- ✓ Agent and planning mode selection — existing
- ✓ Simplified commit and push buttons — existing
- ✓ Real-time streaming via WebSocket (chat responses, logs, git status) — existing
- ✓ Electron desktop app with auto-update — existing
- ✓ User-configurable settings (Docker socket, port ranges, Git tokens) — existing
- ✓ Optional workspace mount from container to host — existing
- ✓ Health checks and observability (metrics, startup reconciliation) — existing
- ✓ Scheduled jobs subsystem — existing

### Active

- [ ] Centralized skills — configurable skills directory mounted read-only into each session at runtime, supporting popular skill ecosystems (skills.sh, GSD, superpowers)
- [ ] File tagging in prompt input — `@file/folder-name` with autocomplete dropdown for providing file context in prompts
- [ ] Auto commit and PR messages — automatically generate commit messages and PR descriptions, configurable which model is used
- [ ] Multiple agent support — support for Claude, Cursor, Codex, and other CLI-based agents; lock a session to an agent or select per prompt
- [ ] Diff viewer — post-run summary showing what files the agent changed after completing a task
- [ ] File system explorer — browse container filesystem in the UI; open in local IDE when workspace mount is enabled
- [ ] Tab between chat and terminal — toggle between the chat view and the Claude terminal view within a session

### Out of Scope

- Real-time collaborative editing — single-user tool, not a multiplayer IDE
- Built-in code editor — AFK hosts agents, not an IDE; "open in IDE" defers to local editors
- Mobile app — desktop and web first
- Self-hosted cloud deployment guides — focus on local Docker-based usage for now
- Agent marketplace — skills are file-based, not a hosted registry

## Context

AFK exists because despite security enhancements in agentic coding harnesses (sandboxing, permission models), most can be circumvented in one form or another. A fully isolated Docker container is fundamentally more secure. The tradeoff is that container-based development traditionally has terrible DX — AFK bridges that gap.

The existing codebase is a modular monorepo: NestJS backend (REST + Socket.IO), React SPA (Vite + MUI), optional Electron shell. The server follows an interactor pattern with typed config via `nest-typed-config`, TypeORM persistence (SQLite/PostgreSQL), and token-based repository abstractions. The web client uses TanStack Query, Zustand stores, and MUI components.

The current architecture already supports the core loop: create a session, chat with Claude via `claude -p` in the container, see streaming responses, use the web terminal for manual access. The v1 push is about making this a daily-driver tool — the kind of DX where you stop reaching for bare `claude` locally because AFK is better.

## Constraints

- **Tech stack**: NestJS + React + TypeORM — established, not changing
- **Security**: Skills and any host-mounted content must be read-only in containers; no arbitrary code execution paths from UI to host
- **Agent interface**: Agents must be invocable via CLI (`claude -p`, `codex`, etc.) inside Docker containers — no API-level agent integration
- **Config pattern**: `nest-typed-config` for infrastructure config, database `Settings` entity for user-configurable options — no `process.env` in application code

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Docker containers as the security boundary | Harness-level sandboxes can be circumvented; containers provide OS-level isolation | — Pending |
| `claude -p` headless invocation | Enables streaming responses back to the UI without maintaining a persistent agent process | ✓ Good |
| Skills as mounted directory | Simplest approach that supports multiple skill ecosystems; read-only mount for security | — Pending |
| Agent-per-session or per-prompt selection | Flexible multi-agent support without requiring architectural changes per agent | — Pending |
| Workspace mount opt-in for IDE integration | Only expose container filesystem to host when user explicitly enables it | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-10 after initialization*
