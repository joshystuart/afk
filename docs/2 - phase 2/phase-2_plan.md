# Phase 2: Server and Web Interface - Implementation Plan

## Overview
Phase 2 builds upon the git-integrated Docker containers from Phase 1 to create a comprehensive web-based management system. This phase introduces a NestJS server that manages Docker containers via the Docker API and provides a React-based web interface for session management.

## Objectives
- Build a NestJS server to manage Docker containers programmatically
- Create REST API endpoints for container lifecycle management
- Develop a React web interface for user interaction
- Implement session persistence and management
- Enable dynamic configuration of git repositories and SSH keys
- Provide real-time status monitoring of sessions

## Prerequisites
- Completed Phase 1 with working git-integrated containers
- Docker API accessible from host system
- Node.js and npm/yarn installed
- Understanding of NestJS and React frameworks
- Docker socket accessible at `/var/run/docker.sock`

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Web Browser                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │         React Web Interface (Port 3000)          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│            NestJS Server (Port 3001)                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │              REST API Layer                      │   │
│  │  - /api/sessions (CRUD operations)              │   │
│  │  - /api/containers (Docker management)          │   │
│  │  - /api/health (Status monitoring)              │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Docker Service Layer                   │   │
│  │  - Container lifecycle management               │   │
│  │  - Port allocation and tracking                 │   │
│  │  - Environment variable injection               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│               Docker Engine                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │     AFK Containers (Phase 1 implementation)      │   │
│  │  - Container 1: ttyd (7681, 7682)               │   │
│  │  - Container 2: ttyd (7683, 7684)               │   │
│  │  - Container N: ttyd (...)                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Implementation Tasks

### Task 1: Initialize NestJS Server Project
**Description:** Create a new NestJS application with necessary dependencies for Docker management.

**Steps:**
1. Create `server` directory in project root
2. Initialize NestJS project with CLI
3. Install required dependencies:
   - `dockerode` for Docker API interaction
   - `@nestjs/config` for configuration management
   - `@nestjs/swagger` for API documentation
   - `class-validator` and `class-transformer` for DTO validation
4. Configure TypeScript and ESLint
5. Set up project structure with modules

**Directory Structure:**
```
server/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── config/
│   │   └── configuration.ts
│   ├── docker/
│   │   ├── docker.module.ts
│   │   ├── docker.service.ts
│   │   └── docker.controller.ts
│   ├── sessions/
│   │   ├── sessions.module.ts
│   │   ├── sessions.service.ts
│   │   ├── sessions.controller.ts
│   │   └── dto/
│   │       ├── create-session.dto.ts
│   │       └── update-session.dto.ts
│   └── common/
│       ├── filters/
│       └── interceptors/
├── test/
├── package.json
└── tsconfig.json
```

**Success Criteria:**
- NestJS server starts successfully
- Basic health check endpoint works
- Project structure is organized and scalable

**Estimated Time:** 3-4 hours

### Task 2: Implement Docker Service Layer
**Description:** Create a service layer to interact with Docker API for container management.

**Steps:**
1. Create `DockerService` class with Dockerode integration
2. Implement container lifecycle methods:
   - `createContainer()` - Launch new AFK container
   - `stopContainer()` - Stop running container
   - `removeContainer()` - Remove stopped container
   - `getContainer()` - Get container details
   - `listContainers()` - List all AFK containers
   - `getContainerLogs()` - Stream container logs
3. Implement port allocation manager:
   - Track used ports
   - Allocate new port pairs (Claude + Manual)
   - Release ports on container stop
4. Add container labeling for identification
5. Implement health checks for containers

**Key Methods:**
```typescript
interface DockerService {
  createContainer(config: ContainerConfig): Promise<Container>;
  stopContainer(containerId: string): Promise<void>;
  removeContainer(containerId: string): Promise<void>;
  getContainer(containerId: string): Promise<ContainerInfo>;
  listContainers(filters?: ContainerFilters): Promise<ContainerInfo[]>;
  getContainerLogs(containerId: string): Promise<string>;
  allocatePorts(): Promise<PortPair>;
  releasePorts(ports: PortPair): Promise<void>;
  executeCommand(containerId: string, command: string[]): Promise<string>;
}
```

