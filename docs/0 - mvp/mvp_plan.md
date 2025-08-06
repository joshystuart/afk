# AFK MVP Plan: ttyd Terminal Emulator Implementation

## Overview

This MVP focuses on implementing a minimal viable product using ttyd as the terminal emulator for the AFK (Away From Keyboard) remote Claude Code service. The goal is to create a containerized environment where Claude Code can run with web-based terminal access.

## Objectives

### Primary Goal
Create a proof-of-concept that validates the core technical feasibility:
- Run Claude Code in a Docker container
- Provide web-based terminal access via ttyd
- Support multiple terminal sessions using tmux
- Verify git operations work correctly in the containerized environment

### Success Criteria
- [ ] Successfully build and run Docker container with ttyd + Claude Code
- [ ] Access container terminal via web browser (no SSH complexity)
- [ ] Create and manage multiple terminal sessions using tmux
- [ ] Execute Claude Code commands successfully in the container
- [ ] Perform git operations (init, add, commit, push) from within container
- [ ] Measure baseline performance and resource usage
- [ ] Document any limitations or issues encountered

## Technical Architecture

### Stack Selection
- **Terminal Emulator**: ttyd (lightweight, no SSH required)
- **Session Management**: tmux (built-in terminal multiplexing)
- **Container**: Docker with Ubuntu 22.04 base
- **Terminal Interface**: Web browser (direct ttyd connection)

### Why ttyd?
- **Pros**: Simple setup, lightweight, works directly with shell, no authentication complexity
- **Cons**: No built-in SSL (acceptable for MVP), basic features only
- **Alternative**: Ready fallback options documented if ttyd fails

## Implementation Plan

### Phase 1: Container Setup (2 hours)

#### 1.1 Create Dockerfile
**File**: `Dockerfile.mvp`

```dockerfile
FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies and ttyd
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    python3 \
    python3-pip \
    nodejs \
    npm \
    vim \
    tmux \
    sudo \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install ttyd (latest stable version)
RUN wget https://github.com/tsl0922/ttyd/releases/download/1.7.4/ttyd.x86_64 -O /usr/local/bin/ttyd && \
    chmod +x /usr/local/bin/ttyd

# Install Claude Code CLI
# TODO: Replace with actual Claude Code installation method
RUN curl -fsSL https://claude.ai/install.sh | sh || \
    echo "Claude Code installation needs manual configuration"

# Create non-root user for security
RUN useradd -m -s /bin/bash developer && \
    echo "developer:developer" | chpasswd && \
    usermod -aG sudo developer && \
    echo "developer ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Create and configure workspace
RUN mkdir -p /workspace && chown developer:developer /workspace

# Switch to developer user
USER developer
WORKDIR /workspace

# Configure shell environment
RUN echo 'export PS1="\[\033[01;32m\]\u@afk-container\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ "' >> ~/.bashrc && \
    echo 'alias ll="ls -la"' >> ~/.bashrc && \
    echo 'alias gs="git status"' >> ~/.bashrc && \
    echo 'alias gp="git push"' >> ~/.bashrc

# Expose ttyd port
EXPOSE 7681

# Start ttyd with tmux for session management
CMD ["ttyd", "-p", "7681", "-W", "-d", "5", "tmux", "new", "-s", "main"]
```

**Deliverable**: Working Dockerfile that builds without errors

#### 1.2 Create Docker Compose Configuration
**File**: `docker-compose.mvp.yml`

```yaml
version: '3.8'

services:
  afk-ttyd:
    build:
      context: .
      dockerfile: Dockerfile.mvp
    ports:
      - "7681:7681"  # ttyd web interface
    volumes:
      - ./workspace:/workspace:rw
      - ./git-config:/home/developer/.gitconfig:ro
    environment:
      - TERM=xterm-256color
      - LANG=C.UTF-8
      - LC_ALL=C.UTF-8
    # Resource limits for testing
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2'
        reservations:
          memory: 512M
          cpus: '0.5'
    # Health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7681"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**Deliverable**: Docker Compose file that successfully starts the service

#### 1.3 Create Supporting Configuration
**File**: `git-config`

```ini
[user]
    name = AFK Developer
    email = developer@afk-container.local
[init]
    defaultBranch = main
[core]
    editor = vim
[push]
    default = current
```

**File**: `workspace/.gitkeep` (ensure workspace directory exists)

**Deliverable**: Configuration files that enable proper git functionality

### Phase 2: Testing & Validation (1 hour)

#### 2.1 Build and Launch Test
```bash
# Build the container
docker-compose -f docker-compose.mvp.yml build

# Start the service
docker-compose -f docker-compose.mvp.yml up -d

# Verify container is running
docker-compose -f docker-compose.mvp.yml ps

