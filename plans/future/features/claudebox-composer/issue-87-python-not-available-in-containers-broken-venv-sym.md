---
source: RchGrav/claudebox
kind: issue
number: 87
state: open
url: https://github.com/RchGrav/claudebox/issues/87
author: TonyHernandezAtMS
comments: 1
created_at: 2025-11-16T20:39:05Z
updated_at: 2025-11-16T20:50:40Z
---

# Python not available in containers - broken venv symlinks to uv-managed installations

## Problem

Python is not available inside ClaudeBox containers when using `python`, `ml`, or `datascience` profiles. The `python3` command returns `command not found` even after successful venv creation.

## Root Cause

When `uv` creates a virtual environment with `--python-preference managed`, it downloads Python to `~/.local/share/uv/python/`. The venv contains symlinks pointing to this location:

```bash
~/.claudebox/.venv/bin/python -&gt; /home/claude/.local/share/uv/python/cpython-3.14.0-linux-aarch64-gnu/bin/python3.14
```

However, `~/.local/share/` is **not mounted** from the host, so the Python installation is ephemeral and lost when the container exits, leaving broken symlinks.

## When This Was Introduced

This bug was introduced in commit [`57fa079`](https://github.com/RchGrav/claudebox/commit/57fa079) (July 17, 2025) which moved Python installation from Docker build-time to runtime with the &#34;shared venv system&#34;.

**Before (worked):** Python installed during image build  
**After (broken):** Python downloaded at runtime to unmounted directory

## Reproduction Steps

1. Clean install ClaudeBox and create a new project:

```bash
cd /path/to/project
claudebox add python
claudebox create  # First run - Python downloads and works
```

2. Restart the container (or run claudebox again):

```bash
claudebox shell
which python3      # Returns nothing or shows broken symlink
python3 --version  # command not found
```

3. Check the broken symlink on host:

```bash
ls -la ~/.claudebox/projects/*/6111fd25/.venv/bin/python
# Points to: /home/claude/.local/share/uv/python/.../python3.14 (doesn&#39;t exist)

ls ~/.claudebox/projects/*/6111fd25/.local/share/uv/python/
# ls: cannot access: No such file or directory
```

## Expected Behavior

Python should persist across container restarts. The `python3` command should work in all subsequent container runs.

## Actual Behavior

- **First run:** Python downloads successfully (100+ packages install)
- **Subsequent runs:** Python missing, broken symlinks

## Environment

- ClaudeBox version: v2.0.0+
- OS: macOS &amp; Linux (affects all platforms)
- Profiles affected: `python`, `ml`, `datascience`

## Workaround

Running `claudebox clean --project` forces a fresh Python download, but it breaks again on next restart.

## Additional Context

The venv directory **is** mounted but the Python installation **is not**:

- ✅ `~/.claudebox/.venv/` → mounted, persists
- ❌ `~/.local/share/uv/python/` → not mounted, ephemeral

Multiple subsequent commits tried to fix Python issues but missed this root cause:

- `4fd05a8` - &#34;Fix multiple issues: shell auth, Python/uv PATH...&#34;
- `b2aedd9` - &#34;Fix multiple issues with Python/uv, tmux activation...&#34;
- `bcf4ee7` - &#34;Add UV_PYTHON_MANAGED=1 environment variable&#34;

## Solution

Mount `PROJECT_SLOT_DIR/.local/share` to persist uv-managed Python installations across container restarts.

## AFK planning summary

- **Category**: Python & uv persistence (.local/share, venv symlinks)
- **Theme key**: `python_uv_persistence`
- **Short description**: Python not available in containers - broken venv symlinks to uv-managed installations — uv-managed Python lives under unmounted paths so venv symlinks break after container restart.