**Success Criteria:**
- Can programmatically create AFK containers
- Port allocation works without conflicts
- Container lifecycle is properly managed
- Error handling for Docker API failures

**Estimated Time:** 6-8 hours

### Task 3: Create Session Management System
**Description:** Build a session management layer that tracks container sessions with metadata.

**Steps:**
1. Design session data model:
   ```typescript
   interface Session {
     id: string;
     name: string;
     containerId: string;
     status: 'starting' | 'running' | 'stopped' | 'error';
     config: {
       repoUrl?: string;
       branch?: string;
       gitUserName?: string;
       gitUserEmail?: string;
       hasSSHKey: boolean;
     };
     ports: {
       claude: number;
       manual: number;
     };
     createdAt: Date;
     updatedAt: Date;
     lastAccessedAt?: Date;
   }
   ```
2. Implement in-memory session store (with option for future persistence)
3. Create SessionService methods:
   - `createSession()` - Create new session with container
   - `getSession()` - Retrieve session by ID
   - `listSessions()` - List all sessions with filtering
   - `updateSession()` - Update session metadata
   - `deleteSession()` - Remove session and container
   - `getSessionStats()` - Get usage statistics
4. Add session validation and business rules
5. Implement session timeout and cleanup

**Success Criteria:**
- Sessions are properly tracked
- Session state matches container state
- Cleanup of orphaned sessions works
- Session metadata is maintained accurately

**Estimated Time:** 5-6 hours

### Task 4: Build REST API Controllers
**Description:** Create RESTful API endpoints for client interaction.

**API Endpoints:**
```
POST   /api/sessions                 - Create new session
GET    /api/sessions                 - List all sessions
GET    /api/sessions/:id             - Get session details
PATCH  /api/sessions/:id             - Update session
DELETE /api/sessions/:id             - Delete session
POST   /api/sessions/:id/stop        - Stop session
POST   /api/sessions/:id/restart     - Restart session
GET    /api/sessions/:id/logs        - Get session logs
GET    /api/sessions/:id/health      - Check session health

GET    /api/containers                - List Docker containers
GET    /api/containers/:id/stats     - Get container statistics

GET    /api/health                   - Server health check
GET    /api/config                   - Get server configuration
```

**Steps:**
1. Create SessionsController with CRUD operations
2. Create ContainersController for Docker operations
3. Implement DTOs for request/response validation:
   - CreateSessionDto
   - UpdateSessionDto
   - SessionResponseDto
4. Add Swagger/OpenAPI documentation
5. Implement error handling and HTTP status codes
6. Add request validation pipes
7. Implement rate limiting for API endpoints

**Success Criteria:**
- All endpoints return correct responses
- Validation works for invalid inputs
- Swagger documentation is accurate
- Error responses are consistent

**Estimated Time:** 5-6 hours

### Task 5: Initialize React Web Interface
**Description:** Create a React application for the user interface.

**Steps:**
1. Create `web` directory in project root
2. Initialize React app with TypeScript
3. Install dependencies:
   - `axios` for API calls
   - `react-router-dom` for routing
   - UI framework (Material-UI or Tailwind CSS)
   - `react-hook-form` for form handling
4. Set up project structure:
   ```
   web/
   ├── src/
   │   ├── App.tsx
   │   ├── api/
   │   │   └── client.ts
   │   ├── components/
   │   │   ├── SessionList/
   │   │   ├── SessionCard/
   │   │   ├── CreateSessionForm/
   │   │   └── TerminalLink/
   │   ├── pages/
   │   │   ├── Dashboard.tsx
   │   │   ├── SessionDetails.tsx
   │   │   └── CreateSession.tsx
   │   ├── hooks/
   │   └── utils/
   ├── public/
   └── package.json
   ```
5. Configure API client for backend communication
6. Set up routing structure

**Success Criteria:**
- React app builds and runs
- Basic routing works
- API client can communicate with backend
- Development environment is configured

**Estimated Time:** 3-4 hours

### Task 6: Implement Session Dashboard
**Description:** Create the main dashboard showing all active sessions.

**Features:**
- Grid/List view of sessions
- Session status indicators (color-coded)
- Quick actions (stop, restart, delete)
- Search and filter capabilities
- Real-time status updates
- Session creation button

