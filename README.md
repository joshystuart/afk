# afk
AFK - Remote Terminal Access

## Overview

AFK (Away From Keyboard) is a remote terminal access service that enables running Claude Code in Docker containers with web-based terminal access. The project provides dual terminal sessions (Claude + manual access), automatic git integration, and containerized development environments.

## Quick Start

### Build the Docker image
```shell
docker build -t afk . --no-cache
```

### Run with Docker Compose

#### Debug mode
```shell
TERMINAL_MODE=debug \
SSH_PRIVATE_KEY=$(cat ~/.ssh/id_ed25519 | base64 -w 0) \
REPO_URL=git@github.com:your-org/your-repo.git \
CLAUDE_CODE_OAUTH_TOKEN=your-token \
GIT_USER_NAME="Your Name" \
GIT_USER_EMAIL="your.email@example.com" \
docker-compose up --force-recreate
```

#### Dual terminal mode
```shell
TERMINAL_MODE=dual \
SSH_PRIVATE_KEY=$(cat ~/.ssh/id_ed25519 | base64 -w 0) \
REPO_URL=git@github.com:your-org/your-repo.git \
CLAUDE_CODE_OAUTH_TOKEN=your-token \
GIT_USER_NAME="Your Name" \
GIT_USER_EMAIL="your.email@example.com" \
docker-compose up --force-recreate
```

#### Normal mode
```shell
SSH_PRIVATE_KEY=$(cat ~/.ssh/id_ed25519 | base64 -w 0) \
REPO_URL=git@github.com:your-org/your-repo.git \
CLAUDE_CODE_OAUTH_TOKEN=your-token \
GIT_USER_NAME="Your Name" \
GIT_USER_EMAIL="your.email@example.com" \
docker-compose up
```

### Run with Docker directly

```shell
docker run -d \
  --name afk-terminal-1 \
  -p 7681:7681 \
  --privileged \
  --restart unless-stopped \
  -e CLAUDE_CODE_OAUTH_TOKEN="${CLAUDE_CODE_OAUTH_TOKEN}" \
  -e REPO_URL="${REPO_URL}" \
  -e REPO_BRANCH="${REPO_BRANCH:-main}" \
  -e SSH_PRIVATE_KEY="$(cat ~/.ssh/id_ed25519 | base64 -w 0)" \
  -e GIT_USER_NAME="${GIT_USER_NAME}" \
  -e GIT_USER_EMAIL="${GIT_USER_EMAIL}" \
  -e GIT_SSH_HOST="${GIT_SSH_HOST}" \
  -v "$(pwd)/workspace:/workspace" \
  -v "/var/run/docker.sock:/var/run/docker.sock" \
  afk:latest
```

### Container Management

View logs:
```shell
docker logs -f afk-terminal-1
```

Stop and remove:
```shell
docker stop afk-terminal-1
docker rm afk-terminal-1
```

## Environment Variables

- `CLAUDE_CODE_OAUTH_TOKEN`: OAuth token for Claude Code authentication
- `REPO_URL`: Git repository URL (SSH format)
- `REPO_BRANCH`: Git branch to checkout (default: main)
- `SSH_PRIVATE_KEY`: Base64-encoded SSH private key for Git authentication
- `GIT_USER_NAME`: Git user name for commits
- `GIT_USER_EMAIL`: Git user email for commits
- `GIT_SSH_HOST`: SSH host for Git operations (optional)
- `TERMINAL_MODE`: Terminal mode (debug, dual, or normal)
