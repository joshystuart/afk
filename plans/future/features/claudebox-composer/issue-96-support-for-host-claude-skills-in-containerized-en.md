---
source: RchGrav/claudebox
kind: issue
number: 96
state: open
url: https://github.com/RchGrav/claudebox/issues/96
author: b00y0h
comments: 1
created_at: 2026-01-09T06:05:29Z
updated_at: 2026-01-21T09:55:11Z
---

# Support for host ~/.claude skills in containerized environments

## Problem

Currently, claudebox mounts a per-project isolated `.claude` directory from `~/.claudebox///.claude` into containers, which prevents access to user-installed skills from the host&#39;s `~/.claude` directory.

This means global skills (like [get-shit-done](https://github.com/coleam00/get-shit-done-ai)) that users install in their host `~/.claude` directory are not available inside claudebox containers.

## Current Behavior

From `lib/docker.sh`:

```bash
-v &#34;$PROJECT_SLOT_DIR/.claude&#34;:/home/$DOCKER_USER/.claude
```

Where `PROJECT_SLOT_DIR` = `~/.claudebox///.claude` (isolated per-project)

## Expected Behavior

Users should be able to access their global Claude Code skills installed in the host `~/.claude` directory across all claudebox projects, similar to how Claude Code CLI works natively.

## Reproduction

1. Install a skill in host `~/.claude/` (e.g., GSD skills)
2. Run claudebox with `/user:gsd:plan-phase` or similar skill command
3. Observe &#34;Error reading file&#34; for skill templates/workflows in `~/.claude/get-shit-done/`

## Proposed Solutions

### Option 1: Additional Read-Only Mount

Mount host `~/.claude` as a secondary read-only directory:

```bash
-v &#34;$HOME/.claude&#34;:/home/$DOCKER_USER/.claude-host:ro
```

Then either:

- Merge skills from both directories in the container entrypoint
- Document how users can symlink from `.claude-host` to `.claude`

### Option 2: Layered Approach

- Keep per-project `.claude` for project-specific overrides
- Mount host `~/.claude` at the same location with lower priority
- Project-specific files override global ones

### Option 3: Configuration Flag

Add a `--mount-host-claude` flag or config option for users who want this behavior while maintaining current isolation for those who prefer it.

## Additional Context

- The per-project isolation is valuable for project-specific configurations
- However, skills are typically meant to be global utilities that work across all projects
- SSH keys are already mounted from host (`-v &#34;$HOME/.ssh&#34;`) read-only, similar pattern could work for skills

## AFK planning summary

- **Category**: Global Claude config & skills (~/.claude mount, --global)
- **Theme key**: `global_claude_settings`
- **Short description**: Support for host ~/.claude skills in containerized environments — Mount or opt into host `~/.claude` (settings, commands, skills) instead of only isolated project dirs.