**Components:**
1. **SessionList Component:**
   - Display sessions in cards or table
   - Show key information (name, repo, status, ports)
   - Action buttons for each session
2. **SessionCard Component:**
   - Visual representation of session
   - Status indicator with color
   - Terminal access links
   - Timestamp information
3. **FilterBar Component:**
   - Filter by status
   - Search by name or repository
   - Sort options

**Success Criteria:**
- Dashboard loads and displays sessions
- Filtering and search work correctly
- Actions trigger appropriate API calls
- UI is responsive and user-friendly

**Estimated Time:** 6-8 hours

### Task 7: Create Session Creation Form
**Description:** Build a comprehensive form for launching new sessions.

**Form Fields:**
1. **Basic Information:**
   - Session name (required)
   - Description (optional)
2. **Git Configuration:**
   - Repository URL (optional)
   - Branch (default: main)
   - Git user name
   - Git user email
3. **SSH Configuration:**
   - SSH private key upload/paste
   - Key validation
4. **Advanced Options:**
   - Terminal mode selection
   - Custom port allocation
   - Environment variables

**Features:**
- Form validation with error messages
- SSH key format validation
- Repository URL validation (HTTPS/SSH)
- Loading state during creation
- Success/error notifications
- Redirect to session details on success

**Success Criteria:**
- Form validates all inputs correctly
- SSH keys are handled securely
- Session creation works end-to-end
- Error handling provides clear feedback

**Estimated Time:** 5-6 hours

### Task 8: Implement Session Details Page
**Description:** Create a detailed view for individual sessions.

**Features:**
1. **Session Information Panel:**
   - All session metadata
   - Container statistics
   - Creation and last access times
2. **Terminal Access Section:**
   - Direct links to Claude terminal
   - Direct links to Manual terminal
   - Embedded iframe option
3. **Configuration Display:**
   - Current git configuration
   - Environment variables
   - Port mappings
4. **Actions Panel:**
   - Stop/Start session
   - Restart container
   - Download logs
   - Delete session
5. **Real-time Logs Viewer:**
   - Stream container logs
   - Filter by log level
   - Search within logs

**Success Criteria:**
- All session information is displayed
- Terminal links work correctly
- Actions update session state
- Logs stream in real-time

**Estimated Time:** 6-7 hours

### Task 9: Add WebSocket Support for Real-time Updates
**Description:** Implement WebSocket connections for real-time session status updates.

**Steps:**
1. Add WebSocket gateway to NestJS server
2. Implement events:
   - Session status changes
   - Container health updates
   - Log streaming
3. Create WebSocket client in React
4. Update components to use real-time data
5. Handle connection failures and reconnection

**WebSocket Events:**
```typescript
// Server → Client
'session.created'
'session.updated'
'session.deleted'
'session.status.changed'
'container.health'
'logs.stream'

// Client → Server
'subscribe.session'
'unsubscribe.session'
'subscribe.logs'
```

**Success Criteria:**
- Status updates appear without refresh
- WebSocket connection is stable
- Reconnection logic works
- Performance is not impacted

**Estimated Time:** 5-6 hours

### Task 10: Implement Authentication and Authorization
**Description:** Add basic authentication to secure the application.

**Steps:**
1. Implement simple authentication (can be basic auth initially)
2. Add JWT token generation and validation
3. Protect API endpoints with guards
4. Add login page to React app
5. Implement session management in frontend
6. Add user context and protected routes

**Security Measures:**
- Password hashing with bcrypt
- JWT token expiration
- Rate limiting on login attempts
- Secure cookie storage
- CORS configuration

**Success Criteria:**
- Users must authenticate to access app
- JWT tokens work correctly
- Protected routes redirect to login
- Session persistence works

**Estimated Time:** 6-8 hours

### Task 11: Add Error Handling and Monitoring
**Description:** Implement comprehensive error handling and monitoring.

**Steps:**
1. Add global exception filters in NestJS
2. Implement logging service with levels
3. Add request/response interceptors
4. Create error boundary in React
5. Add client-side error reporting
6. Implement health check endpoints
7. Add performance monitoring

**Monitoring Features:**
- Request/response logging
- Error tracking with stack traces
- Performance metrics
- Container resource usage
- Active session counts

**Success Criteria:**
- Errors are logged properly
- Client errors are handled gracefully
- Health checks report accurate status
- Performance metrics are collected

