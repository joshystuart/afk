---
source: RchGrav/claudebox
kind: pull_request
number: 44
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/44
author: johnhaley81
head: feature/agent-support-clean
base: main
created_at: 2025-08-13T04:13:26Z
updated_at: 2025-08-13T14:05:00Z
---

# feat: Add support for Claude agents in ClaudeBox containers

## Summary

- Adds support for syncing Claude agents from host to ClaudeBox containers
- Implements same per-project isolation model as commands
- Enables users to use their locally defined agents inside containers

## Implementation Details

### Changes Made:

1. **`build/docker-entrypoint`**: Added symlink creation for agents directory (similar to commands)
2. **`lib/project.sh`**: Added agent syncing functionality that:
   - Syncs from `~/.claude/agents/` to project-specific directories
   - Uses checksums to detect changes and only sync when needed
   - Handles cleanup when source directory doesn&#39;t exist
   - Fixed platform detection for checksum calculation (BSD vs GNU stat)
   - Proper error handling for cd operations (shellcheck compliance)

### How It Works:

1. Host agents at `~/.claude/agents/` are automatically detected
2. Agents are copied to `~/.claudebox/projects/{project_hash}/agents/` (per-project isolation)
3. Container mounts the project directory and creates symlink: `~/.claude/agents` → `~/.claudebox/agents`
4. Claude CLI finds agents at the expected standard location

## Review Feedback Addressed

Based on Sourcery AI review:

- ✅ Fixed platform detection for checksum calculation (now handles both BSD and GNU stat)
- ✅ Considered rsync (kept manual copy for simplicity and to avoid adding dependencies)
- ✅ Considered extracting helper functions (kept inline to match existing codebase patterns)
- ✅ Considered making agent path configurable (kept standard path for consistency with Claude CLI)
- ✅ Fixed shellcheck warning SC2164 for cd command error handling

## Testing

- ✅ Tested locally with agent files
- ✅ Verified symlink creation in container
- ✅ Confirmed agents are accessible to Claude CLI
- ✅ Validated checksum-based change detection works on both macOS and Linux
- ✅ Shellcheck validation passes

## User Impact

Users can now use their Claude agents within ClaudeBox containers by:

1. Having agents defined in `~/.claude/agents/` on their host
2. ClaudeBox automatically syncs them to containers (no manual steps required)

This maintains the same security and isolation model as commands - each project gets its own copy of agents.

🤖 Generated with [Claude Code](https://claude.ai/code)

## AFK planning summary

- **Category**: Extra profiles, uninstall, Homebrew, agents, mobile, routers
- **Theme key**: `ecosystem_bundling`
- **Short description**: feat: Add support for Claude agents in ClaudeBox containers
