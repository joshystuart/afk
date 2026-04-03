---
source: RchGrav/claudebox
kind: pull_request
number: 78
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/78
author: manarone
head: fix-macos-unbound-variables
base: main
created_at: 2025-09-24T21:57:11Z
updated_at: 2025-10-31T16:14:04Z
---

# Fix unbound variable errors on macOS

## Problem

ClaudeBox fails to run on macOS with multiple &#34;unbound variable&#34; errors when bash scripts use `set -u`. This occurs because empty arrays expanded with `&#34;${array[@]}&#34;` syntax are treated as unbound variables by bash.

## Solution

Added the `:-` default operator to all array expansions throughout the codebase. This provides an empty default value when arrays are uninitialized, preventing bash from treating them as unbound variables.

## Changes Made

Modified 10 files to add the `:-` operator to array expansions:

- `main.sh` - Fixed CLI argument arrays
- `lib/cli.sh` - Fixed argument parsing arrays
- `lib/commands.clean.sh` - Fixed matches array
- `lib/commands.core.sh` - Fixed shell flags array
- `lib/commands.profile.sh` - Fixed profile management arrays
- `lib/commands.system.sh` - Fixed window/command arrays
- `lib/config.sh` - Fixed configuration item arrays
- `lib/docker.sh` - Fixed container argument arrays
- `lib/tools-report.sh` - Fixed reporting arrays
- `tooling/profiles/rust.sh` - Fixed Cargo tools array

## Testing

- Tested all ClaudeBox commands on macOS after applying fixes
- All commands now run without unbound variable errors
- Verified backward compatibility - changes work on both Linux and macOS

## Technical Details

Changed all instances of:

```bash
&#34;${array[@]}&#34;
```

To:

```bash
&#34;${array[@]:-}&#34;
```

This is a syntax-only change that maintains full functionality while ensuring compatibility with bash&#39;s strict mode (`set -u`) on all platforms.

## Summary by Sourcery

Fix unbound variable errors on macOS by defaulting all empty array expansions with the `${array[@]:-}` operator to maintain compatibility with strict bash mode and preserve existing behavior on Linux.

Bug Fixes:

- Prevent unbound variable errors in bash scripts on macOS under `set -u`

Enhancements:

- Add `:-` default operator to all array expansions across the codebase for safe empty-array handling

Tests:

- Verify all ClaudeBox commands run without unbound variable errors on both macOS and Linux

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: Fix unbound variable errors on macOS