**Estimated Time:** 4-5 hours

### Task 12: Create Docker Compose for Full Stack
**Description:** Create a unified Docker Compose configuration for the entire application.

**Components:**
1. NestJS server container
2. React web app (nginx)
3. Network configuration
4. Volume mounts
5. Environment configuration

**docker-compose.yml Structure:**
```yaml
services:
  server:
    build: ./server
    ports:
      - "3001:3001"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - NODE_ENV=production
      
  web:
    build: ./web
    ports:
      - "3000:80"
    depends_on:
      - server
      
  # Optional: Add reverse proxy
  nginx:
    image: nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

**Success Criteria:**
- Full stack runs with single command
- Services communicate correctly
- Configuration is externalized
- Logs are accessible

**Estimated Time:** 3-4 hours

## Testing Plan

### Unit Tests
1. **Server Tests:**
   - DockerService methods
   - SessionService business logic
   - Controller endpoint validation
   - DTO validation
   
2. **Frontend Tests:**
   - Component rendering
   - Form validation
   - API client methods
   - State management

### Integration Tests
1. **API Tests:**
   - End-to-end session creation
   - Container lifecycle management
   - Error scenarios
   
2. **UI Tests:**
   - User flow for creating session
   - Dashboard functionality
   - Real-time updates

### End-to-End Tests
1. Create session with git repository
2. Access terminal interfaces
3. Stop and restart sessions
4. Delete sessions and verify cleanup
5. Handle multiple concurrent sessions

## Success Criteria for Phase 2

1. **Functionality:**
   - Users can create sessions via web interface
   - Sessions are properly managed and tracked
   - Terminal access works through web links
   - Real-time status updates function correctly

2. **Performance:**
   - Dashboard loads within 2 seconds
   - Session creation completes within 10 seconds
   - Can handle 10+ concurrent sessions

3. **Reliability:**
   - Server handles Docker API failures gracefully
   - Sessions persist across server restarts
   - Automatic cleanup of orphaned containers

4. **Usability:**
   - Intuitive user interface
   - Clear error messages
   - Responsive design for mobile access
   - Comprehensive session information

5. **Security:**
   - Authentication protects all endpoints
   - SSH keys are handled securely
   - No sensitive data in logs
   - CORS properly configured

## Risk Mitigation

1. **Docker API Access:**
   - Ensure proper permissions for Docker socket
   - Handle Docker daemon unavailability
   - Implement retry logic for transient failures

2. **Port Conflicts:**
   - Implement intelligent port allocation
   - Check port availability before allocation
   - Handle port exhaustion scenarios

3. **Resource Management:**
   - Limit maximum concurrent sessions
   - Implement container resource limits
   - Monitor and alert on high resource usage

4. **Data Persistence:**
   - Initially use in-memory storage
   - Plan for database integration in future
   - Implement data export/import functionality

## Dependencies
- Docker Engine with API access
- Node.js 18+ and npm
- NestJS framework
- React 18+
- Dockerode library
- TypeScript

## Timeline Estimate
- Total estimated time: 70-90 hours
- Suggested timeline: 3-4 weeks with full-time effort
- Can be parallelized with 2 developers (backend/frontend)

## Deliverables
1. NestJS server application
2. React web interface
3. Docker Compose configuration
4. API documentation (Swagger)
5. User documentation
6. Deployment guide

## Next Steps
After Phase 2 completion, the system will be ready for Phase 3 (Production Infrastructure) which will focus on:
- AWS deployment using CDK
- Scalability improvements
- Multi-user support
- Persistent storage
- Monitoring and alerting
- CI/CD pipeline

## Appendix: Technology Decisions

### Why NestJS?
- Enterprise-grade Node.js framework
- Built-in support for TypeScript
- Modular architecture
- Excellent Docker integration
- WebSocket support out of the box

### Why React?
- Component-based architecture
- Large ecosystem
- Good TypeScript support
- Real-time update capabilities
- Wide developer adoption

### Alternative Considerations
- **Backend:** Express.js, Fastify, Hono
- **Frontend:** Vue.js, Angular, Svelte
- **Real-time:** Socket.io vs native WebSockets
- **UI Framework:** Material-UI vs Tailwind CSS vs Ant Design