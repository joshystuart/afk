# Remote Claude Code Service - Implementation Plan

## Project Overview

Build a remote Claude Code service that launches Docker containers with dual terminal sessions (Claude + manual access), automatic git integration, and web-based terminal access.

## Technology Stack

- **Backend**: NestJS (TypeScript)
- **Terminal Emulator**: Wetty (for SSL support)
- **Container Runtime**: Docker
- **Frontend**: React (with TypeScript)
- **Database**: PostgreSQL (for session management)
- **Message Queue**: Redis (for real-time updates)
- **Reverse Proxy**: Nginx (for SSL termination and routing)

## Phase 0: MVP - Proof of Concept

### Objective

Create a minimal working prototype to validate the core concept: running Claude Code in a Docker container with web-based terminal access.

### Terminal Emulator Options

Since Wetty is having connection issues, here are alternative approaches:

#### Option 1: ttyd (Recommended for MVP)

- **Pros**: Simple, lightweight, no SSH required, works directly with shell
- **Cons**: No built-in SSL (but we can add it with nginx)
- **Docker Image**: `tsl0922/ttyd:latest`

#### Option 2: code-server (VS Code in browser)

- **Pros**: Full IDE experience, built-in terminal, familiar interface
- **Cons**: Heavier resource usage, more complex than needed
- **Docker Image**: `codercom/code-server:latest`

#### Option 3: Gotty/GoTTY

- **Pros**: Very lightweight, simple configuration
- **Cons**: Original project abandoned (but forks exist)
- **Docker Image**: `gotty/gotty:latest`

#### Option 4: xterm.js + custom Node.js server

- **Pros**: Maximum control, can customize everything
- **Cons**: More development work required
- **Implementation**: Build our own simple terminal server

### MVP Implementation with ttyd (Recommended)

### Success Criteria

- Successfully run Claude Code in a containerized environment
- Access Claude Code session via web browser
- Ability to run multiple terminal sessions (Claude + manual access)
- Verify git operations work properly in the container
- Test resource constraints and performance

### Steps

1. **Create Dockerfile with ttyd**

   ```dockerfile
   # Dockerfile.docker
   FROM ubuntu:22.04

   # Avoid prompts from apt
   ENV DEBIAN_FRONTEND=noninteractive

   # Install basic tools and ttyd
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

   # Install ttyd
   RUN wget https://github.com/tsl0922/ttyd/releases/download/1.7.4/ttyd.x86_64 -O /usr/local/bin/ttyd && \
       chmod +x /usr/local/bin/ttyd

   # Install Claude Code CLI (adjust based on actual installation method)
   RUN curl -fsSL https://claude.ai/install.sh | sh || \
       echo "Claude Code installation needs to be configured"

   # Create developer user
   RUN useradd -m -s /bin/bash developer && \
       echo "developer:developer" | chpasswd && \
       usermod -aG sudo developer && \
       echo "developer ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

   # Create working directory
   RUN mkdir -p /workspace && chown developer:developer /workspace

   # Switch to developer user
   USER developer
   WORKDIR /workspace

   # Set up bashrc for better experience
   RUN echo 'export PS1="\[\033[01;32m\]\u@claude-code\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ "' >> ~/.bashrc && \
       echo 'alias ll="ls -la"' >> ~/.bashrc

   EXPOSE 7681

   # Start ttyd with tmux as the default shell
   CMD ["ttyd", "-p", "7681", "-W", "-d", "5", "tmux", "new", "-s", "main"]
   ```

2. **Create Docker Compose for MVP**

   ```yaml
   # docker-compose.docker.yml
   version: '3.8'

   services:
     claude-ttyd:
       build:
         context: .
         dockerfile: Dockerfile.docker
       ports:
         - '7681:7681' # ttyd web interface
       volumes:
         - ./workspace:/workspace
       environment:
         - TERM=xterm-256color
       # Resource limits for testing
       deploy:
         resources:
           limits:
             memory: 2G
             cpus: '2'
   ```

