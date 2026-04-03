---
source: RchGrav/claudebox
kind: pull_request
number: 88
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/88
author: TonyHernandezAtMS
head: fix/uv-python-persistence
base: main
created_at: 2025-11-16T20:47:46Z
updated_at: 2025-11-16T20:49:17Z
---

# fix: mount .local/share to persist uv-managed Python installations

## Description

Fixes broken Python venv symlinks after container restarts by mounting `~/.local/share/` to persist uv-managed Python installations.

Fixes #87

## Problem

When `uv` creates a venv with `--python-preference managed`, it downloads Python to `~/.local/share/uv/python/`. The venv contains symlinks pointing to this location, but since `~/.local/share/` was not mounted, the Python installation was lost on container exit, leaving broken symlinks.

## Solution

Added mount for `PROJECT_SLOT_DIR/.local/share` in `lib/docker.sh` to persist uv-downloaded Python installations across container restarts.

```diff
+    # Mount .local/share for uv-managed Python installations
+    # uv downloads Python to ~/.local/share/uv/python/ which must persist across containers
+    mkdir -p &#34;$PROJECT_SLOT_DIR/.local/share&#34;
+    docker_args+=(-v &#34;$PROJECT_SLOT_DIR/.local/share&#34;:/home/$DOCKER_USER/.local/share)
```

## Testing

Tested on macOS with ml-tutorial project:

1. ✅ Clean project, add `python ml` profiles
2. ✅ First run: Python 3.14 downloads successfully (111 packages including torch, transformers, scikit-learn, pandas, numpy)
3. ✅ Verified Python installation persists on host: `~/.claudebox/projects/.../6111fd25/.local/share/uv/python/cpython-3.14.0-linux-aarch64-gnu/`
4. ✅ Venv symlinks are valid and point to persisted Python
5. ✅ Subsequent container starts: Python works correctly

## Impact

- Affects: `python`, `ml`, and `datascience` profiles
- Compatibility: macOS and Linux
- Breaking changes: None
- Performance: Negligible (adds one directory mount)

## Related Issues

This bug was introduced in commit [`57fa079`](https://github.com/RchGrav/claudebox/commit/57fa079) when Python installation was moved from build-time to runtime.

Subsequent commits attempted to fix Python issues but missed the root cause:

- `4fd05a8` - &#34;Fix multiple issues: shell auth, Python/uv PATH...&#34;
- `b2aedd9` - &#34;Fix multiple issues with Python/uv, tmux activation...&#34;
- `bcf4ee7` - &#34;Add UV_PYTHON_MANAGED=1 environment variable&#34;

## AFK planning summary

- **Category**: Python & uv persistence (.local/share, venv symlinks)
- **Theme key**: `python_uv_persistence`
- **Short description**: fix: mount .local/share to persist uv-managed Python installations
