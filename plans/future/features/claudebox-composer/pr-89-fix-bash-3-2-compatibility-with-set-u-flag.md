---
source: RchGrav/claudebox
kind: pull_request
number: 89
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/89
author: TonyHernandezAtMS
head: main
base: main
created_at: 2025-11-16T21:16:01Z
updated_at: 2025-11-16T21:47:32Z
---

# fix: Bash 3.2 compatibility with set -u flag

## Description

Fixes &#34;unbound variable&#34; errors on macOS when running ClaudeBox with default Bash 3.2.

Fixes #71

## Problem

ClaudeBox fails on macOS with errors like:

```
.claudebox/source/lib/cli.sh: line 22: all_args[@]: unbound variable
.claudebox/source/lib/cli.sh: line 52: host_flags[@]: unbound variable
```

This occurs because:

1. macOS ships with Bash 3.2 (from 2006) by default
2. ClaudeBox uses `set -u` flag (treats unset variables as errors)
3. Bash 3.2 has limitations with empty array handling

Current workaround is `brew install bash`, but this shouldn&#39;t be required.

## Root Cause

When `set -u` is enabled and arrays are empty, Bash 3.2 treats `${array[@]}` as an unbound variable error. This affects:

- Command-line argument parsing (`lib/cli.sh`)
- Array iteration in multiple modules
- Array exports and expansions

## When This Broke

This issue was introduced in commit [1e621cc](https://github.com/RchGrav/claudebox/commit/1e621cc) (July 12, 2025) during the &#34;CLI architecture overhaul&#34; which:

1. Introduced `set -euo pipefail` flags to the main script
2. Created new CLI parsing with array-based argument buckets
3. Used array patterns incompatible with Bash 3.2 + `set -u`

Issue #71 was reported 2 months later (September 9, 2025) when macOS users started encountering the errors.

## Solution

Applied Bash 3.2 + `set -u` compatible patterns throughout the codebase:

### Safe Array Expansion

```bash
# Before (breaks in Bash 3.2 with set -u)
&#34;${array[@]}&#34;

# After (Bash 3.2 compatible)
&#34;${array[@]+&#34;${array[@]}&#34;}&#34;
```

### Safe Array Iteration

```bash
# Before (breaks on empty arrays)
for item in &#34;${array[@]}&#34;; do
    process &#34;$item&#34;
done

# After (guards against empty arrays)
if [ ${#array[@]} -gt 0 ]; then
    for item in &#34;${array[@]+&#34;${array[@]}&#34;}&#34;; do
        process &#34;$item&#34;
    done
fi
```

### Safe Parameter Expansion in Traps

```bash
# Before
if [[ -n &#34;$var&#34; ]] &amp;&amp; [[ -f &#34;$var&#34; ]]; then

# After
if [[ -n &#34;${var:-}&#34; ]] &amp;&amp; [[ -f &#34;$var&#34; ]]; then
```

## Files Changed

- `lib/cli.sh` - Fixed argument parsing arrays
- `lib/commands.core.sh` - Safe array expansions
- `lib/commands.profile.sh` - Guards for empty profile arrays
- `lib/config.sh` - Replaced `readarray` (Bash 4+) with `while read` loops
- `lib/docker.sh` - Safe cleanup trap array handling
- `main.sh` - Temp files for awk instead of complex string substitutions
- `build/docker-entrypoint` - Removed problematic `local` in subshells

## Testing

Tested on:

- ✅ macOS 14.6 (Bash 3.2.57) - Installation and basic usage work
- ✅ Linux (Bash 4+) - No regressions, all features work

Verified fixes:

- ✅ `./claudebox.run` installs without &#34;unbound variable&#34; errors
- ✅ `claudebox add python` works
- ✅ `claudebox shell` works
- ✅ Array handling safe across all modules

## Impact

- **Compatibility**: macOS (Bash 3.2) and Linux (Bash 4+)
- **Breaking changes**: None
- **Performance**: No impact
- **Users affected**: All macOS users (M1, M2, M3, M4)

## Comparison with PR #77

This PR takes a similar approach to #77 but focuses on:

- Comprehensive fixes across all modules (7 files)
- Consistent use of safe array expansion patterns
- Bash 3.2 compatible alternatives (no `readarray`)
- Clear documentation of each pattern

## Related Issues

- #71 - Multiple users reporting this on M1/M4 Macs
- #77 - Alternative fix (still open)

## Summary by Sourcery

Enable Bash 3.2 compatibility with set -u by guarding empty array expansions, replacing Bash-4+ features, and refactoring array and Dockerfile handling across all scripts

Bug Fixes:

- Prevent unbound variable errors on macOS Bash 3.2 by guarding array expansions and iterations under set -u

Enhancements:

- Adopt &#34;${array[@]+\&#34;${array[@]}\&#34;}&#34; pattern and length checks to safely iterate and export arrays
- Replace readarray usage with POSIX-compatible while-read loops for array population
- Refactor Dockerfile templating to use temporary files and safe awk loops instead of multiline -v expansions

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: fix: Bash 3.2 compatibility with set -u flag