3. **Alternative: Simple Node.js Terminal Server**

   If ttyd also has issues, here's a minimal custom solution:

   ```javascript
   // server.js - Minimal terminal server
   const express = require('express');
   const expressWs = require('express-ws');
   const pty = require('node-pty');
   const app = express();
   expressWs(app);

   app.use(express.static('public'));

   const terminals = {};

   app.ws('/terminals/:id', (ws, req) => {
     const id = req.params.id;

     if (!terminals[id]) {
       terminals[id] = pty.spawn('bash', [], {
         name: 'xterm-color',
         cols: 80,
         rows: 30,
         cwd: '/workspace',
         env: process.env,
       });

       terminals[id].on('data', (data) => {
         ws.send(data);
       });
     }

     ws.on('message', (msg) => {
       terminals[id].write(msg);
     });

     ws.on('close', () => {
       terminals[id].kill();
       delete terminals[id];
     });
   });

   app.listen(3000, () => {
     console.log('Terminal server running on :3000');
   });
   ```

   ```dockerfile
   # Dockerfile.custom
   FROM node:18

   WORKDIR /app

   # Install system dependencies
   RUN apt-get update && apt-get install -y \
       git tmux vim build-essential python3 sudo

   # Install node dependencies
   COPY package.json .
   RUN npm install express express-ws node-pty

   # Install Claude Code
   RUN curl -fsSL https://claude.ai/install.sh | sh || echo "Configure Claude Code"

   # Create user
   RUN useradd -m developer && \
       usermod -aG sudo developer && \
       echo "developer ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

   COPY server.js .
   COPY public ./public

   USER developer
   CMD ["node", "server.js"]
   ```

