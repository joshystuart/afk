---
source: RchGrav/claudebox
kind: issue
number: 50
state: open
url: https://github.com/RchGrav/claudebox/issues/50
author: cowwoc
comments: 0
created_at: 2025-08-18T21:43:09Z
updated_at: 2025-08-18T21:43:22Z
---

# Expose logs to 3rd-party tools

It would be nice to be able to use programs like https://github.com/daaain/claude-code-log to monitor Claude Code&#39;s logs, but doing so is not straight-forward since the files are located inside the container.

Perhaps you could expose the log files as a real-only mount point? Or maybe it makes sense to run https://github.com/daaain/claude-code-log inside the container?

## AFK planning summary

- **Category**: Host parity (timezone, env files, logs to host)
- **Theme key**: `host_environment`
- **Short description**: Expose logs to 3rd-party tools — Pass host-like timezone, env files, or expose logs outside the container.
