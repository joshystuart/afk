# Phase 2: Skills Provisioning - Research

**Researched:** 2026-04-11
**Domain:** Docker bind mounts, container entrypoint scripting, NestJS settings/entity patterns
**Confidence:** HIGH

## Summary

Skills Provisioning is a vertical feature that threads through Settings persistence, Docker container creation, and container entrypoint logic. The codebase already has mature patterns for each layer — embedded settings columns, bind mount arrays in `DockerContainerProvisioningService`, and a shell entrypoint that orchestrates startup steps. The implementation extends these established patterns rather than introducing new libraries or architectural concepts.

The primary technical risk is the interaction between the skills bind mount and the existing named volume at `/home/afk/.claude`. Since Docker named volumes "own" their mount point, the `~/.claude/skills/` symlink must be created at container startup inside the volume, not baked into the image. The entrypoint already follows a step-based pattern that accommodates this cleanly.

**Primary recommendation:** Extend the existing settings → session config → container options → Docker API pipeline, add a skills bind mount to `HostConfig.Binds`, pass an env var flag to the entrypoint, and add a symlink-creation step in `entrypoint.sh`.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Mount the user's host skills directory at `/home/afk/.skills/` inside the container as a read-only bind mount (`:ro`)
- **D-02:** Container startup/entrypoint creates symlinks from `/home/afk/.skills/` to all four agent discovery paths:
  - `~/.claude/skills/` (Claude Code, GSD)
  - `~/.cursor/skills/` (Cursor)
  - `~/.agents/skills/` (Codex, skills.sh, superpowers)
  - `~/.codex/skills/` (Cursor compat)
- **D-03:** Symlinks are created at container startup (entrypoint script), not baked into the Docker image — works with existing images, no rebuild required
- **D-04:** Symlinks are only created if `/home/afk/.skills/` mount exists — containers without skills configured skip this step silently
- **D-05:** The existing named volume at `/home/afk/.claude` means the `~/.claude/skills/` symlink must be created inside that volume at startup (the volume owns the parent directory)
- **D-06:** Claude's discretion on the exact field design — a single "Skills Directory" text field pointing to the host folder is the simplest and recommended approach
- **D-07:** Skills configuration lives in its own "Skills" subsection within the General tab in Settings UI, visually separated from the Workspace section
- **D-08:** Follow the established pattern: embedded column on settings entity → `SettingsUpdateData` / `Settings.update()` → `UpdateSettingsRequest` + `GetSettingsResponseDto` → web types + settings tab section
- **D-09:** Skills mounting is automatic for all new sessions when a skills directory is configured — on by default
- **D-10:** Session creation provides a per-session opt-out toggle to skip skills mounting for that specific session
- **D-11:** When the user changes the skills directory in Settings, show a notice that running sessions need restart to pick up the change — existing containers keep their current state
- **D-12:** The opt-out state should be persisted on the session config so recreated/restarted containers respect the choice
- **D-13:** No ecosystem presets or detection — one directory, symlink to all 4 discovery paths. All ecosystems use the same SKILL.md standard
- **D-14:** Reuse/extend `MountPathValidator` for validating the host skills directory path — same safety checks as workspace mount

### Claude's Discretion

