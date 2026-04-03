---
source: RchGrav/claudebox
kind: pull_request
number: 3
state: closed
draft: false
merged: false
url: https://github.com/RchGrav/claudebox/pull/3
author: whit3rabbit
head: claude-code-improvements
base: main
created_at: 2025-06-13T18:00:13Z
updated_at: 2025-06-13T18:03:00Z
---

# I&#39;ve made some significant improvements to `claudebox` to enhance its…

… security and usability, and to make it easier to manage.

Here&#39;s a summary of the key changes:

1.  **Enhanced Permissions:**
    - I&#39;ve introduced a confirmation step for actions that could have a big impact.
    - For changes to images or projects, I&#39;ll ask for a simple confirmation.
    - For operations that require elevated privileges on your system or could be highly destructive, I&#39;ll ask for a specific keyword confirmation.
    - I&#39;ve removed options that previously allowed bypassing these confirmations; you&#39;ll now need to explicitly approve these actions.
    - For automated scenarios, there are new environment variables (`CLAUDEBOX_AUTO_APPROVE_TIER1` and `CLAUDEBOX_AUTO_APPROVE_TIER2_DANGEROUS`) that can be set, but I&#39;ll still provide warnings.

2.  **Server Management:**
    - I&#39;ve added new commands to help you manage servers: `add`, `list`, `get`, and `remove`.
    - These can be applied at the project level (using `.mcp.json`) or for your user account (using `~/.config/claude/mcp-servers-user.json`).
    - I&#39;ll prioritize project settings over user settings, and user settings over the default settings.
    - I&#39;ll also manage the default `claudebox_thinking` and `claudebox_memory` servers in `.mcp.json` without interfering with any servers you&#39;ve added.

3.  **Security Improvements:**
    - I&#39;ve added checks to sanitize package names when you ask me to install something, to prevent potential security issues.
    - I&#39;ve updated the help text and `README.md` with detailed &#34;Security Considerations,&#34; offering guidance on using flags and managing servers safely.

4.  **Development Environment:**
    - I&#39;ve included a setup for a VS Code Development Container.
    - This environment comes with useful development tools pre-installed (jq, shellcheck, shfmt, iptables).
    - It also supports Docker-in-Docker, which is helpful for testing `claudebox`.
    - To enhance security during development, I&#39;ve included a script (`init-firewall.sh`) that restricts the development container&#39;s network access to only approved domains.

5.  **Documentation:**
    - I&#39;ve thoroughly updated the `README.md` file to cover all these new features, including detailed guides on the permission system, server management, security guidelines, and how to use the development container.

I believe these changes make `claudebox` more secure, easier for you to use, and simpler to work with.

## Summary by Sourcery

Add interactive permission confirmations, robust MCP server management commands, security hardening measures, and a VS Code development container setup.

New Features:

- Add interactive two-tier confirmation prompts for privileged and potentially destructive operations, with optional environment variables for automated approval
- Introduce `claudebox mcp` commands to add, list, get, and remove MCP server configurations across project and user scopes, honoring project &gt; user &gt; default precedence
- Provide a VS Code dev container setup with pre-installed tools, Docker-in-Docker support, and a restrictive network firewall for secure development

Enhancements:

- Sanitize package names during `claudebox install` to prevent command injection
- Automatically manage default `claudebox_thinking` and `claudebox_memory` servers in the project’s `.mcp.json` without overwriting user entries
- Update help text and README with detailed guides on permissions, server management, and security considerations

Build:

- Add `.devcontainer/Dockerfile` and `init-firewall.sh` to configure a consistent VS Code development container with necessary tooling

Documentation:

- Expand README.md with new sections on permission tiers, MCP server management, security options, and development container usage

## AFK planning summary

- **Category**: Dockerfile / profile templating & image rebuilds
- **Theme key**: `docker_profile_build`
- **Short description**: I&#39;ve made some significant improvements to `claudebox` to enhance its…
