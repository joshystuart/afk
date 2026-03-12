# AFK Docker Container

AFK (Away From Keyboard) runs Claude Code sessions in isolated Docker containers. Each container provides a chat-based interface to Claude Code and a web terminal for manual access, with automatic git integration.

## Features

- **Chat-based Claude Code**: Interact with Claude Code through the web UI chat pane -- no terminal required
- **Web Terminal**: Access a shell inside the container via ttyd for manual operations
- **Automatic Git Integration**: Clone repositories on container startup
- **SSH Authentication**: Support for private repositories with SSH keys
- **Persistent Chat History**: Conversations are stored and restored when sessions are stopped and restarted
- **Persistent Claude State**: Claude's project context (`.claude/`) is stored in a Docker volume so it survives restarts

## Quick Start

### 1. Basic Usage (No Git Repository)

Start a container:

```bash
docker-compose up
```

Access the terminal at: http://localhost:7681

### 2. With Public Repository

Clone a public repository on startup:

```bash
REPO_URL=https://github.com/username/repository.git docker-compose up
```

### 3. With Private Repository (SSH)

For private repositories, provide an SSH private key:

```bash
REPO_URL=git@github.com:username/private-repo.git \
SSH_PRIVATE_KEY="$(cat ~/.ssh/id_rsa)" \
docker-compose up
```

## Environment Variables

### Required

- `CLAUDE_CODE_OAUTH_TOKEN` - Your Claude Code OAuth token

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

## How It Works

Each AFK session runs in its own Docker container. The container:

1. **On startup**: Sets up SSH (if configured), clones the repository, configures git identity, and starts a web terminal via ttyd
2. **Claude Code**: Is invoked on-demand via `docker exec` when you send messages through the chat UI -- it does not run persistently
3. **Chat history**: Is stored in the AFK server database, so conversations survive session stop/start cycles
4. **Claude state**: The `.claude/` directory is stored in a named Docker volume (`afk-claude-{sessionId}`), preserving project context across restarts

## Usage Examples

### Public GitHub Repository

```bash
REPO_URL=https://github.com/facebook/react.git \
REPO_BRANCH=main \
GIT_USER_NAME="Your Name" \
GIT_USER_EMAIL="your.email@example.com" \
docker-compose up
```

### Private Repository with SSH

```bash
export SSH_PRIVATE_KEY="$(cat ~/.ssh/id_rsa)"

REPO_URL=git@github.com:your-org/private-repo.git \
SSH_PRIVATE_KEY=$SSH_PRIVATE_KEY \
GIT_USER_NAME="Your Name" \
GIT_USER_EMAIL="your.email@example.com" \
docker-compose up
```

### Custom Git Host (GitLab/Bitbucket)

```bash
# GitLab
REPO_URL=git@gitlab.com:username/repo.git \
GIT_SSH_HOST=gitlab.com \
SSH_PRIVATE_KEY="$(cat ~/.ssh/id_rsa)" \
docker-compose up

# Bitbucket
REPO_URL=git@bitbucket.org:username/repo.git \
GIT_SSH_HOST=bitbucket.org \
SSH_PRIVATE_KEY="$(cat ~/.ssh/id_ed25519)" \
docker-compose up
```

## Development

### Building the Image

```bash
docker-compose build
```

### Debugging

View container logs:

```bash
docker-compose logs -f
```

Access container shell:

```bash
docker-compose exec afk-terminal bash
```

## File Structure

```
docker/
   Dockerfile              # Container definition
   docker-compose.yml      # Service configuration
   scripts/
      init-git.sh         # Git repository initialization
      setup-ssh.sh        # SSH key management
      entrypoint.sh       # Container entrypoint and startup orchestration
      .tmux.conf          # Tmux configuration for the terminal session
   README.md              # This file
```

## Security Considerations

### SSH Key Management

- SSH keys are securely handled via environment variables
- Keys are automatically cleaned up on container exit
- Keys are stored only in memory and `~/.ssh/`
- Never commit encoded keys to version control

### Best Practices

1. **Use Environment Files**: Create a `.env` file for local development:

   ```bash
   CLAUDE_CODE_OAUTH_TOKEN=your_token_here
   REPO_URL=git@github.com:username/repo.git
   SSH_PRIVATE_KEY="$(cat ~/.ssh/id_rsa)"
   GIT_USER_NAME=Your Name
   GIT_USER_EMAIL=your.email@example.com
   ```

2. **Key Rotation**: Regularly rotate SSH keys and update the environment variable

3. **Minimal Permissions**: Use deploy keys or SSH keys with minimal required permissions

## Troubleshooting

### Container Won't Start

- Check that `CLAUDE_CODE_OAUTH_TOKEN` is set
- Verify Docker and Docker Compose are installed
- Check port 7681 is not already in use

### Git Clone Fails

- Verify `REPO_URL` is correct and accessible
- For SSH repos, ensure `SSH_PRIVATE_KEY` is set correctly
- Check the container logs: `docker-compose logs -f`