- Exact settings field layout and labels within the Skills section
- How to present the "restart needed" notice (toast, banner, inline warning)
- Whether ephemeral/scheduled-job containers also get skills (likely no — they're short-lived automation)
- Handling edge cases: skills directory removed from host while containers running, empty directory

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                            | Research Support                                                                                                                                        |
| ------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SKIL-01 | User can configure a skills directory path in Settings                                 | Settings entity embedded column pattern (GeneralSettings), UpdateSettingsRequest DTO, GeneralSettings.tsx form field pattern — all verified in codebase |
| SKIL-02 | Session containers mount the configured skills directory as read-only at creation time | DockerContainerProvisioningService Binds array, ContainerCreateOptions interface, CreateSessionRequestService settings loading — all verified           |
| SKIL-03 | Skills mounting supports multiple ecosystem layouts (GSD, skills.sh, superpowers)      | Entrypoint symlink approach creates all 4 discovery paths from single mount — decision D-02/D-13                                                        |

</phase_requirements>

## Standard Stack

No new libraries required. This phase extends existing patterns using the established stack.

### Core (Existing — Extend)

| Library         | Version  | Purpose                     | Extension Needed                                  |
| --------------- | -------- | --------------------------- | ------------------------------------------------- |
| TypeORM         | existing | Settings entity persistence | Add `skillsDirectory` column to embedded settings |
| class-validator | existing | DTO validation              | Add `@IsOptional() @IsString()` for skills fields |
| dockerode       | existing | Container creation API      | Add skills bind to `HostConfig.Binds` array       |
| @mui/material   | existing | Settings UI                 | Add Skills subsection with TextField + Switch     |
| zustand         | existing | Settings state              | Extend types for skills fields                    |

### Supporting (Existing — Reuse)

| Library            | Version        | Purpose           | Reuse                                                     |
| ------------------ | -------------- | ----------------- | --------------------------------------------------------- |
| MountPathValidator | N/A (internal) | Path validation   | Validate skills directory (same rules as workspace mount) |
| entrypoint.sh      | N/A (internal) | Container startup | Add symlink creation step                                 |

**Installation:** None — no new dependencies needed.

## Architecture Patterns

### Data Flow: Settings → Container

The existing pipeline for workspace mounting is the exact pattern to follow for skills:

```
Settings entity (DB)
  → CreateSessionRequestService.prepare() loads settings
    → SessionConfigDtoFactory.create() derives session-scoped config
      → CreateSessionStartupService.start() builds ContainerCreateOptions
        → DockerContainerProvisioningService.createContainer() sets Binds array
          → Docker API creates container with bind mount
            → entrypoint.sh creates symlinks at startup
```

[VERIFIED: codebase inspection of create-session-request.service.ts, create-session-startup.service.ts, docker-container-provisioning.service.ts]

### Pattern 1: Settings Embedded Column Group

**What:** Settings uses TypeORM embedded columns grouped by domain (GeneralSettings, DockerSettings, GitSettings).
**When to use:** Adding user-configurable values that persist across sessions.
**Existing pattern:**

```typescript
// general-settings.embedded.ts — add skillsDirectory field
export class GeneralSettings {
  @Column('varchar', { length: 500, nullable: true })
  skillsDirectory?: string | null;
}
```

```typescript
// settings.entity.ts — extend SettingsUpdateData and update() method
export interface SettingsUpdateData {
  // ...existing fields...
  skillsDirectory?: string;
}

// In Settings.update():
if (data.skillsDirectory !== undefined) {
  this.general.skillsDirectory = data.skillsDirectory || null;
}
```

[VERIFIED: codebase pattern from general-settings.embedded.ts and settings.entity.ts]

### Pattern 2: Session Config Persistence

**What:** Session config is a JSON column storing creation-time settings. Container recreation reads from this config, not from current settings.
**When to use:** Any per-session configuration that must survive container restarts.
**Existing pattern:**

```typescript
// session-config.dto.ts — add skills fields
export class SessionConfigDto {
  constructor(
    // ...existing params...
    public readonly skillsPath: string | null = null,
    public readonly mountSkills: boolean = true,
  ) {}
}
```

[VERIFIED: session-config.dto.ts stores hostMountPath for the same persistence need]

### Pattern 3: Bind Mount Extension

**What:** `DockerContainerProvisioningService.createContainer()` builds a `Binds` array. Each entry is `hostPath:containerPath:mode`.
**When to use:** Adding a new host-to-container file mapping.
**Existing pattern:**

```typescript
Binds: [
  `afk-tmux-${options.sessionId}:/home/afk/.tmux/resurrect`,
  `afk-claude-${options.sessionId}:/home/afk/.claude`,
  ...(options.hostMountPath
    ? [`${options.hostMountPath}:${this.getContainerMountTarget(options.repoUrl)}:rw`]
    : []),
  // NEW: Skills mount
  ...(options.skillsPath
    ? [`${options.skillsPath}:/home/afk/.skills:ro`]
    : []),
],
```

[VERIFIED: docker-container-provisioning.service.ts lines 42-49]

### Pattern 4: Entrypoint Step Function

**What:** `entrypoint.sh` uses step functions (`setup_ssh`, `setup_git`, `configure_git_identity`) called from `main()`.
**When to use:** Adding container startup logic.
**Existing pattern:**

```bash
setup_skills() {
    if [ ! -d "/home/afk/.skills" ]; then
        log_info "No skills directory mounted, skipping skills setup"
        return 0
    fi

    log_step "Setting up skills symlinks"

    # Inside named volume (D-05)
    mkdir -p /home/afk/.claude/skills
    ln -sfn /home/afk/.skills /home/afk/.claude/skills

    # Direct home directory paths
    ln -sfn /home/afk/.skills /home/afk/.cursor/skills
    ln -sfn /home/afk/.skills /home/afk/.agents/skills
    ln -sfn /home/afk/.skills /home/afk/.codex/skills

    log_info "Skills symlinks created for all agent discovery paths"
}
```

[ASSUMED — entrypoint pattern matches existing step functions in entrypoint.sh]

### Anti-Patterns to Avoid

- **Baking symlinks into Docker image:** Would require image rebuilds and wouldn't work with the named volume at `~/.claude`. Decision D-03 explicitly forbids this.
- **Using Docker volume mounts instead of bind mounts:** Named volumes don't reference host directories. Bind mounts are the correct mechanism for host→container file sharing.
- **Mounting directly to agent discovery paths:** Would conflict with the named volume at `/home/afk/.claude` and would require 4 separate bind mounts instead of 1 mount + symlinks.

## Don't Hand-Roll

| Problem               | Don't Build               | Use Instead                                | Why                                                                 |
| --------------------- | ------------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| Path validation       | Custom validation logic   | `MountPathValidator`                       | Already handles system path rejection, depth checks, symlink safety |
| Settings persistence  | Manual DB queries         | `Settings.update()` + embedded columns     | Established pattern with validation                                 |
| Form state management | Manual useState per field | Existing `useSettingsStore` + form pattern | Already handles loading, errors, optimistic updates                 |

**Key insight:** Every layer of this feature has an existing pattern to copy. The risk is in the seams between layers, not in any single layer.

## Common Pitfalls

### Pitfall 1: Named Volume Overwrites Symlink Target

**What goes wrong:** The `afk-claude-{sessionId}` named volume is mounted at `/home/afk/.claude`. On first container creation, Docker initializes the volume from the image contents. On subsequent starts, the volume persists and the image layer is ignored. If you create `~/.claude/skills` in the Dockerfile, it will only exist on the first run.
**Why it happens:** Docker named volumes have "copy-up" semantics only on first creation.
**How to avoid:** Create the symlink at runtime in `entrypoint.sh`, not in the Dockerfile. Check for mount existence (`[ -d "/home/afk/.skills" ]`) before creating symlinks.
**Warning signs:** Skills work on first session but disappear after container restart.

[VERIFIED: Docker named volume behavior from docker-container-provisioning.service.ts showing `afk-claude-{sessionId}:/home/afk/.claude`]

### Pitfall 2: Parent Directory Doesn't Exist for Symlinks

**What goes wrong:** `ln -sfn /home/afk/.skills /home/afk/.cursor/skills` fails because `/home/afk/.cursor/` doesn't exist yet in the container.
**Why it happens:** The base Dockerfile only creates `/home/afk/.claude` and `/home/afk/.ssh`. Other agent config directories aren't pre-created.
**How to avoid:** `mkdir -p` the parent directory before creating each symlink. For `~/.claude/skills/`, the volume already provides the parent. For others, create parents explicitly.
**Warning signs:** Entrypoint fails silently or with "No such file or directory" for some but not all symlinks.

[VERIFIED: Dockerfile creates `/home/afk/.claude`, `.ssh`, `.gitconfig.d` but NOT `.cursor`, `.agents`, `.codex`]

### Pitfall 3: Session Config Not Updated for Container Recreation

**What goes wrong:** User creates a session with skills, stops it, changes skills directory in settings, restarts session. The recreated container uses the old skills path because `StartSessionInteractor.recreateContainer` reads from `session.config`, not current settings.
**Why it happens:** Session config is snapshot at creation time. This is by design (D-11: "running sessions need restart to pick up the change").
**How to avoid:** Store `skillsPath` in `SessionConfigDto` at session creation. Document that this is intentional behavior matching the workspace mount pattern.
**Warning signs:** Changing skills directory doesn't affect running/stopped sessions (this is expected behavior, not a bug).

[VERIFIED: start-session.interactor.ts recreateContainer() reads from session.config lines 128-134]

### Pitfall 4: Symlink Points to Empty or Missing Mount

**What goes wrong:** Skills directory is removed from host after container is running. The bind mount becomes empty or inaccessible. Agent tools see the symlinks but find no content.
**Why it happens:** Docker bind mounts reference host paths that can change.
**How to avoid:** The entrypoint should check mount existence at startup. For runtime removal, this is an edge case with no clean solution — the bind mount path will show as empty. This is acceptable behavior (same as workspace mount).
**Warning signs:** Agent reports "no skills found" despite symlinks existing.

### Pitfall 5: Read-Only Mount Prevents Symlink Inside Mount

**What goes wrong:** Attempting to create a symlink inside `/home/afk/.skills/` (the read-only mount) fails with EROFS.
**Why it happens:** The `:ro` flag prevents all writes to the mount point and its contents.
**How to avoid:** Symlinks point TO the mount, they are created OUTSIDE it (in `~/.claude/skills/`, etc.). The symlink itself lives in a writable location; only the target is read-only.
**Warning signs:** "Read-only file system" errors at startup.

## Code Examples

### Settings Entity Extension

```typescript
// general-settings.embedded.ts
@Column('varchar', { length: 500, nullable: true })
skillsDirectory?: string | null;
```

[VERIFIED: follows exact pattern of defaultMountDirectory in same file]

### Container Create Options Extension

```typescript
// container.entity.ts — ContainerCreateOptions
export interface ContainerCreateOptions {
  // ...existing fields...
  skillsPath?: string;
}
```

[VERIFIED: follows hostMountPath optional field pattern in same interface]

### Bind Mount Array Extension

```typescript
// docker-container-provisioning.service.ts — in createContainer()
Binds: [
  `afk-tmux-${options.sessionId}:/home/afk/.tmux/resurrect`,
  `afk-claude-${options.sessionId}:/home/afk/.claude`,
  ...(options.hostMountPath
    ? [`${options.hostMountPath}:${this.getContainerMountTarget(options.repoUrl)}:rw`]
    : []),
  ...(options.skillsPath
    ? [`${options.skillsPath}:/home/afk/.skills:ro`]
    : []),
],
```

[VERIFIED: extends existing conditional bind mount pattern]

### Entrypoint Symlink Function

```bash
# entrypoint.sh — new setup_skills function
setup_skills() {
    if [ ! -d "/home/afk/.skills" ]; then
        log_info "No skills directory mounted, skipping skills setup"
        return 0
    fi

    log_step "Setting up skills symlinks"

    # ~/.claude/skills/ — inside named volume, parent exists
    mkdir -p /home/afk/.claude/skills 2>/dev/null || true
    rm -rf /home/afk/.claude/skills
    ln -sfn /home/afk/.skills /home/afk/.claude/skills

    # ~/.cursor/skills/ — parent may not exist
    mkdir -p /home/afk/.cursor
    ln -sfn /home/afk/.skills /home/afk/.cursor/skills

    # ~/.agents/skills/
    mkdir -p /home/afk/.agents
    ln -sfn /home/afk/.skills /home/afk/.agents/skills

    # ~/.codex/skills/
    mkdir -p /home/afk/.codex
    ln -sfn /home/afk/.skills /home/afk/.codex/skills

    log_info "Skills symlinks created for all agent discovery paths"
}
```

[ASSUMED — based on entrypoint.sh step function pattern and D-02/D-04/D-05 requirements]

### Session Config DTO Extension

```typescript
// session-config.dto.ts
export class SessionConfigDto {
  constructor(
    public readonly repoUrl: string | null,
    public readonly branch: string,
    public readonly gitUserName: string,
    public readonly gitUserEmail: string,
    public readonly hasSSHKey: boolean,
    public readonly hostMountPath: string | null = null,
    public readonly cleanupOnDelete: boolean = false,
    public readonly skillsPath: string | null = null,
    public readonly mountSkills: boolean = true,
  ) {}
}
```

[VERIFIED: extends existing constructor parameter pattern]

### Web Settings UI — Skills Section

```tsx
// GeneralSettings.tsx — new Skills subsection
<Box sx={{ mb: 4 }}>
  <SectionHeader title="Skills" />
  <TextField
    fullWidth
    label="Skills Directory"
    value={formData.skillsDirectory}
    onChange={handleInputChange('skillsDirectory')}
    placeholder="/Users/josh/.skills"
    helperText="Host directory containing agent skills. Mounted read-only into all new session containers."
  />
</Box>
```

[VERIFIED: follows exact SectionHeader + TextField pattern from GeneralSettings.tsx Workspace section]

### Create Session Form — Skills Opt-Out Toggle

```tsx
// CreateSession.tsx — new Skills section
<Box sx={{ mb: 4 }}>
  <SectionHeader title="Skills" />
  <FormControlLabel
    control={
      <Switch
        checked={mountSkills}
        onChange={(e) => setMountSkills(e.target.checked)}
        disabled={!hasSkillsDirectory}
        size="small"
      />
    }
    label={
      <Typography variant="body2" sx={{ color: afkColors.textPrimary }}>
        Mount skills directory
      </Typography>
    }
  />
</Box>
```

[VERIFIED: follows existing mountToHost Switch pattern in CreateSession.tsx]

## State of the Art

| Old Approach                 | Current Approach                            | When Changed       | Impact                                                         |
| ---------------------------- | ------------------------------------------- | ------------------ | -------------------------------------------------------------- |
| Per-agent config directories | Unified SKILL.md standard across ecosystems | 2025+              | All agents scan overlapping paths — one symlink strategy works |
| Baked-in image config        | Runtime entrypoint configuration            | Established in AFK | No image rebuilds for config changes                           |

## Assumptions Log

| #   | Claim                                                                             | Section             | Risk if Wrong                                                                            |
| --- | --------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------- |
| A1  | `~/.cursor/`, `~/.agents/`, `~/.codex/` directories don't exist in the base image | Pitfall 2           | Symlink creation would need adjustment if these already exist as real directories        |
| A2  | `ln -sfn` correctly replaces existing symlinks and creates new ones idempotently  | Code Examples       | If not idempotent, container restarts would fail on second run                           |
| A3  | Ephemeral/scheduled-job containers should NOT get skills mounting                 | Claude's Discretion | If skills are needed for scheduled jobs, the ephemeral container flow needs updating too |

## Open Questions

1. **TypeORM migration for new column**
   - What we know: Adding `skillsDirectory` to `GeneralSettings` embedded class adds a column to the `settings` table
   - What's unclear: Whether TypeORM's `synchronize: true` handles this automatically in dev, or if a migration is needed
   - Recommendation: For SQLite (dev), synchronize handles it. For PostgreSQL (prod), a migration may be needed. Check `database.config.ts` for synchronize setting.

2. **Skills directory validation timing**
   - What we know: D-14 says reuse MountPathValidator. The CONTEXT.md suggests validation on both settings save and session creation.
   - What's unclear: Should validation on settings save check that the directory exists, or just validate the path format? The directory might not exist yet when configuring.
   - Recommendation: Settings save validates path format only (forbidden paths, depth). Session creation validates existence. This matches how `defaultMountDirectory` works — it's a base path, not required to exist at config time.

## Validation Architecture

### Test Framework

| Property           | Value                                                          |
| ------------------ | -------------------------------------------------------------- |
| Framework          | Jest 29                                                        |
| Config file        | `server/package.json` jest block + `server/test/jest-e2e.json` |
| Quick run command  | `npm test -- --testPathPattern=<file>` (from `server/`)        |
| Full suite command | `npm test` (from `server/`)                                    |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                      | Test Type | Automated Command                                             | File Exists? |
| ------- | ------------------------------------------------------------- | --------- | ------------------------------------------------------------- | ------------ |
| SKIL-01 | Settings entity stores/retrieves skillsDirectory              | unit      | `npm test -- --testPathPattern=settings.entity`               | ❌ Wave 0    |
| SKIL-01 | Update settings request accepts skillsDirectory field         | unit      | `npm test -- --testPathPattern=update-settings`               | ❌ Wave 0    |
| SKIL-02 | Provisioning service adds skills bind when skillsPath set     | unit      | `npm test -- --testPathPattern=docker-container-provisioning` | ✅ Extend    |
| SKIL-02 | Provisioning service omits skills bind when skillsPath absent | unit      | `npm test -- --testPathPattern=docker-container-provisioning` | ✅ Extend    |
| SKIL-02 | Skills bind uses `:ro` mode                                   | unit      | `npm test -- --testPathPattern=docker-container-provisioning` | ✅ Extend    |
| SKIL-03 | SessionConfigDto stores skills fields                         | unit      | `npm test -- --testPathPattern=session-config`                | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern=<changed-file>` from `server/`
- **Per wave merge:** `npm test` from `server/`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] Extend `docker-container-provisioning.service.spec.ts` — add skills bind mount assertions
- [ ] `settings.entity` test — verify `update()` handles `skillsDirectory`
- [ ] `session-config.dto` test — verify new fields serialize/deserialize

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                 |
| --------------------- | ------- | ---------------------------------------------------------------- |
| V2 Authentication     | no      | —                                                                |
| V3 Session Management | no      | —                                                                |
| V4 Access Control     | yes     | Read-only bind mount (`:ro` flag enforced by Docker engine)      |
| V5 Input Validation   | yes     | MountPathValidator (forbidden paths, depth >= 2, symlink safety) |
| V6 Cryptography       | no      | —                                                                |

### Known Threat Patterns

| Pattern                                     | STRIDE                 | Standard Mitigation                                                              |
| ------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| Path traversal via skills directory setting | Tampering              | MountPathValidator rejects system paths, enforces depth >= 2                     |
| Container writes to skills directory        | Elevation of Privilege | `:ro` bind mount flag — Docker engine enforces at kernel level                   |
| Symlink escape from skills directory        | Tampering              | MountPathValidator.validateReal() resolves symlinks before accepting path        |
| Skill content injection                     | Tampering              | Read-only mount prevents modification; skills are trusted user content from host |

## Sources

### Primary (HIGH confidence)

- Codebase inspection: `settings.entity.ts`, `general-settings.embedded.ts`, `docker-settings.embedded.ts` — settings persistence pattern
- Codebase inspection: `docker-container-provisioning.service.ts` — bind mount creation pattern
- Codebase inspection: `create-session-request.service.ts`, `create-session-startup.service.ts` — settings → container flow
- Codebase inspection: `entrypoint.sh` — container startup step pattern
- Codebase inspection: `base/Dockerfile` — image filesystem layout, named volume targets
- Codebase inspection: `mount-path.validator.ts` — path validation implementation
- Codebase inspection: `session-config.dto.ts`, `session-config-dto.factory.ts` — per-session config persistence

### Secondary (MEDIUM confidence)

- Docker documentation: bind mount `:ro` flag behavior, named volume copy-up semantics

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new libraries, extending verified patterns
- Architecture: HIGH — every layer has an existing pattern to replicate
- Pitfalls: HIGH — volume interaction verified in codebase, symlink mechanics are well-understood

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (stable — no external dependency changes expected)
