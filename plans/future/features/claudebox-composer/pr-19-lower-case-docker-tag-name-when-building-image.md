---
source: RchGrav/claudebox
kind: pull_request
number: 19
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/19
author: Eduard-Voiculescu
head: main
base: main-bak
created_at: 2025-06-20T20:55:55Z
updated_at: 2025-06-23T05:39:56Z
---

# Lower case docker tag name when building image

```bash
ERROR: invalid tag &#34;claudebox-Users_ed_tmp_claudebox&#34;: repository name must be lowercase
```

On MacOS systems the default path for any user is `/Users/...`. This causes issues when running the docker build. Lower casing it when building it and cleaning.

PS: Incredible project you have got going!!

## Summary by Sourcery

Lowercase the Docker image tags in build and clean commands to avoid invalid uppercase characters from macOS user paths.

Bug Fixes:

- Fix Docker build error caused by uppercase characters in default macOS user directory paths.

Enhancements:

- Normalize generated Docker tag names to lowercase during image build and cleanup.

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: Lower case docker tag name when building image
