# Phase 2: Skills Provisioning - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-11
**Phase:** 02-skills-provisioning
**Areas discussed:** Container mount layout, Settings configuration, Session-level behavior, Ecosystem detection

---

## Container Mount Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Single canonical path | Mount once at /home/afk/.skills/, symlink to each ecosystem path. Cleanest bind, flexible symlinking. | ✓ |
| Multiple bind mounts | Mount same host dir at each expected path. More binds but no symlink step. | |
| You decide | Pick what works best given the named volume constraint. | |

**User's choice:** Single canonical path with symlinks
**Notes:** Existing named volume at /home/afk/.claude means direct sub-path mounting needs care — symlinks handle this.

### Follow-up: Symlink Targets

| Option | Description | Selected |
|--------|-------------|----------|
| ~/.claude/skills/ | Claude Code personal skills | |
| ~/.cursor/skills/ | Cursor skills | |
| ~/.agents/skills/ | Generic agent standard (skills.sh) | |
| All of the above | All major paths + future paths at Claude's discretion | ✓ |
| You decide | What's sensible for supported agents | |

**User's choice:** All major paths plus future paths

### Follow-up: Symlink Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Container startup/entrypoint | Create symlinks at container start if mount exists. No image rebuild. | ✓ |
| Docker image build | Bake symlink creation into Dockerfile. Cleaner runtime. | |
| You decide | | |

**User's choice:** Container startup/entrypoint

### Follow-up: Canonical Path

| Option | Description | Selected |
|--------|-------------|----------|
| /home/afk/.skills/ | Hidden dir in home, consistent with other dot-dirs | ✓ |
| /skills/ | Top-level, very visible | |
| You decide | | |

**User's choice:** /home/afk/.skills/

---

## Settings Configuration

### Settings Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Single directory path | One 'Skills Directory' text field. Mirrors 'Default Mount Directory' pattern. | |
| Multiple directory paths | Separate fields per ecosystem. More flexible but more UI surface. | |
| Single path + enable toggle | One directory path plus explicit on/off toggle. | |
| You decide | | ✓ |

**User's choice:** You decide (Claude's discretion — single path is simplest)

### Settings UI Location

| Option | Description | Selected |
|--------|-------------|----------|
| General tab | Under existing 'Workspace' section near 'Default Mount Directory'. | |
| Own section in General tab | New 'Skills' subsection, visually separated. | ✓ |
| Docker tab | Since it affects container provisioning. | |
| You decide | | |

**User's choice:** Own section in General tab

---

## Session-Level Behavior

### Default Mounting

| Option | Description | Selected |
|--------|-------------|----------|
| Automatic for all | Every new session gets skills if configured. No per-session toggle. | |
| Per-session opt-in | Like workspace mount, user chooses per session. | |
| Automatic with per-session opt-out | On by default when configured, toggle to skip for a session. | ✓ |
| You decide | | |

**User's choice:** Automatic with per-session opt-out

### Running Sessions

| Option | Description | Selected |
|--------|-------------|----------|
| New sessions only | Existing containers unchanged. Clean and predictable. | |
| Prompt to restart | Show notice that running sessions need restart. | ✓ |
| You decide | | |

**User's choice:** Prompt to restart

---

## Ecosystem Detection

### Initial Choice

| Option | Description | Selected |
|--------|-------------|----------|
| Transparent mount | Just mount and symlink. No detection, no awareness. | |
| Validate on save | Scan for SKILL.md files on save. Warning if nothing found. | |
| Ecosystem presets | User selects ecosystem, mount to specific paths. | ✓ (initial) |

**User's initial choice:** Ecosystem presets
**Notes:** User asked for research on best approach for supporting Claude, Cursor, Codex and major ecosystems.

### After Research

Research revealed all agents scan overlapping paths and all ecosystems use the same SKILL.md standard:
- Claude Code: `~/.claude/skills/` (primary), `~/.agents/skills/`
- Codex: `~/.agents/skills/` (primary)
- Cursor: `~/.cursor/skills/` (primary), `~/.claude/skills/` (compat), `~/.codex/skills/` (compat)

| Option | Description | Selected |
|--------|-------------|----------|
| Simplified approach | One directory, symlink to all 4 discovery paths. No presets needed. | ✓ |
| Keep presets | Explicitly choose which ecosystems to activate. | |
| Other | Different approach. | |

**User's revised choice:** Simplified approach — one directory, symlink everywhere

### Validation

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse MountPathValidator | Same safety checks as workspace mount. | ✓ |
| Existence check only | Just verify directory exists. | |
| You decide | | |

**User's choice:** Reuse MountPathValidator

---

## Claude's Discretion

- Settings field layout and labels
- Restart notice presentation style
- Ephemeral container skills policy
- Edge case handling (missing directory, empty directory)

## Deferred Ideas

None — discussion stayed within phase scope