# Check logs for any errors
docker-compose -f docker-compose.mvp.yml logs
```

**Success Criteria**: Container starts without errors and ttyd is accessible

#### 2.2 Web Terminal Access Test
1. Open browser to `http://localhost:7681`
2. Verify terminal interface loads
3. Confirm you're in tmux session (should show tmux status bar)
4. Test basic shell commands:
   ```bash
   pwd
   whoami
   ls -la
   echo $TERM
   ```

**Success Criteria**: Full interactive terminal access via web browser

#### 2.3 Tmux Session Management Test
```bash
# Create new tmux window
Ctrl+B, c

# Switch between windows
Ctrl+B, 0  # Window 0
Ctrl+B, 1  # Window 1

# Split panes
Ctrl+B, %  # Vertical split
Ctrl+B, "  # Horizontal split

# Navigate panes
Ctrl+B, arrow keys

# List sessions
tmux list-sessions
```

**Success Criteria**: Multiple terminal sessions work correctly

#### 2.4 Claude Code Integration Test
```bash
# Check Claude Code installation
claude-code --version

# Test basic functionality
cd /workspace
mkdir test-project
cd test-project
git init

# Create sample file
echo "# Test Project" > README.md

# Test Claude Code (if available)
claude-code help
```

**Success Criteria**: Claude Code executes without errors (or clear documentation of what needs to be configured)

#### 2.5 Git Operations Test
```bash
# Initialize repository
git init

# Configure git (if not already done)
git config user.name "Test User"
git config user.email "test@example.com"

# Create and commit file
echo "Hello World" > hello.txt
git add hello.txt
git commit -m "Initial commit"

# Check git log
git log --oneline

# Test SSH key generation (for later integration)
ssh-keygen -t ed25519 -C "test@afk-container" -f ~/.ssh/id_ed25519 -N ""
```

**Success Criteria**: All git operations complete successfully

### Phase 3: Performance & Documentation (1 hour)

#### 3.1 Performance Baseline
**File**: `scripts/performance-test.sh`

```bash
#!/bin/bash

echo "=== AFK MVP Performance Baseline ==="
echo "Date: $(date)"
echo

# Container resource usage
echo "=== Container Resources ==="
docker stats --no-stream afk-ttyd

# Memory usage inside container
echo "=== Memory Usage ==="
docker exec afk-ttyd free -h

# Disk usage
echo "=== Disk Usage ==="
docker exec afk-ttyd df -h

# Process list
echo "=== Process List ==="
docker exec afk-ttyd ps aux

# Network connectivity test
echo "=== Network Test ==="
docker exec afk-ttyd ping -c 3 google.com

# Response time test
echo "=== Response Time ==="
time curl -s http://localhost:7681 > /dev/null

echo
echo "=== Test Complete ==="
```

**Deliverable**: Performance baseline report

#### 3.2 Issue Documentation
**File**: `docs/0 - mvp/mvp-results.md`

Document findings including:
- What worked as expected
- Issues encountered and solutions
- Performance observations
- Security considerations noted
- Next steps and recommendations

### Phase 4: Fallback Implementation (Optional - 2 hours)

If ttyd fails, implement the custom Node.js solution described in the original plan.

#### 4.1 Custom Terminal Server
**File**: `server/package.json`
```json
{
  "name": "afk-terminal-server",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "express-ws": "^5.0.2",
    "node-pty": "^0.10.1"
  }
}
```

**File**: `server/server.js`
```javascript
const express = require('express');
const expressWs = require('express-ws');
const pty = require('node-pty');
const path = require('path');

const app = express();
expressWs(app);

// Serve static files
app.use(express.static('public'));

const terminals = {};

// WebSocket endpoint for terminal connections
app.ws('/terminals/:id', (ws, req) => {
  const id = req.params.id;
  console.log(`New terminal connection: ${id}`);
  
  if (!terminals[id]) {
    terminals[id] = pty.spawn('tmux', ['new', '-s', id], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: '/workspace',
      env: process.env
    });
    
    terminals[id].on('data', (data) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      }
    });
    
    terminals[id].on('exit', () => {
      console.log(`Terminal ${id} exited`);
      delete terminals[id];
      ws.close();
    });
  }
  
  ws.on('message', (msg) => {
    if (terminals[id]) {
      terminals[id].write(msg);
    }
  });
  
  ws.on('close', () => {
    console.log(`Terminal ${id} connection closed`);
    if (terminals[id]) {
      terminals[id].kill();
      delete terminals[id];
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Terminal server running on port ${PORT}`);
});
```

**File**: `server/public/index.html`
```html
<!DOCTYPE html>
<html>
<head>
    <title>AFK Terminal</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css" />
    <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
    <style>
        body { 
            margin: 0; 
            background: #1e1e1e; 
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        #terminal { 
            height: 100vh; 
            padding: 10px;
        }
        .status {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: #0f0;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="status" id="status">Connecting...</div>
    <div id="terminal"></div>
    <script>
        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
        });
        const fitAddon = new FitAddon.FitAddon();
        term.loadAddon(fitAddon);
        term.open(document.getElementById('terminal'));
        fitAddon.fit();
        
        const status = document.getElementById('status');
        const ws = new WebSocket(`ws://localhost:3000/terminals/main`);
        
        ws.onopen = () => {
            console.log('Connected to terminal');
            status.textContent = 'Connected';
            status.style.background = 'rgba(0,128,0,0.8)';
        };
        
        ws.onmessage = (e) => term.write(e.data);
        
        ws.onclose = () => {
            console.log('Disconnected from terminal');
            status.textContent = 'Disconnected';
            status.style.background = 'rgba(128,0,0,0.8)';
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            status.textContent = 'Error';
            status.style.background = 'rgba(128,0,0,0.8)';
        };
        
        term.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });
        
        // Handle terminal resize
        window.addEventListener('resize', () => {
            fitAddon.fit();
        });
        
        // Focus terminal on page load
        term.focus();
    </script>
