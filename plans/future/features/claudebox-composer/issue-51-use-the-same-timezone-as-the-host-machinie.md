---
source: RchGrav/claudebox
kind: issue
number: 51
state: open
url: https://github.com/RchGrav/claudebox/issues/51
author: cowwoc
comments: 0
created_at: 2025-08-18T22:46:53Z
updated_at: 2025-08-18T22:46:53Z
---

# Use the same timezone as the host machinie

When I run claudebox I get a message like:

&gt; Claude usage limit reached. Your limit will reset at 11pm (UTC).

But I&#39;m pretty sure that when I ran from the host the time was represented relative to the local timezone.

I believe running `docker run -v /etc/localtime:/etc/localtime:ro -v /etc/timezone:/etc/timezone:ro` will fix the problem.

## AFK planning summary

- **Category**: Host parity (timezone, env files, logs to host)
- **Theme key**: `host_environment`
- **Short description**: Use the same timezone as the host machinie — Pass host-like timezone, env files, or expose logs outside the container.
