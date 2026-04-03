---
source: RchGrav/claudebox
kind: issue
number: 4
state: closed
url: https://github.com/RchGrav/claudebox/issues/4
author: JoshuaRileyDev
comments: 1
created_at: 2025-06-15T12:04:00Z
updated_at: 2025-06-17T00:30:02Z
---

# ERROR: failed to solve: dockerfile parse error on line 69: unknown instruction: {

Got this following error:

./claudebox

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

[+] Building 0.1s (1/1) FINISHED docker:desktop-linux
=&gt; [internal] load build definition from claudebox-dockerfile.bzmUpS 0.0s
=&gt; =&gt; transferring dockerfile: 35.15kB 0.0s
claudebox-dockerfile.bzmUpS:69

---

67 | # Create package.json for thinking server
68 | RUN cat &gt; ~/mcp-servers/thinking/package.json &lt;&lt; &#39;PACKAGEEOF&#39;
69 | &gt;&gt;&gt; {
70 | &#34;name&#34;: &#34;@modelcontextprotocol/server-sequential-thinking&#34;,
71 | &#34;version&#34;: &#34;0.6.2&#34;,

---

ERROR: failed to solve: dockerfile parse error on line 69: unknown instruction: {
Docker image [############################## ] 100%

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: ERROR: failed to solve: dockerfile parse error on line 69: unknown instruction: { — Dockerfile generation, profile fragments, or `awk` substitution breaks multi-profile or devops installs.
