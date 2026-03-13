# AFK Docker Images

AFK uses a layered Docker image architecture. A **base image** provides Claude Code, ttyd (web terminal), git, and essential tools. **Language images** extend the base with specific runtimes and package managers.

## Image Architecture

```
afk-base:latest        (Debian Bookworm Slim + Claude Code + ttyd + tools)
├── afk-node:latest    (Node.js 24 + yarn + pnpm)
├── afk-python:latest  (Python 3.13 + pip + poetry)
├── afk-go:latest      (Go 1.26)
├── afk-rust:latest    (Rust via rustup)
├── afk-dotnet:latest  (.NET 10)
└── afk-java:latest    (Java 21 Temurin + Gradle 9.4 + Maven 3.9)
```

### Base Image

The base image (`afk-base:latest`) includes:

- **Debian Bookworm Slim** as the OS
- **Claude Code CLI** (configurable version, default 2.1.42)
- **ttyd** for web terminal access
- **Git**, SSH client, tmux, ripgrep, fzf, gh (GitHub CLI), jq, curl, make
- **inotify-tools** for file-system watching (used by git status tracking)
- **iptables/ipset/iproute2** for network configuration
- Non-root user `afk` (UID/GID 1000)
- Entrypoint script that handles SSH setup, git clone, git config, and tmux + ttyd startup

### Language Images

Each language image extends `afk-base` and adds:

| Image        | Runtime                              | Package Managers      |
| ------------ | ------------------------------------ | --------------------- |
| `afk-node`   | Node.js 24                           | npm, yarn, pnpm       |
| `afk-python` | Python 3.13.3 (compiled from source) | pip, poetry           |
| `afk-go`     | Go 1.26.1                            | go modules            |
| `afk-rust`   | Rust (latest stable via rustup)      | cargo                 |
| `afk-dotnet` | .NET 10                              | dotnet CLI            |
| `afk-java`   | Java 21 (Eclipse Temurin)            | Gradle 9.4, Maven 3.9 |

## Building Images

### Using Make (recommended)

```bash
cd docker

# Build everything (base + all language images)
make all

# Build the base image only
make base

# Build a specific language image (automatically builds base first)
make node
make python
make go
make rust
make dotnet
make java

# Remove all afk images
make clean
```

### Using npm

```bash
cd docker

# Build all images
npm run build

# Build specific images
npm run build:base
npm run build:node
npm run build:python
npm run build:go
npm run build:rust
npm run build:dotnet
npm run build:java

# Clean up
npm run clean
```

### Using Docker Compose

```bash
cd docker

# Build all images via compose
docker compose build
```

## How Containers Work

Each AFK session runs in its own Docker container managed by the server. The container lifecycle:

1. **Startup**: The entrypoint script runs SSH setup (if configured), clones the repository, configures git identity, and starts tmux + ttyd
2. **Claude Code**: Invoked on-demand via `docker exec` when you send chat messages -- it does not run persistently in the container
3. **Chat history**: Stored in the AFK server database, so conversations survive session stop/start cycles
4. **Claude state**: The `.claude/` directory is stored in a named Docker volume (`afk-claude-{sessionId}`), preserving project context across restarts
5. **Tmux state**: Stored in a separate named volume (`afk-tmux-{sessionId}`) for terminal session persistence

## Environment Variables

### Required

- `CLAUDE_CODE_OAUTH_TOKEN` - Your Claude Code OAuth token (set via the AFK Settings page)

### Git Integration (Optional)

- `REPO_URL` - Git repository URL to clone (HTTPS or SSH format)
- `REPO_BRANCH` - Git branch to checkout (default: `main`)
- `SSH_PRIVATE_KEY` - SSH private key for private repositories
- `GIT_USER_NAME` - Git user name (default: `Claude User`)
- `GIT_USER_EMAIL` - Git user email (default: `claude@example.com`)
- `GIT_SSH_HOST` - Custom git host for SSH connections

### Container Options

- `WORKSPACE_DIR` - Working directory inside container (default: `/workspace`)
- `TERMINAL_PORT` - Port for the web terminal (default: `7681`)

These are set automatically by the AFK server when creating sessions. You normally don't need to set them manually.

## Custom Images

You can register custom Docker images through the AFK server API or web interface. Custom images should ideally extend `afk-base:latest` to include Claude Code and the entrypoint scripts, but any image that provides a compatible environment will work.

Built-in images (Node.js, Python, Go, Rust, .NET, Java) are seeded automatically on server startup. Node.js is the default image for new sessions.

## File Structure

```
docker/
├── base/
│   └── Dockerfile          # Base image (Debian + Claude Code + ttyd + tools)
├── node/
│   └── Dockerfile          # Node.js language image
├── python/
│   └── Dockerfile          # Python language image
├── go/
│   └── Dockerfile          # Go language image
├── rust/
│   └── Dockerfile          # Rust language image
├── dotnet/
│   └── Dockerfile          # .NET language image
├── java/
│   └── Dockerfile          # Java language image
├── scripts/
│   ├── entrypoint.sh       # Container entrypoint and startup orchestration
│   ├── init-git.sh         # Git repository initialization
│   ├── setup-ssh.sh        # SSH key management
│   └── .tmux.conf          # Tmux configuration
├── .claude.json            # Claude Code project configuration
├── Dockerfile              # Legacy single image (Node.js-based, deprecated)
├── docker-compose.yml      # Compose definitions for all images
├── Makefile                # Build targets for all images
├── package.json            # npm scripts wrapping Make targets
└── README.md               # This file
```

## Security Considerations

### SSH Key Management

- SSH keys are passed via environment variables and set up in `~/.ssh/`
- Keys are configured with proper permissions (700 for `.ssh/`, 600 for key files)
- Never commit SSH keys to version control

### Container Isolation

- Each session runs in its own container with a non-root user (`afk`)
- Containers have their own filesystem, network, and process namespace
- Named volumes persist only Claude state and tmux sessions between restarts
- Workspace content is ephemeral unless committed and pushed via git

### Best Practices

1. **Use GitHub OAuth**: Prefer connecting GitHub over SSH keys for simpler and more secure repository access
2. **Separate SSH Keys**: If using SSH, generate a dedicated key for AFK containers
3. **Key Rotation**: Regularly rotate SSH keys and OAuth tokens
4. **Minimal Permissions**: Use deploy keys or tokens with minimal required permissions

## Troubleshooting

### Container Won't Start

- Check that Docker images are built (`make all` in the `docker/` directory)
- Verify Docker is running and accessible
- Check the port range (default 7681-7780) is not already in use
- Review server logs for container creation errors

### Git Clone Fails

- Verify the repository URL is correct and accessible
- For SSH repos, ensure an SSH private key is configured in Settings
- For GitHub repos via OAuth, ensure your GitHub account is connected in Settings
- Check container logs via the session log viewer in the web interface

### Claude Code Not Responding

- Verify your Claude OAuth token is set in Settings
- Check the container is in `RUNNING` state
- Review chat error messages for specific issues
- Try cancelling any stuck execution and sending a new message
