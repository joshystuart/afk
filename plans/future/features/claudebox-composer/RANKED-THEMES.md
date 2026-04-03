# ClaudeBox (RchGrav/claudebox) — theme frequency & ranked ideas

Source repository: [github.com/RchGrav/claudebox](https://github.com/RchGrav/claudebox)

- **Snapshot**: GitHub API export with **55 issues** (open + closed) and **48 pull requests** (open + closed).
- **Per-item files**: see `plans/future/features/claudebox/` (`issue-*.md`, `pr-*.md`).
- **Method**: each issue/PR was manually assigned a single **theme key** for planning (deduping similar threads into one bucket).

## Ranked themes (how often the theme appears across issues + PRs)

| Rank | Count | Theme                    | Meaning for a Claude-in-containers product (e.g. AFK)               |
| ---- | ----- | ------------------------ | ------------------------------------------------------------------- |
| 1    | 25    | `shell_bash_compat`      | Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local) |
| 2    | 22    | `docker_profile_build`   | Dockerfile / profile templating & image rebuilds                    |
| 3    | 8     | `ecosystem_bundling`     | Extra profiles, uninstall, Homebrew, agents, mobile, routers        |
| 4    | 8     | `mcp`                    | MCP wiring, cleanup bugs, and discoverability                       |
| 5    | 5     | `platform_wsl_root`      | WSL / root UID / Docker user & group edge cases                     |
| 6    | 4     | `api_routing_auth`       | API base URL, vendors, subscriptions, alternate models              |
| 7    | 4     | `global_claude_settings` | Global Claude config & skills (~/.claude mount, --global)           |
| 8    | 4     | `host_environment`       | Host parity (timezone, env files, logs to host)                     |
| 9    | 4     | `python_uv_persistence`  | Python & uv persistence (.local/share, venv symlinks)               |
| 10   | 3     | `git_integration`        | Git metadata in container (.git, gitconfig)                         |
| 11   | 3     | `slots_ux`               | Slots lifecycle & onboarding (“no slots”, docs)                     |
| 12   | 3     | `ssh_keys`               | SSH client & key mounting / security docs                           |
| 13   | 2     | `docs_transparency`      | Docs, installer transparency, onboarding clarity                    |
| 14   | 2     | `isolation_runtime`      | Stronger isolation / alternate runtimes (BoxLite, Apple Container)  |
| 15   | 2     | `java_jvm_tooling`       | Java/JDK versions & JVM profiles                                    |
| 16   | 2     | `maintenance_meta`       | Project maintenance & alternatives (meta)                           |
| 17   | 1     | `security_permissions`   | Permission flags & credential UX                                    |
| 18   | 1     | `ui_terminal`            | Terminal/tmux UX edge cases                                         |

## Theme → items

### `shell_bash_compat` — Shell / Bash compatibility (macOS 3.2, set -u, unbound vars, local)

- issue #90
- issue #71
- issue #65
- issue #36
- issue #31
- issue #28
- issue #26
- issue #25
- issue #20
- issue #18
- issue #13
- issue #2
- PR #100
- PR #97
- PR #92
- PR #89
- PR #78
- PR #77
- PR #37
- PR #33
- PR #17
- PR #16
- PR #12
- PR #11
- PR #9

### `docker_profile_build` — Dockerfile / profile templating & image rebuilds

- issue #91
- issue #66
- issue #45
- issue #35
- issue #5
- issue #4
- issue #1
- PR #102
- PR #101
- PR #99
- PR #55
- PR #54
- PR #47
- PR #40
- PR #24
- PR #22
- PR #21
- PR #19
- PR #15
- PR #7
- PR #6
- PR #3

### `ecosystem_bundling` — Extra profiles, uninstall, Homebrew, agents, mobile, routers

- issue #61
- issue #49
- issue #46
- issue #38
- PR #98
- PR #56
- PR #44
- PR #42

### `mcp` — MCP wiring, cleanup bugs, and discoverability

- issue #75
- issue #72
- issue #64
- issue #39
- PR #73
- PR #57
- PR #43
- PR #10

### `platform_wsl_root` — WSL / root UID / Docker user & group edge cases

- issue #62
- issue #29
- issue #23
- PR #34
- PR #14

### `api_routing_auth` — API base URL, vendors, subscriptions, alternate models

- issue #83
- issue #82
- issue #53
- PR #103

### `global_claude_settings` — Global Claude config & skills (~/.claude mount, --global)

- issue #96
- issue #85
- issue #32
- PR #86

### `host_environment` — Host parity (timezone, env files, logs to host)

- issue #59
- issue #51
- issue #50
- PR #70

### `python_uv_persistence` — Python & uv persistence (.local/share, venv symlinks)

- issue #87
- issue #30
- PR #88
- PR #74

### `git_integration` — Git metadata in container (.git, gitconfig)

- issue #80
- issue #68
- PR #67

### `slots_ux` — Slots lifecycle & onboarding (“no slots”, docs)

- issue #94
- issue #93
- issue #84

### `ssh_keys` — SSH client & key mounting / security docs

- issue #79
- issue #63
- PR #69

### `docs_transparency` — Docs, installer transparency, onboarding clarity

- issue #41
- PR #52

### `isolation_runtime` — Stronger isolation / alternate runtimes (BoxLite, Apple Container)

- issue #95
- issue #76

### `java_jvm_tooling` — Java/JDK versions & JVM profiles

- issue #48
- PR #58

### `maintenance_meta` — Project maintenance & alternatives (meta)

- issue #81
- PR #8

### `security_permissions` — Permission flags & credential UX

- issue #60

### `ui_terminal` — Terminal/tmux UX edge cases

- issue #27

## Deduplicated “what to build” list (merged themes)

These clusters subsume multiple overlapping tickets:

1. **Reliable shell + macOS host support** — `shell_bash_compat` + parts of `platform_wsl_root`: strict-mode-safe scripts, Bash 3.2 quirks, `local` only in functions, sane UID/GID/`chown` on macOS & WSL.
2. **Docker profile pipeline** — `docker_profile_build`: robust Dockerfile templating for multi-line profiles, devops package sources, Java/Go install fragments.
3. **Host Claude config parity** — `global_claude_settings`: optional use of host `~/.claude` (settings, commands, **skills**) vs per-project isolation.
4. **Slots / session model clarity** — `slots_ux`: first-run flow, “no slots” bugs, documentation of the mental model.
5. **MCP lifecycle** — `mcp`: discoverable setup, cleanup traps that do not reference function-local vars, multi-config.
6. **Python/uv durability** — `python_uv_persistence`: persist uv’s managed Python store or avoid broken venv symlinks across restarts.
7. **Git-aware workspaces** — `git_integration`: `.git` visibility and read-only git identity/config when builds need them.
8. **SSH story** — `ssh_keys`: client binary in environment + documented risk model for key mounts.
9. **API & auth flexibility** — `api_routing_auth`: `ANTHROPIC_BASE_URL`, vendor tokens, subscription/session reuse patterns.
10. **Host environment parity** — `host_environment`: timezone, `.env` → container, optional log file mounts for external tools.
11. **Optional stronger isolation** — `isolation_runtime`: explore VM-based or Apple Container–style backends for high-risk codegen.
12. **Ecosystem & packaging** — `ecosystem_bundling`: Homebrew, uninstall, extra profiles (Flutter/Deno), agents, mobile/CLI companions.
13. **Trust & docs** — `docs_transparency`: explain installers, embedded assets, and profile composition so users can audit what runs.
