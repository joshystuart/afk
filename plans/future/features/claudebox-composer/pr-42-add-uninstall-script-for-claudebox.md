---
source: RchGrav/claudebox
kind: pull_request
number: 42
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/42
author: swhsiang
head: swh/uninstall
base: main
created_at: 2025-08-12T04:45:18Z
updated_at: 2025-08-18T07:19:09Z
---

# Add uninstall script for ClaudeBox

## Summary

- Adds a comprehensive uninstall script for ClaudeBox
- Provides clean removal of all ClaudeBox components
- Includes user-friendly colored output and clear feedback

## Details

This PR introduces `uninstall.sh`, a complete uninstallation script that:

### Features

- **Symlink removal**: Removes the claudebox command from `~/.local/bin/`
- **Directory cleanup**: Removes the main installation directory `~/.claudebox`
- **Project cleanup**: Finds and removes all project-specific directories (`.claudebox-*`)
- **Docker cleanup**: Removes all ClaudeBox-related Docker containers and images
- **PATH guidance**: Provides instructions for cleaning up PATH configuration if needed
- **Optional installer removal**: Offers to remove the installer file if present

### User Experience

- Colored output for better readability (green ✓, yellow ⚠, red ✗)
- Safe handling of already-removed components
- Clear summary of what was removed
- No errors if components are already missing

### Safety

- Uses `set -e` for error handling
- Safely checks for existence before removal
- Handles Docker not being installed/running gracefully
- Confirms before removing the installer file

## Test Plan

- [x] Run on a system with full ClaudeBox installation

🤖 Generated with [Claude Code](https://claude.ai/code)

## Summary by Sourcery

Introduce a comprehensive uninstall.sh script to fully remove ClaudeBox components, including symlink, installation and project-specific directories, Docker containers and images, and optionally the installer file, with user-friendly colored output and safety checks

New Features:

- Add uninstall.sh script to remove ClaudeBox symlink, installation directory, project-specific folders, and related Docker resources
- Prompt optionally to delete the installer file if present

Enhancements:

- Display colored status messages and icons for improved readability
- Perform existence checks and handle missing components or Docker gracefully

## AFK planning summary

- **Category**: Extra profiles, uninstall, Homebrew, agents, mobile, routers
- **Theme key**: `ecosystem_bundling`
- **Short description**: Add uninstall script for ClaudeBox
