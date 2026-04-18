# Milestones

## v1.0 milestone (Shipped: 2026-04-18)

**Phases completed:** 3 phases, 11 plans, 15 tasks

**Key accomplishments:**

- PTY-over-WebSocket backend with interactive Docker exec, terminal socket events, and session-scoped lifecycle management with all four STRIDE threats mitigated
- xterm.js terminal component with PTY socket hook, tab state management, and extensible tab bar using MUI
- Integrated tab bar, keyboard shortcut, and badge indicators into SessionDetails — wiring Plans 01 and 02 building blocks into the running-session view
- skillsDirectory on Settings with MountPathValidator, skillsPath/mountSkills on SessionConfigDto, and container options extension for skills provisioning
- Read-only skills bind mount in Docker containers with entrypoint symlinks to all 4 agent discovery paths (.claude, .cursor, .agents, .codex)
- Skills directory field in Settings General tab and mount toggle in Create Session with opt-out, disabled state, and restart notice — all copy matching UI-SPEC.md contract
- 1. [Rule 3 - Blocking] Used `DockerEngineService` instead of `DockerContainerExecService`
- 1. [Rule 3 - Blocking] Shiki engine export name
- 1. [Rule 2 - Critical] Gate `useFileIndex` on `SessionStatus.RUNNING`
- ideCommand now round-trips through PUT→GET /api/settings, and the tab-cycle hotkey fires on both macOS (⌘+`) and Windows/Linux (Ctrl+`) with a literal `Control+`` macOS fallback.

### Known gaps at v1.0 close

- **Scope:** v1.0 delivered **three** executed phase directories (`01-session-ux`, `02-skills-provisioning`, `03-workspace-api-file-explorer`). Roadmap items for diff review, git automation, and multi-agent runner were **not** implemented in this release.
- **Requirements doc:** The live `REQUIREMENTS.md` at close had **stale checkboxes and traceability rows** relative to shipped work; the archive [v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md) preserves the file as-of close. Reconcile checked items when defining the next milestone.
- **Audits:** No `.planning/v1.0-MILESTONE-AUDIT.md` was present. `gsd-tools audit-open` hit a tooling error (`output is not defined`) during pre-close; automated open-artifact scan was skipped.

---