4. **Create Test Interface**

   ```html
   <!-- public/index.html -->
   <!DOCTYPE html>
   <html>
     <head>
       <title>Claude Code Remote</title>
       <link
         rel="stylesheet"
         href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css"
       />
       <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js"></script>
       <script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
       <style>
         body {
           margin: 0;
           background: #1e1e1e;
         }
         #terminal {
           height: 100vh;
         }
       </style>
     </head>
     <body>
       <div id="terminal"></div>
       <script>
         const term = new Terminal();
         const fitAddon = new FitAddon.FitAddon();
         term.loadAddon(fitAddon);
         term.open(document.getElementById('terminal'));
         fitAddon.fit();

         const ws = new WebSocket(`ws://localhost:3000/terminals/main`);
         ws.onopen = () => console.log('Connected');
         ws.onmessage = (e) => term.write(e.data);
         term.onData((data) => ws.send(data));

         window.addEventListener('resize', () => fitAddon.fit());
       </script>
     </body>
   </html>
   ```

5. **Run and Test MVP**

   ```bash
   # Using ttyd approach:
   docker-compose -f docker-compose.docker.yml up --build

   # Open browser to http://localhost:7681
   # No login required with ttyd!

   # In the terminal:
   # 1. You'll be in tmux automatically
   # 2. Create new windows with Ctrl+B, C
   # 3. Switch between windows with Ctrl+B, 0-9
   # 4. Split panes with Ctrl+B, % (vertical) or Ctrl+B, " (horizontal)

   # Test Claude Code
   claude-code --version

   # Create test project
   cd /workspace
   git init test-project
   cd test-project
   claude-code
   ```

6. **Alternative Terminal Emulators to Try**

   If ttyd doesn't work, try these in order:

   a) **Gotty** (fork maintained by sorenisanerd):

   ```dockerfile
   RUN wget https://github.com/sorenisanerd/gotty/releases/download/v1.5.0/gotty_v1.5.0_linux_amd64.tar.gz && \
       tar -xzf gotty_v1.5.0_linux_amd64.tar.gz && \
       mv gotty /usr/local/bin/
   ```

   b) **webssh2**:

   ```dockerfile
   RUN npm install -g webssh2
   # Requires SSH server setup
   ```

   c) **Shell In A Box**:

   ```dockerfile
   RUN apt-get install -y shellinabox
   ```

### MVP Deliverables

1. Working Docker container with Claude Code + web terminal
2. Browser-accessible terminal (no SSH complexity)
3. Verified tmux-based session management
4. List of any issues encountered
5. Performance baseline

### Decision Points After MVP

- Which terminal emulator works best?
- Is performance acceptable?
- Do we need custom authentication?
- What additional features are needed?

### Time Estimate

- Setup: 1-2 hours
- Testing alternatives if needed: 1-2 hours
- Validation: 1 hour
- **Total: 3-5 hours**

## Phase 1: Core Infrastructure & Docker Container Setup

### Objective

Create the Docker container environment with Claude Code, development tools, and Wetty terminal emulator.

### Steps

1. **Create Base Dockerfile**
   - Base image: Ubuntu 22.04 or Alpine
   - Install Node.js, Git, build essentials
   - Install Claude Code CLI
   - Install Wetty
   - Add non-root user for security

2. **Create Wetty Configuration**
   - Configure Wetty for dual terminal sessions
   - Set up authentication mechanism
   - Configure SSL/TLS settings
   - Create startup scripts for both terminals

3. **Create Git Integration Scripts**
   - File watcher using `chokidar` or `inotify`
   - Auto-commit script with intelligent batching
   - Commit message generator based on changes
   - Push hooks with retry logic

4. **Create Container Entry Point**
   - Initialize git repository
   - Configure git credentials
   - Start Wetty instances
   - Launch file watchers
   - Health check endpoint

5. **Test Container Locally**
   - Build and run container
   - Verify Claude Code functionality
   - Test git operations
   - Validate Wetty access

## Phase 2: NestJS Session Manager

### Objective

Build the core session management service that handles container lifecycle, user management, and API endpoints.

### Steps

1. **Initialize NestJS Project**

   ```bash
   nest new claude-code-remote
   npm install @nestjs/config @nestjs/typeorm typeorm pg
   npm install @nestjs/passport passport passport-jwt
   npm install dockerode @types/dockerode
   npm install bull @nestjs/bull
   ```

2. **Create Core Modules**
   - `AuthModule`: JWT authentication, user management
   - `SessionModule`: Session lifecycle management
   - `ContainerModule`: Docker container operations
   - `GitModule`: Repository management
   - `WebSocketModule`: Real-time updates

3. **Implement Container Service**

   ```typescript
   // container.service.ts
   interface ContainerConfig {
     userId: string;
     sessionId: string;
     repoUrl: string;
     branch?: string;
     resources: {
       memory: string;
       cpuShares: number;
     };
   }
   ```

   - Container creation with resource limits
   - Container monitoring and health checks
   - Container cleanup on timeout
   - Network isolation per user

4. **Implement Session Service**

   ```typescript
   // session.service.ts
   interface Session {
     id: string;
     userId: string;
     containerId: string;
     status: 'pending' | 'running' | 'stopped';
     repoUrl: string;
     createdAt: Date;
     lastActivity: Date;
     terminals: {
       claude: { port: number; token: string };
       manual: { port: number; token: string };
     };
   }
   ```

   - Session creation and tracking
   - Session timeout management
   - Activity monitoring
   - Resource usage tracking

5. **Create API Endpoints**
   - `POST /sessions`: Create new session
   - `GET /sessions`: List user sessions
   - `GET /sessions/:id`: Get session details
   - `DELETE /sessions/:id`: Terminate session
   - `POST /sessions/:id/commit`: Trigger manual commit
   - `GET /sessions/:id/logs`: Get container logs

6. **Implement Database Models**
   - User entity
   - Session entity
   - Activity log entity
   - Resource usage entity

## Phase 3: Security & Authentication Layer

### Objective

Implement robust security measures for container isolation, user authentication, and secure terminal access.

### Steps

1. **Implement Authentication System**
   - JWT token generation and validation
   - Refresh token mechanism
   - Session token for terminal access
   - Rate limiting per user

2. **Container Security**
   - User namespace mapping
   - Seccomp profiles
   - AppArmor/SELinux policies
   - Network policies (no external access except git)
   - Read-only root filesystem with specific write mounts

3. **Git Credential Management**
   - Encrypted credential storage
   - SSH key generation per session
   - Deploy key management for repositories
   - Credential cleanup on session end

4. **Terminal Security**
   - Unique tokens per terminal session
   - SSL/TLS for all connections
   - Input sanitization
   - Command logging for audit

5. **API Security**
   - CORS configuration
   - Helmet.js for security headers
   - Input validation with class-validator
   - SQL injection prevention

## Phase 4: Frontend Web Interface

### Objective

Create a React-based frontend for managing sessions and accessing terminals.

### Steps

1. **Initialize React Project**

   ```bash
   npx create-react-app frontend --template typescript
   npm install xterm xterm-addon-fit xterm-addon-web-links
   npm install @mui/material @emotion/react
   npm install react-router-dom axios
   ```

2. **Create Core Components**
   - `SessionList`: Display active sessions
   - `SessionCreate`: Form to create new session
   - `TerminalView`: Dual terminal display
   - `ActivityLog`: Show git commits and activities
   - `ResourceMonitor`: CPU/Memory usage display

3. **Implement Terminal Integration**
   - Xterm.js for terminal rendering
   - WebSocket connection to Wetty
   - Terminal resize handling
   - Copy/paste functionality
   - Terminal themes

4. **Create Session Management UI**
   - Session creation wizard
   - Repository URL input with validation
   - Resource allocation controls
   - Session status indicators
   - Quick actions (stop, restart, commit)

5. **Build Real-time Updates**
   - WebSocket connection for live updates
   - Git activity notifications
   - Resource usage graphs
   - Terminal connection status

## Phase 5: Auto-commit System

### Objective

Implement intelligent auto-commit functionality with meaningful commit messages.

### Steps

1. **Create File Watcher Service**

   ```typescript
   // watcher.service.ts
   interface FileChange {
     type: 'add' | 'modify' | 'delete';
     path: string;
     timestamp: Date;
     size: number;
   }
   ```

   - Watch for file changes using chokidar
   - Ignore patterns (.git, node_modules, etc.)
   - Batch changes intelligently
   - Debounce rapid changes

2. **Implement Commit Strategy**
   - Time-based batching (e.g., every 5 minutes)
   - Change-based batching (e.g., after 10 files)
   - Semantic grouping (group related files)
   - Major milestone detection

3. **Create Commit Message Generator**
   - Analyze file changes for context
   - Use conventional commit format
   - Include file statistics
   - Add Claude Code context if available

4. **Build Push Management**
   - Automatic push after commits
   - Retry logic for failed pushes
   - Conflict detection and alerting
   - Branch protection awareness

5. **Add Manual Controls**
   - API endpoint for manual commit
   - Commit message customization
   - Push enable/disable toggle
   - Commit history viewer

## Phase 6: Integration & Orchestration

### Objective

Integrate all components into a cohesive system with proper orchestration.

### Steps

1. **Create Docker Compose Setup**

   ```yaml
   # docker-compose.yml
   services:
     app:
       build: .
     postgres:
       image: postgres:15
     redis:
       image: redis:7
     nginx:
       image: nginx:alpine
   ```

2. **Implement Service Discovery**
   - Dynamic port allocation for containers
   - Service registration in Redis
   - Health check coordination
   - Load balancing for multiple instances

3. **Create Nginx Configuration**
   - SSL termination
   - WebSocket proxy for terminals
   - API route proxying
   - Static file serving for frontend

4. **Build Monitoring System**
   - Prometheus metrics export
   - Container resource monitoring
   - API performance tracking
   - Error logging and alerting

5. **Implement Cleanup Jobs**
   - Abandoned session cleanup
   - Old container removal
   - Log rotation
   - Temporary file cleanup

## Phase 7: Testing & Deployment

### Objective

Comprehensive testing and production deployment setup.

### Steps

1. **Unit Testing**
   - Container service tests
   - Session management tests
   - Git integration tests
   - Security policy tests

2. **Integration Testing**
   - End-to-end session creation
   - Terminal connection tests
   - Auto-commit functionality
   - Multi-user scenarios

3. **Load Testing**
   - Concurrent session limits
   - Resource consumption patterns
   - WebSocket connection limits
   - Database performance

4. **Create Deployment Scripts**
   - Kubernetes manifests
   - Helm charts
   - CI/CD pipeline (GitHub Actions)
   - Environment configuration

5. **Documentation**
   - API documentation with Swagger
   - User guide
   - Administrator guide
   - Security best practices

## Phase 8: Advanced Features (Optional)

### Objective

Add advanced features for better usability and management.

### Steps

1. **Collaborative Features**
   - Shared terminal sessions
   - Real-time cursor tracking
   - Chat integration
   - Code review mode

2. **Template System**
   - Pre-configured environments
   - Custom Docker images
   - Starter repositories
   - Tool presets

3. **Analytics Dashboard**
   - Usage statistics
   - Popular repositories
   - Error tracking
   - Performance metrics

4. **Backup & Recovery**
   - Session state backup
   - Work recovery after crash
   - Repository snapshots
   - Configuration backup

5. **Integration Extensions**
   - GitHub/GitLab webhooks
   - Slack notifications
   - CI/CD triggers
   - IDE plugins

## Implementation Notes

### Security Considerations

- Always run containers with minimal privileges
- Implement resource quotas per user
- Regular security audits
- Keep all dependencies updated

### Performance Optimization

- Use container image caching
- Implement connection pooling
- Optimize database queries
- Use CDN for static assets

### Scalability Planning

- Design for horizontal scaling
- Use message queues for async operations
- Implement caching strategies
- Plan for multi-region deployment

## Getting Started Commands

```bash
# Initialize the project
mkdir claude-code-remote && cd claude-code-remote

# Create project structure
mkdir -p packages/{backend,frontend,container,shared}

# Initialize backend
cd packages/backend
nest new . --package-manager npm

# Initialize frontend
cd ../frontend
npx create-react-app . --template typescript

# Create container package
cd ../container
npm init -y

# Create shared types
cd ../shared
npm init -y
```

This plan provides a comprehensive roadmap for building your remote Claude Code service. Each phase builds upon the previous one, allowing for incremental development and testing. The modular approach ensures that each component can be developed and tested independently before integration.
