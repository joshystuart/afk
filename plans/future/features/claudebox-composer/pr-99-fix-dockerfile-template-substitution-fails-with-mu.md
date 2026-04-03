---
source: RchGrav/claudebox
kind: pull_request
number: 99
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/99
author: b00y0h
head: fix/profile-template-substitution
base: main
created_at: 2026-02-12T23:23:17Z
updated_at: 2026-02-12T23:46:35Z
---

# fix: Dockerfile template substitution fails with multi-line profile installations

## Summary

- Fix `awk -v` failing on multi-line `$profile_installations` values by switching to `ENVIRON` array, which correctly handles newlines and special characters
- Fix guard check syntax broken in 634a40d (missing `||` between grep commands)

## Root cause

`awk -v pi=&#34;$profile_installations&#34;` does not support literal newlines in variable assignments. When profile functions return multi-line RUN commands containing `&amp;&amp;`, the substitution fails with `awk: newline in string` errors, leaving `{{PROFILE_INSTALLATIONS}}` placeholders in the generated Dockerfile.

The `ENVIRON` array reads variables from the process environment, which has no issues with newlines or special characters like `&amp;`.

## Before (broken)

```
RUN apt-get update {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get install -y nginx {{PROFILE_INSTALLATIONS}}{{PROFILE_INSTALLATIONS}} apt-get clean
```

## After (fixed)

```
RUN apt-get update &amp;&amp; apt-get install -y nginx &amp;&amp; apt-get clean
```

## Test

```bash
profile_installations=&#34;# Python profile
RUN apt-get update &amp;&amp; apt-get install -y nginx &amp;&amp; apt-get clean&#34;

# Using ENVIRON (this PR)
final=$(PI=&#34;$profile_installations&#34; awk &#39;
/\{\{[[:space:]]*PROFILE_INSTALLATIONS[[:space:]]*\}\}/ { print ENVIRON[&#34;PI&#34;]; next }
{ print }
&#39; &lt;&lt;&lt;&#34;{{PROFILE_INSTALLATIONS}}&#34;)

echo &#34;$final&#34;
# Output: correct multi-line content with &amp;&amp; preserved
```

Fixes #91

## Summary by Sourcery

Fix Dockerfile template substitution to correctly handle multi-line profile installation blocks and restore the guard that detects unreplaced placeholders.

Bug Fixes:

- Resolve failure of Dockerfile template substitution when profile installations contain multi-line commands or special characters by switching awk variable injection to use environment variables.
- Fix the placeholder guard condition so it properly detects remaining PROFILE_INSTALLATIONS or LABELS placeholders in the generated Dockerfile.

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: fix: Dockerfile template substitution fails with multi-line profile installations
