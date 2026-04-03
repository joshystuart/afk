---
source: RchGrav/claudebox
kind: issue
number: 62
state: open
url: https://github.com/RchGrav/claudebox/issues/62
author: sinabahram
comments: 0
created_at: 2025-08-30T18:40:32Z
updated_at: 2025-08-30T18:40:32Z
---

# WSL2 Root User Support - Docker Build Fails with UID 0

# WSL2 Root User Support - Docker Build Fails with UID 0

## Problem Description

When running ClaudeBox in WSL2 as the root user (UID 0), the Docker build process fails with the following error:

```
useradd: UID 0 is not unique
ERROR: process &#34;/bin/sh -c groupadd -g $GROUP_ID $USERNAME || true &amp;&amp; useradd -m -u $USER_ID -g $GROUP_ID -s /bin/bash $USERNAME&#34; did not complete successfully: exit code: 4
```

This occurs because the Dockerfile attempts to create a new user with UID 0 and GID 0, which conflicts with the existing root user.

## Environment

- **Platform**: WSL2 (Windows Subsystem for Linux 2)
- **OS**: Linux 6.6.87.2-microsoft-standard-WSL2
- **User**: Running as root (uid=0, gid=0)
- **ClaudeBox Version**: 2.0.0

## Root Cause

The issue stems from two main problems:

1. **Dockerfile**: Unconditionally attempts to create a user with the host&#39;s UID/GID, which fails when UID=0 since root already exists
2. **Entrypoint Script**: Uses `runuser` commands that fail when no &#39;claude&#39; user exists, and uses `local` declarations outside of functions

## Solution

The fix involves modifying both the Dockerfile and docker-entrypoint script to handle the special case when running as root:

### Dockerfile Changes

1. **Conditional User Creation**: Detect when USER_ID=0 and create a symlink from `/home/claude` to `/root` instead of creating a new user
2. **Helper Script**: Create a `/tmp/run_as_user.sh` script that conditionally executes commands directly when root or via `su` otherwise
3. **Consistent Command Execution**: Use the helper script for all user-context commands

### Entrypoint Script Changes

1. **Root Detection**: Add IS_ROOT variable and run_as_user() helper function
2. **Fix Shell Script Issues**: Remove `local` declarations outside functions
3. **Handle exec Calls**: Since `exec` can&#39;t use shell functions, expand to explicit if/else blocks for root vs non-root cases
4. **Replace runuser Commands**: Use the helper function or explicit conditionals

## Testing

After applying the fix:

```bash
# Clean rebuild
./main.sh clean --containers
./main.sh clean --image

# Create slot and test
./main.sh create
./main.sh slot 1 -- echo &#34;Testing WSL2 root fix&#34;
./main.sh slot 1 shell -c &#34;id &amp;&amp; whoami&#34;
```

The container now successfully builds and runs when the host user is root in WSL2.

## Files Modified

- `build/Dockerfile` - Handle UID 0 case in user creation
- `build/docker-entrypoint` - Support running as root user

## Implementation Details

A detailed implementation with code diffs is available in this gist: https://gist.github.com/sinabahram/15403652e92bea5e7662272f4cbcf46a

## Important Disclaimer

**This fix was developed through AI-assisted coding (&#34;vibe coded&#34;) and appears to work in testing, but has NOT undergone human code review.** While the container builds successfully and basic functionality works when running as root in WSL2, this solution should be:

1. Reviewed by maintainers familiar with the ClaudeBox architecture
2. Tested across different configurations and edge cases
3. Validated for security implications of running as root
4. Checked for any unintended side effects on non-root users

Please treat this as a proof-of-concept that demonstrates a working approach rather than production-ready code.

## Impact

This fix enables ClaudeBox to work in WSL2 environments where users run as root, which is common in certain WSL2 configurations and development workflows.

## AFK planning summary

- **Category**: WSL / root UID / Docker user & group edge cases
- **Theme key**: `platform_wsl_root`
- **Short description**: WSL2 Root User Support - Docker Build Fails with UID 0 — Host UID/GID edge cases: root on WSL2, macOS group IDs, `chown` failures.
