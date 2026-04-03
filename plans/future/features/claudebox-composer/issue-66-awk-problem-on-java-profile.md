---
source: RchGrav/claudebox
kind: issue
number: 66
state: open
url: https://github.com/RchGrav/claudebox/issues/66
author: fletchgqc
comments: 1
created_at: 2025-09-09T10:17:29Z
updated_at: 2025-09-09T15:24:20Z
---

# awk problem on java profile

Following problem on Java profile, using Mac:

```
claudebox add java
Profile: ...
Adding profiles: java
All active profiles: java

The Docker image will be rebuilt with new profiles on next run.
```

```
claudebox --dangerously-skip-permissions
Detected changes in Docker build files, rebuilding...
awk: newline in string
RUN apt-get update ... at source line 1
awk: newline in string LABEL claudebox.prof... at source line 1
awk: newline in string LABEL claudebox.prof... at source line 1
Failed to apply Dockerfile substitutions
```

Here&#39;s the PR which fixes it, please review/merge: https://github.com/RchGrav/claudebox/pull/55

(I had previously commented this on closed issue https://github.com/RchGrav/claudebox/issues/45#issuecomment-3227603372)

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: awk problem on java profile — Dockerfile generation, profile fragments, or `awk` substitution breaks multi-profile or devops installs.
