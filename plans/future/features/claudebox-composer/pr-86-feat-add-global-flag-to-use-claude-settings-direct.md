---
source: RchGrav/claudebox
kind: pull_request
number: 86
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/86
author: ahmet-cetinkaya
head: feat/global-config-flag
base: main
created_at: 2025-11-06T13:24:56Z
updated_at: 2025-11-06T15:45:55Z
---

# feat: Add --global flag to use ~/.claude settings directly

## Summary

Implements a new `--global` flag that allows ClaudeBox to use the user&#39;s global `~/.claude/` configuration directly instead of creating isolated project configurations.

## Problem

Previously, users had to manually copy their global configuration from `~/.claude/` into each project&#39;s `.claude/` directory. This was inconvenient and not scalable for users who prefer a single, global setup.

## Solution

Added a `--global` flag that:

- Mounts user&#39;s home directories directly (`~/.claude`, `~/.config`, `~/.cache`)
- Uses global configuration stored in `~/.claudebox/global/`
- Creates separate `claudebox-global` Docker image
- Maintains full backward compatibility with existing project isolation

## Changes Made

### CLI Parser (`lib/cli.sh`)

- Added `--global` to `HOST_ONLY_FLAGS` array
- Added processing logic to set `GLOBAL_MODE=true`

### Global Mode Logic (`lib/project.sh`)

- Added `use_global_mode()`, `init_global_mode()`, `get_global_dir()` functions
- Modified `get_project_folder_name()` to return &#34;global&#34; in global mode
- Modified `get_image_name()` to return &#34;claudebox-global&#34; for global mode

### Docker Mounting (`lib/docker.sh`)

- Conditional mounting strategy:
  - **Global Mode**: Direct mounts to user&#39;s home directories
  - **Project Mode**: Existing slot-based mounting
- Skip project-specific MCP configurations in global mode

### Configuration Handling (`lib/config.sh`)

- Updated profile file paths to use global directory in global mode
- Modified current profiles logic for global mode

### Main Script Integration (`main.sh`)

- Added global mode detection and setup logic
- Updated project/slot directory handling for both modes

## Usage

```bash
# Use global configuration
claudebox --global

# Add profiles to global config
claudebox --global add python rust

# Show global profiles
claudebox --global profiles

# Normal project mode (unchanged)
claudebox add core
```

## Testing

✅ CLI parser correctly recognizes `--global` flag
✅ Global mode creates separate `claudebox-global` Docker image
✅ Configuration stored in `~/.claudebox/global/` with proper symlinks
✅ Profile management works in global mode
✅ Project mode continues to work without changes
✅ Complete separation between global and project configurations
✅ Docker mounting works correctly for both modes

## Backward Compatibility

All existing functionality works exactly as before when the `--global` flag is not specified. No breaking changes.

Resolves #85

## Summary by Sourcery

Enable a new global mode via `--global` that mounts and uses the user&#39;s home-based ClaudeBox configuration and cache directly, backed by a dedicated Docker image, while preserving the existing per-project isolation workflow by default.

New Features:

- Add `--global` flag to enable using a single shared `~/.claudebox` configuration across all projects
- Mount host home directories (`~/.claudebox`, `~/.claude`, `~/.config`, `~/.cache`) directly in global mode
- Introduce a dedicated `claudebox-global` Docker image for global mode

Enhancements:

- Add global mode helper functions (use_global_mode, init_global_mode, get_global_dir, etc.) and initialize global config directory with symlinks
- Update CLI parser, main script, project, docker, and config modules to support toggling between global and project modes transparently
- Maintain backward compatibility so existing project isolation remains unchanged when `--global` is not specified

## AFK planning summary

- **Category**: Global Claude config & skills (~/.claude mount, --global)
- **Theme key**: `global_claude_settings`
- **Short description**: feat: Add --global flag to use ~/.claude settings directly
