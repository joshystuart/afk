---
source: RchGrav/claudebox
kind: pull_request
number: 37
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/37
author: RchGrav
head: macos-docker-fix
base: main
created_at: 2025-07-25T10:39:25Z
updated_at: 2025-07-25T10:53:41Z
---

# v2.0.0: macOS fixes and improved build system

## Summary

Major release that fixes macOS compatibility issues and improves the build/distribution system.

## Changes

### 🐛 Bug Fixes

- Fixed `systemctl: command not found` error on macOS by detecting OS and showing appropriate message
- Removed BuildKit cache mounts that caused permission issues on macOS
- Fixed chown command to use numeric IDs for macOS compatibility
- Fixed Python/uv path issues by adding PATH to shell rc files
- Fixed tmux send-keys timing by moving commands before attach
- Fixed venv creation race condition with atomic lock mechanism

### ✨ Features

- Added versioning system (CLAUDEBOX_VERSION=&#34;2.0.0&#34;)
- Improved build script with dist/ directory and versioned archives
- Added clear PATH setup instructions for first-time users
- Added comprehensive installation documentation

### 📦 Build System

- Creates `dist/claudebox.run` (self-extracting installer)
- Creates `dist/claudebox-2.0.0.tar.gz` (source archive)
- Cleans dist directory on each build
- Maintains backward compatibility symlink

## Testing

- Tested on Linux (Ubuntu/WSL2)
- Needs testing on macOS by community

## Notes

- This will become the new main branch (v2.0.0)
- Current main branch contains v1.0 (deprecated)

## Summary by Sourcery

Improve macOS support, build/distribution system, and documentation for the v2.0.0 release

New Features:

- Introduce versioning (CLAUDEBOX_VERSION=2.0.0) and generate versioned installer (dist/claudebox.run) and source archive
- Provide two installation methods (self-extracting installer and tarball) plus developer install path and automatic PATH configuration
- Add new tmux integration commands and menus, persistent project data handling, and clear allowlist management
- Add robust Python task manager (pytask.py) with cross-platform compatibility and extension sandbox

Bug Fixes:

- Detect missing systemctl on macOS and show appropriate message
- Remove BuildKit cache mounts and fix chown to use numeric IDs on macOS
- Resolve Python/uv path issues by updating shell RC files
- Correct tmux send-keys timing and venv creation race-condition with atomic locks

Enhancements:

- Revamp main script to use a four-bucket CLI parsing architecture
- Refactor project isolation and slot management for multi-instance support
- Implement improved clean, info, and profile menus with detailed path descriptions
- Centralize library modules for Docker, profiles, project, config, and commands

Build:

- Clean dist directory on each build and maintain backward-compatibility symlink
- Enable BuildKit by default and extend build context to produce installer and archives

Documentation:

- Overhaul README.md with new features, usage examples, installation instructions, and detailed command reference
- Add CHANGELOG, CLAUDE.md, tooling.md generator, and extensive documentation for tasks, agent flows, and project structure

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: v2.0.0: macOS fixes and improved build system
