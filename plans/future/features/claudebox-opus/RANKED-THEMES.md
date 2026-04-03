# ClaudeBox Community Demand Analysis — Feature Priorities for AFK

> **Source**: [RchGrav/claudebox](https://github.com/RchGrav/claudebox) — 55 issues + 48 pull requests (all states)
> **Purpose**: Identify what users want from a "Claude Code in Docker" product, ranked by community signal strength.
> **Per-item files**: See `issue-*.md` and `pr-*.md` in this directory.

---

## Ranked Themes by Frequency

| Rank | Count | Theme                                     | What users want                                                                                                                   | AFK relevance                                                                                                                                       |
| ---- | ----- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | 25    | **Shell / Bash compatibility**            | Scripts that work on macOS Bash 3.2, zsh, and Linux without `set -u` blowups, `declare -A` failures, or `local` outside functions | AFK uses Docker-managed containers — we avoid host shell scripts entirely, but our CLI and any host-side tooling must handle macOS/Linux gracefully |
| 2    | 21    | **Docker image / profile build pipeline** | Reliable Dockerfile generation with profile templating, multi-line substitution, and package source correctness                   | AFK controls the Docker image build; we need robust, extensible base images with installable tool profiles                                          |
| 3    | 8     | **MCP integration**                       | Discoverable MCP server setup, proper cleanup on exit, multi-config support, and no unbound variable traps                        | AFK already needs MCP — this confirms high demand for in-container MCP wiring with clean lifecycle                                                  |
| 4    | 7     | **Ecosystem tooling & packaging**         | Extra profiles (Flutter, Deno), agents support, uninstall scripts, Homebrew formula, mobile UI companions                         | Users want a batteries-included environment with easy install/uninstall and extensibility                                                           |
| 5    | 6     | **Docker user / group / UID mapping**     | Correct chown, UID/GID handling for macOS (GID 20), WSL2 root (UID 0), and Linux                                                  | AFK containers must map host user identity correctly across all platforms                                                                           |
| 6    | 5     | **API routing & auth flexibility**        | Custom `ANTHROPIC_BASE_URL`, 3rd-party model vendors, Claude Max subscription reuse, API key management                           | AFK should support configurable API endpoints and subscription/token persistence                                                                    |
| 7    | 4     | **Global Claude settings**                | Mount host `~/.claude` (settings, commands, skills) into containers instead of only project-scoped isolation                      | AFK needs a story for global vs project-scoped Claude config — skills especially should be shareable                                                |
| 8    | 4     | **Host environment parity**               | Match host timezone, pass `.env` variables, expose logs to external monitoring tools                                              | Container sessions should feel like the host: same TZ, same env vars, observable logs                                                               |
| 9    | 4     | **Python / uv persistence**               | Persist uv-managed Python installations across container restarts, fix broken venv symlinks                                       | Language toolchains must survive session restarts — persistent volume layout is critical                                                            |
| 10   | 3     | **Git integration**                       | Mount `.git` directory and host `.gitconfig` read-only so git commands and identity work in-container                             | AFK workspaces need full git access — commit hashes, branch info, user identity                                                                     |
| 11   | 3     | **SSH key handling**                      | SSH client binaries available, configurable key mounting, security documentation                                                  | AFK needs SSH story for git auth (deploy keys, agent forwarding) with clear security model                                                          |
| 12   | 3     | **Session / slot UX**                     | Clear docs on session lifecycle, "no slots found" bugs, first-run onboarding                                                      | AFK's session model must be intuitive — create, resume, list, destroy with clear status                                                             |
| 13   | 2     | **Stronger isolation / alt runtimes**     | VM-based isolation (BoxLite, Apple Containers) as alternative to Docker namespace isolation                                       | Future consideration: VM backends for high-security workloads                                                                                       |
| 14   | 2     | **Documentation & transparency**          | Explain what installers do, how profiles work, audit trail for security-conscious users                                           | AFK should be transparent about what runs in containers and how                                                                                     |
| 15   | 2     | **Java / JVM tooling**                    | Multiple JDK versions via SDKMan, configurable Java profiles                                                                      | Profile extensibility — users want to pick their language versions                                                                                  |
| 16   | 2     | **Project maintenance signals**           | Users noting project is abandoned, pointing to alternatives (agentbox)                                                            | Validates demand for an actively-maintained Claude-in-containers product (i.e., AFK)                                                                |
| 17   | 1     | **Permission UX**                         | Confusing duplicate permission bypass flags                                                                                       | AFK should have a single clear permission model                                                                                                     |
| 18   | 1     | **Terminal / tmux UX**                    | Pane content capture errors after hard exit                                                                                       | AFK's web terminal must handle disconnects gracefully                                                                                               |

---

## Theme → Items Detail

### 1. Shell / Bash compatibility (25 items)

Issues: #2, #13, #18, #20, #25, #26, #28, #31, #36, #65, #71, #90
PRs: #9, #11, #12, #16, #17, #33, #37, #77, #78, #89, #92, #97, #100

**Pattern**: macOS ships Bash 3.2 which lacks `declare -A`, `${var^^}`, and crashes on empty arrays with `set -u`. Every shell script must be POSIX-safe or require Bash 4+.

### 2. Docker image / profile build pipeline (21 items)

Issues: #1, #4, #5, #45, #66, #91
PRs: #3, #6, #7, #15, #19, #21, #22, #24, #40, #47, #54, #55, #99, #101, #102

**Pattern**: Heredoc-in-Dockerfile breaks JSON, awk substitution fails on multi-line profiles, placeholder `{{PROFILE_INSTALLATIONS}}` not replaced. Users need robust, templated Dockerfiles.

### 3. MCP integration (8 items)

Issues: #39, #64, #72, #75
PRs: #10, #43, #57, #73

**Pattern**: MCP servers need discoverable setup, proper scoping (user vs project), and clean EXIT trap handling. Unbound variables in cleanup functions cause nonzero exit codes.

### 4. Ecosystem tooling & packaging (7 items)

Issues: #38, #46, #61
PRs: #42, #44, #56, #98

**Pattern**: Users want additional tool profiles (Flutter, Deno, better-enter), agent syncing from host, Homebrew install, uninstall scripts, and mobile UI companions.

### 5. Docker user / group / UID mapping (6 items)

Issues: #23, #29, #35, #62
PRs: #14, #34

**Pattern**: macOS GID 20 conflicts, WSL2 root UID 0, chown using wrong group. Container user setup must handle all host UID/GID combinations.

### 6. API routing & auth flexibility (5 items)

Issues: #49, #53, #82, #83
PRs: #103

**Pattern**: Users want custom `ANTHROPIC_BASE_URL` for proxies (ccflare), alternative model providers (GLM), Claude Max subscription reuse without re-auth per session.

### 7. Global Claude settings (4 items)

Issues: #32, #85, #96
PRs: #86

**Pattern**: Host `~/.claude` (settings.json, commands, skills like get-shit-done) should optionally be available in containers. Per-project isolation is good but global skills should be shareable.

### 8. Host environment parity (4 items)

Issues: #50, #51, #59
PRs: #70

**Pattern**: Containers should match host timezone, pass environment variables from `.env` files, and optionally expose Claude Code logs to host monitoring tools.

### 9. Python / uv persistence (4 items)

Issues: #30, #87
PRs: #74, #88

**Pattern**: uv downloads Python to `~/.local/share/uv/python/` which isn't mounted, so venv symlinks break on restart. Need persistent volume for uv data.

### 10. Git integration (3 items)

Issues: #68, #80
PRs: #67

**Pattern**: Mount `.git` for commit hash / branch access, and `.gitconfig` read-only for user identity. Build processes that use git metadata fail without this.

### 11. SSH key handling (3 items)

Issues: #63, #79
PRs: #69

**Pattern**: SSH client binaries missing in container, keys silently mounted without docs. Need ssh binaries installed, configurable key mounting, and security documentation.

### 12. Session / slot UX (3 items)

Issues: #84, #93, #94

**Pattern**: "Slots" concept is undocumented, "no available slots" despite slots existing, confusing first-run experience. Session lifecycle needs clear docs and robust state management.

### 13. Stronger isolation / alt runtimes (2 items)

Issues: #76, #95

**Pattern**: Docker provides namespace isolation but users ask about VM-level isolation (BoxLite, Apple Containers) for AI-generated code execution.

### 14. Documentation & transparency (2 items)

Issues: #41
PRs: #52

**Pattern**: Installer contains embedded binary archive with no explanation. Profiles.ini not visible in repo. Users want to audit what runs.

### 15. Java / JVM tooling (2 items)

Issues: #48
PRs: #58

**Pattern**: Java profile hardcodes JDK 17 but users need JDK 24. SDKMan proposed for flexible version management.

### 16. Project maintenance signals (2 items)

Issues: #81
PRs: #8

**Pattern**: No commits for months, user created agentbox as alternative. Validates market demand for actively-maintained solution.

### 17. Permission UX (1 item)

Issues: #60

**Pattern**: `--dangerously-skip-permissions` and `--permission-mode bypassPermissions` appear redundant and confusing.

### 18. Terminal / tmux UX (1 item)

Issues: #27

**Pattern**: tmux pane content capture fails after hard exit. Terminal resilience needed.

---

## Deduplicated "What to Build" List for AFK

Merging overlapping themes into actionable feature areas, ranked by community demand:

### Tier 1 — High demand (8+ signals)

1. **Layered container image pipeline** (themes: docker_build + bash_compat)

- AFK already controls Docker images server-side with a shared base image and built-in language images, so we avoid most shell-script fragility entirely
- Remaining opportunity: move from a fixed curated image matrix to composable tool profiles, stronger image templating, and better build validation or optimization
- **Action**: Extend AFK's current image pipeline with profile-based image composition and more robust build verification

2. **MCP server lifecycle** (theme: mcp)

- In-container MCP server discovery, configuration, and clean shutdown
- Multi-config support (user-level + project-level MCP servers)
- **Action**: First-class MCP support in AFK sessions with clean start/stop lifecycle

### Tier 2 — Strong demand (3-7 signals)

1. **Ecosystem extensibility** (themes: ecosystem_tooling + java_tooling)

- Installable tool profiles (languages, frameworks, CLI tools)
- Agent/skill syncing from host
- Easy install/uninstall, package manager support
- **Action**: Build a profile/extension system for AFK containers

2. **API & auth flexibility** (theme: api_routing)

- Custom API base URLs for proxies, routers, self-hosted models
- Subscription/token persistence across sessions
- Support for non-Anthropic model providers
- **Action**: Configurable API routing in AFK session settings

3. **Global vs project Claude config** (theme: global_settings)

- Option to share `~/.claude` skills, commands, settings across all sessions
- Per-project isolation as default, global as opt-in
- **Action**: AFK settings entity should support global Claude config mounting

4. **Host environment parity** (theme: host_environment)

- Timezone matching, environment variable passthrough, log exposure
- `.env` file support
- **Action**: AFK sessions should inherit host timezone and support env var injection

5. **Platform identity mapping** (theme: docker_user_group)

- Correct UID/GID mapping for macOS, Linux, WSL2
- Handle root users, non-standard groups
- **Action**: AFK's container user setup must auto-detect and handle all host platforms

6. **Python / language toolchain persistence** (theme: python_uv)

- Language runtime installations must survive session restarts
- Proper volume mounts for package managers (uv, pip, npm)
- **Action**: Persistent volumes for `~/.local/share`, venvs, and node_modules

7. **Git-aware workspaces** (theme: git_integration)

- `.git` directory accessible for build processes
- Host `.gitconfig` mounted read-only for user identity
- **Action**: AFK workspace mounts should include `.git` and git identity

8. **SSH story** (theme: ssh_security)

- SSH client available in container
  - Configurable key mounting with documented security model
  - Prefer SSH agent forwarding over raw key mounting
  - **Action**: Document and implement SSH access strategy for AFK sessions

9. **Session lifecycle UX** (theme: slots_ux)

- Clear create → use → list → destroy flow
  - Intuitive first-run experience
  - Status visibility (authenticated, running, idle)
  - **Action**: AFK already has session management — ensure docs and UX are clear

### Tier 3 — Emerging demand (1-2 signals)

1. **Stronger isolation options** (theme: isolation_runtime)

- VM-level isolation for high-security workloads
  - Apple Container / microVM backends
  - **Action**: Future consideration — monitor demand

2. **Transparent, auditable system** (theme: docs_transparency)

- Users want to understand what runs in their containers
  - Clear documentation of the build and execution model
  - **Action**: AFK docs should explain the container architecture clearly

3. **Single permission model** (theme: security_permissions)

- One clear way to control Claude's permissions per session
  - **Action**: AFK should have a unified permission model in session settings

4. **Terminal resilience** (theme: terminal_ux)

- Web terminal handles disconnects and reconnects gracefully
  - **Action**: AFK's xterm.js integration should handle connection drops

---

## Key Takeaway

The **overwhelming majority** of claudebox issues (46 out of 103) are about **shell scripting bugs on macOS** and **Dockerfile generation failures** — problems that stem from running complex bash scripts on the user's host machine. AFK's architecture of running a proper server that manages Docker containers directly **eliminates both of these categories entirely**.

The features that matter most for AFK are:

1. **MCP integration** — highest demand real feature (not just a bug fix)
2. **Extensible tool profiles** — users want customizable development environments
3. **API/auth flexibility** — support for proxies, alternative models, persistent auth
4. **Global Claude config sharing** — skills and settings across sessions
5. **Host environment parity** — timezone, env vars, git identity, SSH
