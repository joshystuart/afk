---
source: RchGrav/claudebox
kind: issue
number: 59
state: open
url: https://github.com/RchGrav/claudebox/issues/59
author: fletchgqc
comments: 5
created_at: 2025-08-28T11:21:43Z
updated_at: 2025-10-07T14:16:58Z
---

# Flexible environment variables

I want to authenticate to GH with a fine-grained access token, ideally this is done by setting the env var GH_TOKEN. Is there any concept of how to do that? I saw that .env is mounted automatically, I would like to automatically source it on login or something similar, how can I do that?

## AFK planning summary

- **Category**: Host parity (timezone, env files, logs to host)
- **Theme key**: `host_environment`
- **Short description**: Flexible environment variables — Pass host-like timezone, env files, or expose logs outside the container.
