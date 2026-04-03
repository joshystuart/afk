---
source: RchGrav/claudebox
kind: issue
number: 5
state: closed
url: https://github.com/RchGrav/claudebox/issues/5
author: crowne
comments: 1
created_at: 2025-06-16T17:51:21Z
updated_at: 2025-06-17T00:31:34Z
---

# ERROR: failed to solve: dockerfile parse error on line 114: unknown instruction: set (did you mean user?)

I got this error:

./claudebox
Created project folder: /home/crowne/.claudebox/mnt-c-github-claudebox
Created global MCP config
Created Claude agent command template

██████╗██╗ █████╗ ██╗ ██╗██████╗ ███████╗
██╔════╝██║ ██╔══██╗██║ ██║██╔══██╗██╔════╝
██║ ██║ ███████║██║ ██║██║ ██║█████╗
██║ ██║ ██╔══██║██║ ██║██║ ██║██╔══╝
╚██████╗███████╗██║ ██║╚██████╔╝██████╔╝███████╗
╚═════╝╚══════╝╚═╝ ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝

██████╗ ██████╗ ██╗ ██╗ ------ ┌──────────────┐
██╔══██╗██╔═══██╗╚██╗██╔╝ ------ │ The Ultimate │
██████╔╝██║ ██║ ╚███╔╝ ------ │ Claude Code │
██╔══██╗██║ ██║ ██╔██╗ ------ │ Docker Dev │
██████╔╝╚██████╔╝██╔╝ ██╗ ------ │ Environment │
╚═════╝ ╚═════╝ ╚═╝ ╚═╝ ------ └──────────────┘

Running docker build...
[+] Building 0.1s (1/1) FINISHED docker:default
=&gt; [internal] load build definition from claudebox-dockerfile.IvxHgd 0.0s
=&gt; =&gt; transferring dockerfile: 11.71kB 0.0s
claudebox-dockerfile.IvxHgd:114

---

112 | RUN cat &gt; ~/init-firewall.sh &lt;&lt; EOF
113 | #!/bin/bash
114 | &gt;&gt;&gt; set -euo pipefail
115 | if [ &#34;\${DISABLE_FIREWALL:-false}&#34; = &#34;true&#34; ]; then
116 | echo &#34;Firewall disabled, skipping setup&#34;

---

ERROR: failed to solve: dockerfile parse error on line 114: unknown instruction: set (did you mean user?)

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: ERROR: failed to solve: dockerfile parse error on line 114: unknown instruction: set (did you mean user?) — Dockerfile generation, profile fragments, or `awk` substitution breaks multi-profile or devops installs.
