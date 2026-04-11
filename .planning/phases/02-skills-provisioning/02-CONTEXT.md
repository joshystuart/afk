# Phase 2: Skills Provisioning - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can equip their sessions with skill ecosystems that persist across all containers. A single host directory is mounted read-only into each container at a canonical path, with startup symlinks ensuring all supported agents (Claude Code, Codex, Cursor) discover the skills at their expected locations. This phase delivers the settings configuration, Docker bind mount integration, container startup symlinking, session-level opt-out, and validation — not new agent runner logic or skill authoring tools.

</domain>

<decisions>
## Implementation Decisions

### Container Mount Layout

- **D-01:** Mount the user's host skills directory at `/home/afk/.skills/` inside the container as a read-only bind mount (`:ro`)
- **D-02:** Container startup/entrypoint creates symlinks from `/home/afk/.skills/` to all four agent discovery paths:
  - `~/.claude/skills/` (Claude Code, GSD)
  - `~/.cursor/skills/` (Cursor)
  - `~/.agents/skills/` (Codex, skills.sh, superpowers)
  - `~/.codex/skills/` (Cursor compat)
- **D-03:** Symlinks are created at container startup (entrypoint script), not baked into the Docker image — works with existing images, no rebuild required
- **D-04:** Symlinks are only created if `/home/afk/.skills/` mount exists — containers without skills configured skip this step silently
- **D-05:** The existing named volume at `/home/afk/.claude` means the `~/.claude/skills/` symlink must be created inside that volume at startup (the volume owns the parent directory)

### Settings Configuration

- **D-06:** Claude's discretion on the exact field design — a single "Skills Directory" text field pointing to the host folder is the simplest and recommended approach
- **D-07:** Skills configuration lives in its own "Skills" subsection within the General tab in Settings UI, visually separated from the Workspace section
- **D-08:** Follow the established pattern: embedded column on settings entity → `SettingsUpdateData` / `Settings.update()` → `UpdateSettingsRequest` + `GetSettingsResponseDto` → web types + settings tab section

### Session-Level Behavior

- **D-09:** Skills mounting is automatic for all new sessions when a skills directory is configured — on by default
- **D-10:** Session creation provides a per-session opt-out toggle to skip skills mounting for that specific session
- **D-11:** When the user changes the skills directory in Settings, show a notice that running sessions need restart to pick up the change — existing containers keep their current state
- **D-12:** The opt-out state should be persisted on the session config so recreated/restarted containers respect the choice

### Ecosystem Handling

- **D-13:** No ecosystem presets or detection — one directory, symlink to all 4 discovery paths. All ecosystems (GSD, skills.sh, superpowers) use the same SKILL.md standard, and all agents scan overlapping directories
- **D-14:** Reuse/extend `MountPathValidator` for validating the host skills directory path — same safety checks as workspace mount (no system paths, depth >= 2, symlink safety)

### Claude's Discretion

- Exact settings field layout and labels within the Skills section
- How to present the "restart needed" notice (toast, banner, inline warning)
- Whether ephemeral/scheduled-job containers also get skills (likely no — they're short-lived automation)
- Handling edge cases: skills directory removed from host while containers running, empty directory

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Settings pattern (end-to-end)

- `server/src/domain/settings/settings.entity.ts` — Settings entity with embedded column groups, `update()` method
- `server/src/domain/settings/general-settings.embedded.ts` — GeneralSettings with `defaultMountDirectory` (pattern to follow)
- `server/src/domain/settings/docker-settings.embedded.ts` — DockerSettings embedded class
- `server/src/interactors/settings/update-settings/update-settings-request.dto.ts` — Update DTO with class-validator
- `server/src/interactors/settings/update-settings/update-settings.interactor.ts` — Update interactor pattern
- `server/src/interactors/settings/get-settings/get-settings-response.dto.ts` — Response DTO with `fromDomain()`
- `web/src/pages/settings/GeneralSettings.tsx` — Settings form field pattern (workspace mount field to mirror)
- `web/src/stores/settings.store.ts` — Settings state management
- `web/src/api/settings.api.ts` — Settings API client

### Docker container creation

- `server/src/libs/docker/docker-container-provisioning.service.ts` — Container provisioning with `HostConfig.Binds` array (extend for skills)
- `server/src/libs/docker/docker-engine.service.ts` — Engine service calling provisioning
- `server/src/libs/docker/docker.constants.ts` — Container path constants (`WORKSPACE_BASE_PATH`)
- `server/src/domain/containers/container.entity.ts` — `ContainerCreateOptions` (extend with skills fields)

### Session creation flow

- `server/src/interactors/sessions/create-session/create-session-request.service.ts` — Session request preparation (loads settings, builds config)
- `server/src/domain/sessions/session-config-dto.factory.ts` — Config factory with mount path derivation (pattern for skills toggle)
- `server/src/interactors/sessions/start-session/start-session.interactor.ts` — Session restart/recreate path (must also handle skills)

### Validation

- `server/src/libs/validators/mount-path.validator.ts` — MountPathValidator (reuse for skills directory validation)

### Docker image / entrypoint

- `docker/` — Docker image build scripts (entrypoint modification for symlink creation)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `MountPathValidator` — Validates host paths (no system paths, depth >= 2, symlink safety). Reuse for skills directory.
- `Settings.update()` pattern — Flat DTO → embedded column mapping with validation. Follow for skills fields.
- `GeneralSettings.tsx` — Form field pattern with save/error handling. Mirror for skills section.
- `DockerContainerProvisioningService.Binds` — Centralized bind mount list. Extend with skills bind.

### Established Patterns

- Settings follow embedded column groups (`GeneralSettings`, `DockerSettings`, `GitSettings`)
- Session config is derived from settings at creation time (`CreateSessionRequestService.prepare`)
- Docker binds use format `hostPath:containerPath:mode` where mode is `:rw` or `:ro`
- Container options flow: settings → session config → container create options → Docker API

### Integration Points

- `DockerContainerProvisioningService.createContainer` — Add skills bind to `HostConfig.Binds` array
- `ContainerCreateOptions` — Add `skillsPath?: string` and `mountSkills?: boolean` fields
- `CreateSessionRequestService.prepare` — Load skills directory from settings, respect opt-out
- `SessionConfigDtoFactory` — Add skills-related fields to session config
- `docker/` entrypoint script — Add symlink creation logic
- `GeneralSettings.tsx` — Add Skills subsection with directory path field

</code_context>

<specifics>
## Specific Ideas

- The symlink approach means existing Docker images work without rebuilds — only the entrypoint needs to handle the new mount
- Skills directory validation should happen both on settings save (path exists, valid) and on session create (still exists)
- The `:ro` suffix on the bind mount is the first use of read-only mounts in the codebase — establishes the pattern for future security-constrained mounts

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 02-skills-provisioning_
_Context gathered: 2026-04-11_
