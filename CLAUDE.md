# CLAUDE.md

See `AGENTS.md` for project rules (NestJS DI, `nest-typed-config`, library preferences, file-size limits, `npm run format` after changes).

## Project

**AFK (Away From Keyboard)** — open-source secure agentic coding platform that runs AI coding agents (`claude -p`, `codex`, ...) inside Docker containers with a polished web UI.

## Hard Constraints

- **Stack**: NestJS + React + TypeORM — not changing.
- **Security**: Skills and host-mounted content are read-only inside containers; no arbitrary code execution paths from UI to host.
- **Agents**: Must be invocable via CLI inside Docker — no API-level agent integration.
- **Config**: `nest-typed-config` for infrastructure (YAML → DTOs), `Settings` entity for user-configurable options. Never use `process.env` or `@nestjs/config` in application code.

## GSD Workflow

Before using Edit/Write or other file-changing tools, start work through a GSD command so planning artifacts stay in sync:

- `/gsd-quick` — small fixes, docs, ad-hoc tasks
- `/gsd-debug` — investigation and bug fixing
- `/gsd-execute-phase` — planned phase work
