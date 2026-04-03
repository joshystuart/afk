---
source: RchGrav/claudebox
kind: pull_request
number: 70
state: open
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/70
author: fletchgqc
head: env-file-support
base: main
created_at: 2025-09-09T15:11:56Z
updated_at: 2025-09-09T15:12:54Z
---

# feat: Pass environment variables from .env file to container

Add --env-file option to docker run command when .env file exists in the project directory. This allows environment variables defined in .env to be automatically available inside the container.

The .env file was already being mounted, but variables weren&#39;t being loaded. This simple change adds the --env-file flag to make Docker parse and load all variables from the file.

## Summary by Sourcery

New Features:

- Pass environment variables from .env into the Docker container using the --env-file flag

## AFK planning summary

- **Category**: Host parity (timezone, env files, logs to host)
- **Theme key**: `host_environment`
- **Short description**: feat: Pass environment variables from .env file to container
