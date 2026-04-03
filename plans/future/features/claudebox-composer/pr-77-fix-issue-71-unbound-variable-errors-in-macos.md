---
source: RchGrav/claudebox
kind: pull_request
number: 77
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/77
author: amegli
head: 71-macos-unbound-variable-error
base: main
created_at: 2025-09-21T18:21:24Z
updated_at: 2025-09-24T15:06:07Z
---

# Fix: Issue 71, unbound variable errors in MacOS

Installation on MacOS produces a number of &#34;unbound variable&#34; errors from &#34;cli.sh&#34; - https://github.com/RchGrav/claudebox/issues/71. These changes apply default expansions for a few arrays in that file. An existing failing test was also corrected by adjusting the expected profile name count.

## Update

This PR has grown as fixes uncovered additional issues. There are now a number of updated bash files, almost all centered around &#34;unbound variable&#34; errors, and a new &#34;test_install.sh&#34; file to try and ensure the build/install process works in multiple bash versions (it did recreate some of the &#34;unbound variable&#34; errors). So far build, install, and basic usage in MacOS seems to work.

## Summary by Sourcery

Prevent unbound variable errors on MacOS by adding default expansions for arrays in cli.sh and update the profile name count in the compatibility test.

Bug Fixes:

- Add default expansions to array references in cli.sh to avoid unbound variable errors
- Correct the expected profile count in the get_all_profile_names test

Tests:

- Adjust get_all_profile_names test to expect 21 profiles instead of 20

## AFK planning summary

- **Category**: Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)
- **Theme key**: `shell_bash_compat`
- **Short description**: Fix: Issue 71, unbound variable errors in MacOS