</body>
</html>
```

## Risk Mitigation

### Primary Risks & Mitigation Strategies

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| ttyd connection issues | High | Medium | Fallback to custom Node.js server |
| Claude Code installation fails | High | Medium | Document manual installation steps |
| Container resource issues | Medium | Low | Set conservative resource limits |
| Web terminal performance poor | Medium | Low | Test with different browsers, optimize settings |
| Git operations fail | High | Low | Test thoroughly, provide clear error messages |

### Fallback Options (in order of preference)
1. **ttyd** (primary choice) - Simple and lightweight
2. **Custom Node.js + xterm.js** - Full control over implementation
3. **Gotty fork** - Similar to ttyd with active maintenance
4. **code-server** - Full VS Code experience (heavier but more features)

## Timeline & Milestones

### Week 1: Development (Total: 6 hours)
- **Day 1-2**: Container setup and configuration (2 hours)
- **Day 3**: Testing and validation (1 hour)
- **Day 4**: Performance analysis and documentation (1 hour)
- **Day 5**: Fallback implementation if needed (2 hours)

### Success Gates
- [ ] **Gate 1**: Container builds successfully
- [ ] **Gate 2**: Terminal accessible via web browser
- [ ] **Gate 3**: Claude Code executes in container
- [ ] **Gate 4**: Git operations work correctly
- [ ] **Gate 5**: Performance is acceptable for development use

## Deliverables

### Technical Deliverables
1. **Dockerfile.mvp** - Complete container definition
2. **docker-compose.mvp.yml** - Service orchestration
3. **Configuration files** - Git config, shell setup
4. **Performance baseline** - Resource usage and response times
5. **Test procedures** - Validation checklist

### Documentation Deliverables
1. **Setup instructions** - Step-by-step deployment guide
2. **Issue log** - Problems encountered and solutions
3. **Performance report** - Baseline metrics and observations
4. **Next steps** - Recommendations for full implementation

## Acceptance Criteria

### Must Have
- [ ] Container starts without errors
- [ ] Web terminal accessible at `http://localhost:7681`
- [ ] Can execute basic shell commands
- [ ] Tmux session management works
- [ ] Git operations complete successfully

### Should Have
- [ ] Claude Code CLI accessible and functional
- [ ] Performance meets basic usability standards
- [ ] Clear documentation of any issues
- [ ] Fallback solution documented/implemented

### Nice to Have
- [ ] SSL/TLS configuration (even if self-signed)
- [ ] Custom terminal themes
- [ ] Automated testing scripts
- [ ] Container health monitoring

## Next Steps After MVP

Based on MVP results, the following decisions will be made:

1. **Terminal Emulator Choice**: Confirm ttyd or switch to alternative
2. **Architecture Validation**: Assess if containerized approach is viable
3. **Performance Requirements**: Define resource limits and scaling needs
4. **Security Implementation**: Plan authentication and container isolation
5. **Full Implementation**: Begin Phase 1 of the complete system

## Getting Started

### Prerequisites
- Docker and Docker Compose installed
- Port 7681 available
- Basic understanding of tmux commands

### Quick Start Commands
```bash
# Clone/navigate to project
cd /path/to/afk

# Build and start MVP
docker-compose -f docker-compose.mvp.yml up --build

# Open browser to http://localhost:7681

# Test in terminal:
whoami
pwd
git --version
claude-code --version  # May need configuration
```

### Troubleshooting
- Check container logs: `docker-compose -f docker-compose.mvp.yml logs`
- Restart service: `docker-compose -f docker-compose.mvp.yml restart`
- Clean rebuild: `docker-compose -f docker-compose.mvp.yml down && docker-compose -f docker-compose.mvp.yml up --build`

This MVP plan provides a focused, actionable roadmap for implementing the ttyd-based terminal emulator solution with clear success criteria, risk mitigation, and fallback options. The implementation should take approximately 4-6 hours and will validate the core technical feasibility of the AFK remote Claude Code service.