---
source: RchGrav/claudebox
kind: pull_request
number: 55
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/55
author: fletchgqc
head: fix/issue-45-java-profile-awk-error
base: main
created_at: 2025-08-27T10:41:58Z
updated_at: 2025-08-27T11:36:18Z
---

# Fix issue #45: Resolve awk newline error when adding Java profile

## Summary

This PR fixes issue #45 where users encountered an `awk: newline in string` error when adding the Java profile to ClaudeBox.

## Problem

The awk command used for Dockerfile placeholder substitution was failing when processing multi-line content in the `profile_installations` variable. The error manifested as:

```
awk: newline in string
RUN apt-get update ... at source line 1
Failed to apply Dockerfile substitutions
```

## Solution

- Replaced awk-based substitution with a pure bash line-by-line processing approach
- Fixed a syntax error where the `||` operator was missing between two `grep` conditions in the guard clause
- The new implementation reliably handles multi-line content without the awk limitations

## Testing

The fix has been tested with the Java profile and successfully builds without errors.

Fixes #45

🤖 Generated with Claude Code

## Summary by Sourcery

Replace awk-based Dockerfile placeholder substitution with a bash line-by-line loop to reliably handle multi-line PROFILE_INSTALLATIONS and avoid newline-in-string errors

Bug Fixes:

- Resolve newline-in-string error when injecting multi-line PROFILE_INSTALLATIONS into Dockerfile by switching from awk to bash processing
- Fix missing &#39;||&#39; operator in the placeholder guard clause to properly detect unreplaced placeholders

Enhancements:

- Improve Dockerfile template substitution logic for better reliability

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: Fix issue #45: Resolve awk newline error when adding Java profile
