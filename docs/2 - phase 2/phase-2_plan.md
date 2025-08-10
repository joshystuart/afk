# Phase 2: Server and Web Interface - Implementation Plan

## Overview

Phase 2 builds upon the git-integrated Docker containers from Phase 1 to create a comprehensive web-based management system. This phase introduces a NestJS server using enterprise-grade patterns (EBI architecture) that manages Docker containers via the Docker API and provides a React-based web interface for session management.

## Objectives

- Build a NestJS server using EBI (Entity-Boundary-Interactor) pattern
- Implement typed configuration and domain-driven design
- Create REST API endpoints with standardized responses
- Develop a React web interface for user interaction
- Implement session persistence with repository pattern
- Enable dynamic configuration of git repositories and SSH keys
- Provide real-time status monitoring via WebSockets
- Ensure enterprise-grade error handling and monitoring

## Prerequisites

- Completed Phase 1 with working git-integrated containers
- Docker API accessible from host system
- Node.js 18+ and npm/yarn installed
- Understanding of NestJS, EBI pattern, and React frameworks
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
│  │     Controllers (Boundary Layer)                 │   │
│  │  - Session Controllers                          │   │
│  │  - Container Controllers                        │   │
│  │  - Health Controllers                           │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │     Interactors (Business Logic Layer)          │   │
│  │  - CreateSessionInteractor                      │   │
│  │  - ManageContainerInteractor                    │   │
│  │  - SessionLifecycleInteractor                   │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │     Services & Repositories (Data Layer)        │   │
│  │  - DockerEngineService                          │   │
│  │  - SessionRepository                            │   │
│  │  - PortManagerService                           │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │     WebSocket Gateway                           │   │
│  │  - Session status updates                       │   │
│  │  - Log streaming                                │   │
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

### Task 1: Initialize NestJS Server with EBI Architecture

**Description:** Create a new NestJS application with enterprise-grade architecture using EBI pattern and typed configuration.

**Steps:**

1. Create `server` directory in project root
2. Initialize NestJS project with CLI
3. Install required dependencies:

   ```json
   {
     "dependencies": {
       "@nestjs/common": "^10.0.0",
       "@nestjs/core": "^10.0.0",
       "@nestjs/platform-express": "^10.0.0",
       "@nestjs/swagger": "^7.0.0",
       "@nestjs/terminus": "^10.0.0",
       "@nestjs/websockets": "^10.0.0",
       "@nestjs/platform-socket.io": "^10.0.0",
       "nest-typed-config": "^2.9.0",
       "dockerode": "^4.0.0",
       "class-validator": "^0.14.0",
       "class-transformer": "^0.5.1",
       "pino": "^8.0.0",
       "nestjs-pino": "^3.0.0",

       "uuid": "^9.0.0"
     },
     "devDependencies": {
       "@types/dockerode": "^3.3.0",
       "jest": "^29.0.0",
       "@types/jest": "^29.0.0"
     }
   }
   ```

4. Configure TypeScript with strict mode
5. Set up EBI-based project structure

**Directory Structure:**

```
server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── libs/
│   │   ├── app-factory/
│   │   │   └── application.factory.ts
│   │   ├── config/
│   │   │   ├── app.config.ts
│   │   │   ├── docker.config.ts
│   │   │   ├── session.config.ts
│   │   │   └── logger.config.ts
│   │   ├── logger/
│   │   │   ├── logger.module.ts
│   │   │   └── logger.service.ts
│   │   ├── common/
│   │   │   ├── filters/
│   │   │   │   └── http-exception.filter.ts
│   │   │   ├── interceptors/
│   │   │   │   └── response.interceptor.ts
│   │   │   └── decorators/
│   │   └── response/
│   │       └── response.service.ts
│   ├── interactors/
│   │   ├── sessions/
│   │   │   ├── create-session/
│   │   │   │   ├── create-session.controller.ts
│   │   │   │   ├── create-session.interactor.ts
│   │   │   │   ├── create-session-request.dto.ts
│   │   │   │   └── create-session-response.dto.ts
│   │   │   ├── list-sessions/
│   │   │   ├── update-session/
│   │   │   ├── delete-session/
│   │   │   └── sessions.module.ts
│   │   └── containers/
│   │       ├── manage-container/
│   │       └── containers.module.ts
│   ├── domain/
│   │   ├── sessions/
│   │   │   ├── session.entity.ts
│   │   │   ├── session.factory.ts
│   │   │   ├── session-id.dto.ts
│   │   │   ├── session-id-dto.factory.ts
│   │   │   ├── session-status.enum.ts
│   │   │   ├── session-config.dto.ts
│   │   │   └── session-config-dto.factory.ts
│   │   └── containers/
│   │       ├── container.entity.ts
│   │       ├── port-pair.dto.ts
│   │       └── port-pair-dto.factory.ts
│   ├── services/
│   │   ├── docker/
│   │   │   ├── docker-engine.service.ts
│   │   │   ├── port-manager.service.ts
│   │   │   └── docker.module.ts
│   │   └── repositories/
│   │       ├── session.repository.ts
│   │       └── repositories.module.ts
│   ├── gateways/
│   │   ├── session.gateway.ts
│   │   ├── session-subscription.service.ts
│   │   └── gateways.module.ts
│   └── health/
│       ├── health.controller.ts
│       ├── docker-health.indicator.ts
│       └── health.module.ts
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
├── .env.example
└── nest-cli.json
```

**Application Factory Implementation:**

```typescript
// src/libs/app-factory/application.factory.ts
export class ApplicationFactory {
  static configure(app: INestApplication): INestApplication {
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.enableCors();
    app.setGlobalPrefix('api');

    return app;
  }
}
```

**Success Criteria:**

- NestJS server starts with typed configuration
- EBI architecture is properly implemented
- Logging infrastructure works
- Health check endpoint responds

**Estimated Time:** 6-8 hours

### Task 2: Implement Typed Configuration System

**Description:** Create a comprehensive typed configuration system using nest-typed-config.

**Configuration Classes:**

```typescript
// src/libs/config/app.config.ts
export class AppConfig {
  @IsNumber()
  @Type(() => Number)
  public readonly port!: number;

  @IsString()
  public readonly env!: string;

  @ValidateNested()
  @Type(() => DockerConfig)
  public readonly docker!: DockerConfig;

  @ValidateNested()
  @Type(() => SessionConfig)
  public readonly session!: SessionConfig;

  @ValidateNested()
  @Type(() => LoggerConfig)
  public readonly logger!: LoggerConfig;
}

// src/libs/config/docker.config.ts
export class DockerConfig {
  @IsString()
  public readonly socketPath!: string;

  @IsString()
  public readonly imageName!: string;

  @IsNumber()
  public readonly startPort!: number;

  @IsNumber()
  public readonly endPort!: number;

  @IsNumber()
  public readonly maxContainers!: number;
}

// src/libs/config/session.config.ts
export class SessionConfig {
  @IsNumber()
  public readonly maxSessionsPerUser!: number;

  @IsNumber()
  public readonly sessionTimeoutMinutes!: number;

  @IsNumber()
  public readonly cleanupIntervalMinutes!: number;
}
```

**Module Setup:**

```typescript
// src/app.module.ts
@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: AppConfig,
      load: fileLoader({
        basename: true,
        searchFrom: process.cwd(),
      }),
    }),
    LoggerModule.forRootAsync(),
    DockerModule,
    SessionsModule,
    ContainersModule,
    HealthModule,
    GatewaysModule,
  ],
})
export class AppModule {}
```

**Success Criteria:**

- Configuration loads from environment and yaml files
- Type validation works at startup
- Configuration is injectable throughout app

**Estimated Time:** 4-5 hours

### Task 3: Implement Domain Models with DDD

**Description:** Create domain entities and value objects following Domain-Driven Design principles.

**Domain Entities:**

```typescript
// src/domain/sessions/session.entity.ts
export class Session {
  constructor(
    public readonly id: SessionIdDto,
    public readonly name: string,
    public readonly config: SessionConfigDto,
    public status: SessionStatus,
    public readonly containerId: string | null,
    public readonly ports: PortPairDto | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public lastAccessedAt: Date | null,
  ) {}

  assignContainer(containerId: string, ports: PortPairDto): void {
    this.containerId = containerId;
    this.ports = ports;
    this.status = SessionStatus.STARTING;
    this.updatedAt = new Date();
  }

  markAsRunning(): void {
    if (this.status !== SessionStatus.STARTING) {
      throw new Error('Can only mark as running from starting state');
    }
    this.status = SessionStatus.RUNNING;
    this.updatedAt = new Date();
  }

  markAsAccessed(): void {
    this.lastAccessedAt = new Date();
  }

  stop(): void {
    this.status = SessionStatus.STOPPED;
    this.updatedAt = new Date();
  }

  canBeDeleted(): boolean {
    return [SessionStatus.STOPPED, SessionStatus.ERROR].includes(this.status);
  }
}

// src/domain/sessions/session.factory.ts
@Injectable()
export class SessionFactory {
  constructor(private readonly sessionIdFactory: SessionIdDtoFactory) {}

  create(name: string, config: SessionConfigDto): Session {
    return new Session(
      this.sessionIdFactory.generate(),
      name,
      config,
      SessionStatus.INITIALIZING,
      null,
      null,
      new Date(),
      new Date(),
      null,
    );
  }

  fromData(data: {
    id: string;
    name: string;
    config: SessionConfigDto;
    status: SessionStatus;
    containerId?: string;
    ports?: PortPairDto;
    createdAt: Date;
    updatedAt: Date;
    lastAccessedAt?: Date;
  }): Session {
    return new Session(
      this.sessionIdFactory.fromString(data.id),
      data.name,
      data.config,
      data.status,
      data.containerId || null,
      data.ports || null,
      data.createdAt,
      data.updatedAt,
      data.lastAccessedAt || null,
    );
  }
}

// src/domain/sessions/session-id.dto.ts
export class SessionIdDto {
  constructor(private readonly value: string) {
    if (!value || !this.isValidUuid(value)) {
      throw new Error('Invalid session ID');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: SessionIdDto): boolean {
    return this.value === other.value;
  }

  private isValidUuid(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}

// src/domain/sessions/session-id-dto.factory.ts
@Injectable()
export class SessionIdDtoFactory {
  generate(): SessionIdDto {
    return new SessionIdDto(uuid.v4());
  }

  fromString(value: string): SessionIdDto {
    return new SessionIdDto(value);
  }
}

// src/domain/sessions/session-config.dto.ts
export class SessionConfigDto {
  constructor(
    public readonly repoUrl: string | null,
    public readonly branch: string,
    public readonly gitUserName: string,
    public readonly gitUserEmail: string,
    public readonly hasSSHKey: boolean,
    public readonly terminalMode: TerminalMode,
  ) {}
}

// src/domain/sessions/session-config-dto.factory.ts
@Injectable()
export class SessionConfigDtoFactory {
  createDefault(): SessionConfigDto {
    return new SessionConfigDto(
      null,
      'main',
      'Claude User',
      'claude@example.com',
      false,
      TerminalMode.SIMPLE,
    );
  }

  create(params: Partial<SessionConfigDto>): SessionConfigDto {
    return new SessionConfigDto(
      params.repoUrl ?? null,
      params.branch ?? 'main',
      params.gitUserName ?? 'Claude User',
      params.gitUserEmail ?? 'claude@example.com',
      params.hasSSHKey ?? false,
      params.terminalMode ?? TerminalMode.SIMPLE,
    );
  }
}

// src/domain/containers/port-pair.dto.ts
export class PortPairDto {
  constructor(
    public readonly claudePort: number,
    public readonly manualPort: number,
  ) {
    this.validatePort(claudePort);
    this.validatePort(manualPort);
    if (claudePort === manualPort) {
      throw new Error('Claude and manual ports must be different');
    }
  }

  private validatePort(port: number): void {
    if (port < 1024 || port > 65535) {
      throw new Error(`Invalid port number: ${port}`);
    }
  }

  toJSON() {
    return {
      claude: this.claudePort,
      manual: this.manualPort,
    };
  }
}

// src/domain/containers/port-pair-dto.factory.ts
@Injectable()
export class PortPairDtoFactory {
  create(claudePort: number, manualPort: number): PortPairDto {
    return new PortPairDto(claudePort, manualPort);
  }
}
```

**Success Criteria:**

- Domain models encapsulate business rules
- DTOs ensure data integrity and type safety
- Entities have clear lifecycle methods
- Factories handle object creation with dependency injection
- Static methods are avoided in favor of DI

**Estimated Time:** 5-6 hours

### Task 4: Implement Service Layer with Separation of Concerns

**Description:** Create service layer with proper separation between Docker operations, port management, and repositories.

**Docker Engine Service:**

```typescript
// src/services/docker/docker-engine.service.ts
@Injectable()
export class DockerEngineService {
  private docker: Dockerode;

  constructor(
    private readonly config: DockerConfig,
    private readonly logger: Logger,
  ) {
    this.docker = new Dockerode({
      socketPath: config.socketPath,
    });
  }

  async createContainer(options: ContainerCreateOptions): Promise<Container> {
    this.logger.log('Creating container', { options });

    try {
      const container = await this.docker.createContainer({
        Image: this.config.imageName,
        Env: this.buildEnvironment(options),
        ExposedPorts: this.buildExposedPorts(options.ports),
        HostConfig: {
          PortBindings: this.buildPortBindings(options.ports),
          Binds: ['/var/run/docker.sock:/var/run/docker.sock'],
          Privileged: true,
          RestartPolicy: { Name: 'unless-stopped' },
        },
        Labels: {
          'afk.session.id': options.sessionId,
          'afk.session.name': options.sessionName,
          'afk.managed': 'true',
        },
      });

      await container.start();
      return container;
    } catch (error) {
      this.logger.error('Failed to create container', error);
      throw new Error(`Container creation failed: ${error.message}`);
    }
  }

  async stopContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.stop({ t: 10 });
    } catch (error) {
      if (error.statusCode !== 304) {
        // Not modified (already stopped)
        throw error;
      }
    }
  }

  async removeContainer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.remove({ force: true });
  }

  async getContainerInfo(containerId: string): Promise<ContainerInfo> {
    const container = this.docker.getContainer(containerId);
    const info = await container.inspect();

    return {
      id: info.Id,
      name: info.Name,
      state: info.State.Status,
      created: new Date(info.Created),
      ports: this.extractPorts(info),
      labels: info.Config.Labels,
    };
  }

  async listAFKContainers(): Promise<ContainerInfo[]> {
    const containers = await this.docker.listContainers({
      all: true,
      filters: {
        label: ['afk.managed=true'],
      },
    });

    return containers.map(this.mapContainerInfo);
  }

  async getContainerStats(containerId: string): Promise<ContainerStats> {
    const container = this.docker.getContainer(containerId);
    const stream = await container.stats({ stream: false });

    return {
      cpu: this.calculateCpuPercent(stream),
      memory: this.calculateMemoryUsage(stream),
      network: this.extractNetworkStats(stream),
    };
  }

  async streamContainerLogs(
    containerId: string,
    onData: (log: string) => void,
  ): Promise<NodeJS.ReadableStream> {
    const container = this.docker.getContainer(containerId);
    const stream = await container.logs({
      stdout: true,
      stderr: true,
      follow: true,
      tail: 100,
    });

    stream.on('data', (chunk) => {
      onData(chunk.toString());
    });

    return stream;
  }

  private buildEnvironment(options: ContainerCreateOptions): string[] {
    const env = [
      `REPO_URL=${options.repoUrl || ''}`,
      `REPO_BRANCH=${options.branch || 'main'}`,
      `GIT_USER_NAME=${options.gitUserName}`,
      `GIT_USER_EMAIL=${options.gitUserEmail}`,
      `TERMINAL_MODE=${options.terminalMode}`,
      `CLAUDE_PORT=${options.ports.claudePort}`,
      `MANUAL_PORT=${options.ports.manualPort}`,
    ];

    if (options.sshPrivateKey) {
      env.push(`SSH_PRIVATE_KEY=${options.sshPrivateKey}`);
    }

    if (options.claudeToken) {
      env.push(`CLAUDE_CODE_OAUTH_TOKEN=${options.claudeToken}`);
    }

    return env;
  }
}
```

**Port Manager Service:**

```typescript
// src/services/docker/port-manager.service.ts
@Injectable()
export class PortManagerService {
  private allocatedPorts: Set<number> = new Set();
  private portPool: number[] = [];

  constructor(
    private readonly config: DockerConfig,
    private readonly logger: Logger,
    private readonly portPairFactory: PortPairDtoFactory,
  ) {
    this.initializePortPool();
  }

  async onModuleInit() {
    await this.syncWithRunningContainers();
  }

  async allocatePortPair(): Promise<PortPairDto> {
    const claudePort = await this.allocatePort();

    try {
      const manualPort = await this.allocatePort();
      return this.portPairFactory.create(claudePort, manualPort);
    } catch (error) {
      // Rollback claude port allocation if manual port fails
      this.releasePort(claudePort);
      throw error;
    }
  }

  async releasePortPair(ports: PortPairDto): Promise<void> {
    this.releasePort(ports.claudePort);
    this.releasePort(ports.manualPort);
  }

  private async allocatePort(): Promise<number> {
    const availablePorts = this.portPool.filter(
      (port) => !this.allocatedPorts.has(port),
    );

    if (availablePorts.length === 0) {
      throw new Error('No available ports in pool');
    }

    const port = availablePorts[0];
    this.allocatedPorts.add(port);

    this.logger.debug('Port allocated', {
      port,
      allocated: this.allocatedPorts.size,
    });
    return port;
  }

  private releasePort(port: number): void {
    this.allocatedPorts.delete(port);
    this.logger.debug('Port released', {
      port,
      allocated: this.allocatedPorts.size,
    });
  }

  private initializePortPool(): void {
    for (
      let port = this.config.startPort;
      port <= this.config.endPort;
      port++
    ) {
      this.portPool.push(port);
    }
  }

  private async syncWithRunningContainers(): Promise<void> {
    // Sync allocated ports with running containers on startup
    const dockerService = new DockerEngineService(this.config, this.logger);
    const containers = await dockerService.listAFKContainers();

    containers.forEach((container) => {
      if (container.ports) {
        Object.values(container.ports).forEach((port) => {
          if (typeof port === 'number') {
            this.allocatedPorts.add(port);
          }
        });
      }
    });
  }
}
```

**Session Repository:**

```typescript
// src/services/repositories/session.repository.ts
@Injectable()
export class SessionRepository {
  private sessions: Map<string, Session> = new Map();

  async save(session: Session): Promise<void> {
    this.sessions.set(session.id.toString(), session);
  }

  async findById(id: SessionIdDto): Promise<Session | null> {
    return this.sessions.get(id.toString()) || null;
  }

  async findAll(filters?: SessionFilters): Promise<Session[]> {
    let sessions = Array.from(this.sessions.values());

    if (filters) {
      if (filters.status) {
        sessions = sessions.filter((s) => s.status === filters.status);
      }
      if (filters.userId) {
        sessions = sessions.filter((s) => s.userId === filters.userId);
      }
    }

    return sessions;
  }

  async delete(id: SessionIdDto): Promise<void> {
    this.sessions.delete(id.toString());
  }

  async exists(id: SessionIdDto): boolean {
    return this.sessions.has(id.toString());
  }
}
```

**Success Criteria:**

- Services follow single responsibility principle
- Docker operations are abstracted properly
- Port management prevents conflicts
- Repository provides data persistence abstraction

**Estimated Time:** 8-10 hours

### Task 5: Implement Interactors with Business Logic

**Description:** Create interactors that orchestrate business operations using EBI pattern.

**Create Session Interactor:**

```typescript
// src/interactors/sessions/create-session/create-session.interactor.ts
@Injectable()
export class CreateSessionInteractor {
  constructor(
    private readonly dockerEngine: DockerEngineService,
    private readonly portManager: PortManagerService,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionFactory: SessionFactory,
    private readonly sessionConfigFactory: SessionConfigDtoFactory,
    private readonly logger: Logger,
  ) {}

  async execute(request: CreateSessionRequest): Promise<Session> {
    this.logger.log('Creating new session', { request });

    // Validate request
    await this.validateRequest(request);

    // Create domain entity
    const sessionConfig = this.sessionConfigFactory.create({
      repoUrl: request.repoUrl,
      branch: request.branch,
      gitUserName: request.gitUserName,
      gitUserEmail: request.gitUserEmail,
      hasSSHKey: !!request.sshPrivateKey,
      terminalMode: request.terminalMode,
    });

    const session = this.sessionFactory.create(request.name, sessionConfig);

    try {
      // Allocate ports
      const ports = await this.portManager.allocatePortPair();

      // Create container
      const container = await this.dockerEngine.createContainer({
        sessionId: session.id.toString(),
        sessionName: session.name,
        repoUrl: sessionConfig.repoUrl,
        branch: sessionConfig.branch,
        gitUserName: sessionConfig.gitUserName,
        gitUserEmail: sessionConfig.gitUserEmail,
        sshPrivateKey: request.sshPrivateKey,
        terminalMode: sessionConfig.terminalMode,
        ports,
        claudeToken: request.claudeToken,
      });

      // Update session with container info
      session.assignContainer(container.id, ports);

      // Wait for container to be ready
      await this.waitForContainerReady(container.id);
      session.markAsRunning();

      // Save session
      await this.sessionRepository.save(session);

      this.logger.log('Session created successfully', {
        sessionId: session.id.toString(),
      });

      return session;
    } catch (error) {
      // Cleanup on failure
      if (session.ports) {
        await this.portManager.releasePortPair(session.ports);
      }
      if (session.containerId) {
        await this.dockerEngine
          .removeContainer(session.containerId)
          .catch(() => {});
      }

      this.logger.error('Failed to create session', error);
      throw new Error(`Session creation failed: ${error.message}`);
    }
  }

  private async validateRequest(request: CreateSessionRequest): Promise<void> {
    // Check session limits
    const existingSessions = await this.sessionRepository.findAll({
      userId: request.userId,
    });

    if (existingSessions.length >= 10) {
      throw new Error('Maximum session limit reached');
    }

    // Validate repository URL format
    if (request.repoUrl && !this.isValidRepoUrl(request.repoUrl)) {
      throw new Error('Invalid repository URL format');
    }

    // Validate SSH key format
    if (request.sshPrivateKey && !this.isValidSSHKey(request.sshPrivateKey)) {
      throw new Error('Invalid SSH private key format');
    }
  }

  private async waitForContainerReady(
    containerId: string,
    maxAttempts: number = 30,
  ): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const info = await this.dockerEngine.getContainerInfo(containerId);

      if (info.state === 'running') {
        // Additional health check can be added here
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error('Container failed to start within timeout');
  }

  private isValidRepoUrl(url: string): boolean {
    const patterns = [/^https?:\/\/.+$/, /^git@.+:.+\.git$/, /^ssh:\/\/.+$/];
    return patterns.some((pattern) => pattern.test(url));
  }

  private isValidSSHKey(key: string): boolean {
    return key.includes('BEGIN') && key.includes('PRIVATE KEY');
  }
}
```

**Session Lifecycle Interactor:**

```typescript
// src/interactors/sessions/session-lifecycle.interactor.ts
@Injectable()
export class SessionLifecycleInteractor {
  constructor(
    private readonly dockerEngine: DockerEngineService,
    private readonly sessionRepository: SessionRepository,
    private readonly portManager: PortManagerService,
    private readonly logger: Logger,
  ) {}

  async stopSession(sessionId: SessionIdDto): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== SessionStatus.RUNNING) {
      throw new Error('Session is not running');
    }

    try {
      await this.dockerEngine.stopContainer(session.containerId!);
      session.stop();
      await this.sessionRepository.save(session);

      this.logger.log('Session stopped', { sessionId: sessionId.toString() });
    } catch (error) {
      this.logger.error('Failed to stop session', error);
      throw error;
    }
  }

  async deleteSession(sessionId: SessionIdDto): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.canBeDeleted()) {
      throw new Error('Session must be stopped before deletion');
    }

    try {
      // Remove container
      if (session.containerId) {
        await this.dockerEngine.removeContainer(session.containerId);
      }

      // Release ports
      if (session.ports) {
        await this.portManager.releasePortPair(session.ports);
      }

      // Delete from repository
      await this.sessionRepository.delete(sessionId);

      this.logger.log('Session deleted', { sessionId: sessionId.toString() });
    } catch (error) {
      this.logger.error('Failed to delete session', error);
      throw error;
    }
  }

  async restartSession(sessionId: SessionIdDto): Promise<void> {
    await this.stopSession(sessionId);

    const session = await this.sessionRepository.findById(sessionId);
    if (!session || !session.containerId) {
      throw new Error('Session not found or invalid state');
    }

    await this.dockerEngine.startContainer(session.containerId);
    session.markAsRunning();
    await this.sessionRepository.save(session);
  }
}
```

**Success Criteria:**

- Interactors encapsulate business logic
- Proper error handling and cleanup
- Clear separation from infrastructure concerns

**Estimated Time:** 8-10 hours

### Task 6: Build REST API Controllers with EBI Pattern

**Description:** Create controllers as boundary layer with standardized responses.

**Session Controllers:**

```typescript
// src/interactors/sessions/create-session/create-session.controller.ts
@ApiTags('Sessions')
@Controller('sessions')
export class CreateSessionController {
  constructor(
    private readonly createSessionInteractor: CreateSessionInteractor,
    private readonly responseService: ResponseService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create new session',
    description:
      'Creates a new containerized session with optional git integration',
  })
  @ApiResponse({ status: 201, type: CreateSessionResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createSession(
    @Body() request: CreateSessionRequestDto,
  ): Promise<ApiResponse<CreateSessionResponseDto>> {
    try {
      const session = await this.createSessionInteractor.execute(request);

      const response = CreateSessionResponseDto.fromDomain(session);
      return this.responseService.success(response, 201);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}

// src/interactors/sessions/list-sessions/list-sessions.controller.ts
@ApiTags('Sessions')
@Controller('sessions')
export class ListSessionsController {
  constructor(
    private readonly listSessionsInteractor: ListSessionsInteractor,
    private readonly responseService: ResponseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all sessions' })
  @ApiQuery({ name: 'status', required: false, enum: SessionStatus })
  async listSessions(
    @Query('status') status?: SessionStatus,
  ): Promise<ApiResponse<SessionResponseDto[]>> {
    const sessions = await this.listSessionsInteractor.execute({
      status,
    });

    const response = sessions.map(SessionResponseDto.fromDomain);
    return this.responseService.success(response);
  }
}

// DTOs with validation
// src/interactors/sessions/create-session/create-session-request.dto.ts
export class CreateSessionRequestDto {
  @ApiProperty({ description: 'Session name' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ description: 'Git repository URL' })
  @IsOptional()
  @IsUrl()
  repoUrl?: string;

  @ApiPropertyOptional({ description: 'Git branch', default: 'main' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ description: 'Git user name' })
  @IsOptional()
  @IsString()
  gitUserName?: string;

  @ApiPropertyOptional({ description: 'Git user email' })
  @IsOptional()
  @IsEmail()
  gitUserEmail?: string;

  @ApiPropertyOptional({ description: 'Base64 encoded SSH private key' })
  @IsOptional()
  @IsString()
  sshPrivateKey?: string;

  @ApiPropertyOptional({
    description: 'Terminal mode',
    enum: TerminalMode,
    default: TerminalMode.SIMPLE,
  })
  @IsOptional()
  @IsEnum(TerminalMode)
  terminalMode?: TerminalMode;

  @ApiPropertyOptional({ description: 'Claude OAuth token' })
  @IsOptional()
  @IsString()
  claudeToken?: string;
}
```

**Response Service:**

```typescript
// src/libs/response/response.service.ts
@Injectable()
export class ResponseService {
  success<T>(data: T, statusCode: number = 200): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      statusCode,
    };
  }

  error(
    message: string,
    code?: string,
    statusCode: number = 400,
  ): ApiErrorResponse {
    return {
      success: false,
      error: {
        message,
        code: code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
      },
      statusCode,
    };
  }

  paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
  ): PaginatedResponse<T> {
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
```

**Success Criteria:**

- Controllers handle only HTTP concerns
- DTOs validate all inputs
- Responses are standardized
- Swagger documentation is complete

**Estimated Time:** 6-8 hours

### Task 7: Implement WebSocket Gateway for Real-time Updates

**Description:** Create WebSocket gateway for real-time session updates and log streaming.

**Session Gateway:**

```typescript
// src/gateways/session.gateway.ts
@WebSocketGateway({
  namespace: '/sessions',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class SessionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly sessionSubscriptionService: SessionSubscriptionService,
    private readonly dockerEngine: DockerEngineService,
    private readonly logger: Logger,
  ) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    this.logger.log('Client connected', {
      clientId: client.id,
    });
  }

  async handleDisconnect(client: Socket) {
    await this.sessionSubscriptionService.unsubscribeAll(client.id);
    this.logger.log('Client disconnected', { clientId: client.id });
  }

  @SubscribeMessage('subscribe.session')
  async handleSessionSubscription(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.sessionSubscriptionService.subscribe(
        client.id,
        data.sessionId,
      );

      client.join(`session:${data.sessionId}`);

      return {
        event: 'subscription.success',
        data: { sessionId: data.sessionId },
      };
    } catch (error) {
      return {
        event: 'subscription.error',
        data: { error: error.message },
      };
    }
  }

  @SubscribeMessage('unsubscribe.session')
  async handleSessionUnsubscription(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.sessionSubscriptionService.unsubscribe(
      client.id,
      data.sessionId,
    );
    client.leave(`session:${data.sessionId}`);
  }

  @SubscribeMessage('subscribe.logs')
  async handleLogSubscription(
    @MessageBody() data: { sessionId: string; containerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Start streaming logs
      const stream = await this.dockerEngine.streamContainerLogs(
        data.containerId,
        (log: string) => {
          client.emit('log.data', {
            sessionId: data.sessionId,
            log,
            timestamp: new Date().toISOString(),
          });
        },
      );

      // Store stream reference for cleanup
      client.data.logStream = stream;

      return {
        event: 'logs.subscribed',
        data: { sessionId: data.sessionId },
      };
    } catch (error) {
      return {
        event: 'logs.error',
        data: { error: error.message },
      };
    }
  }

  // Emit session status updates
  emitSessionUpdate(sessionId: string, update: SessionUpdate) {
    this.server.to(`session:${sessionId}`).emit('session.updated', {
      sessionId,
      update,
      timestamp: new Date().toISOString(),
    });
  }

  emitSessionStatusChange(sessionId: string, status: SessionStatus) {
    this.server.to(`session:${sessionId}`).emit('session.status.changed', {
      sessionId,
      status,
      timestamp: new Date().toISOString(),
    });
  }
}
```

**Session Subscription Service:**

```typescript
// src/gateways/session-subscription.service.ts
@Injectable()
export class SessionSubscriptionService {
  private subscriptions = new Map<string, Set<string>>();
  private clientSessions = new Map<string, Set<string>>();

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly sessionIdFactory: SessionIdDtoFactory,
    private readonly logger: Logger,
  ) {}

  async subscribe(clientId: string, sessionId: string): Promise<void> {
    // Verify session exists
    const session = await this.sessionRepository.findById(
      this.sessionIdFactory.fromString(sessionId),
    );

    if (!session) {
      throw new Error('Session not found');
    }

    // Add subscription
    if (!this.subscriptions.has(sessionId)) {
      this.subscriptions.set(sessionId, new Set());
    }
    this.subscriptions.get(sessionId)!.add(clientId);

    // Track client's sessions
    if (!this.clientSessions.has(clientId)) {
      this.clientSessions.set(clientId, new Set());
    }
    this.clientSessions.get(clientId)!.add(sessionId);

    this.logger.debug('Client subscribed to session', { clientId, sessionId });
  }

  async unsubscribe(clientId: string, sessionId: string): Promise<void> {
    this.subscriptions.get(sessionId)?.delete(clientId);
    this.clientSessions.get(clientId)?.delete(sessionId);
  }

  async unsubscribeAll(clientId: string): Promise<void> {
    const sessions = this.clientSessions.get(clientId);

    if (sessions) {
      sessions.forEach((sessionId) => {
        this.subscriptions.get(sessionId)?.delete(clientId);
      });
      this.clientSessions.delete(clientId);
    }
  }
}
```

**Success Criteria:**

- WebSocket connections work properly
- Real-time updates work for subscribed sessions
- Log streaming functions properly
- Connection cleanup on disconnect

**Estimated Time:** 8-10 hours

### Task 8: Add Comprehensive Error Handling and Monitoring

**Description:** Implement global error handling, structured logging, and monitoring.

**Global Exception Filter:**

```typescript
// src/libs/common/filters/http-exception.filter.ts
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: Logger,
    private readonly responseService: ResponseService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else if (typeof errorResponse === 'object') {
        message = (errorResponse as any).message || message;
        code = (errorResponse as any).code || code;
      }
    } else if (exception instanceof Error) {
      message = exception.message;

      // Log full error for non-HTTP exceptions
      this.logger.error('Unhandled exception', {
        error: exception,
        stack: exception.stack,
        request: {
          method: request.method,
          url: request.url,
          body: request.body,
        },
      });
    }

    const errorResponse = this.responseService.error(message, code, status);

    response.status(status).json(errorResponse);
  }
}
```

**Structured Logging with Pino:**

```typescript
// src/libs/logger/logger.module.ts
@Global()
@Module({})
export class LoggerModule {
  static forRootAsync(): DynamicModule {
    return {
      module: LoggerModule,
      imports: [
        LoggerModule.forRootAsync({
          useFactory: (config: LoggerConfig) => ({
            pinoHttp: {
              level: config.level,
              transport: config.pretty
                ? {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      singleLine: true,
                    },
                  }
                : undefined,
              serializers: {
                req: (req) => ({
                  method: req.method,
                  url: req.url,
                  query: req.query,
                  params: req.params,
                }),
                res: (res) => ({
                  statusCode: res.statusCode,
                }),
              },
              customProps: (req) => ({
                context: 'HTTP',
                userId: req.user?.id,
              }),
            },
          }),
          inject: [LoggerConfig],
        }),
      ],
      providers: [Logger],
      exports: [Logger],
    };
  }
}
```

**Health Check Implementation:**

```typescript
// src/health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly dockerHealth: DockerHealthIndicator,
    private readonly memoryHealth: MemoryHealthIndicator,
    private readonly diskHealth: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.dockerHealth.isHealthy('docker'),
      () => this.memoryHealth.checkHeap('memory_heap', 150 * 1024 * 1024),
      () =>
        this.diskHealth.checkStorage('storage', { path: '/', threshold: 0.9 }),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([() => this.dockerHealth.isHealthy('docker')]);
  }

  @Get('live')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

// src/health/docker-health.indicator.ts
@Injectable()
export class DockerHealthIndicator extends HealthIndicator {
  constructor(private readonly dockerEngine: DockerEngineService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.dockerEngine.ping();
      return this.getStatus(key, true, { message: 'Docker is accessible' });
    } catch (error) {
      return this.getStatus(key, false, {
        message: 'Docker is not accessible',
        error: error.message,
      });
    }
  }
}
```

**Success Criteria:**

- All errors are handled gracefully
- Structured logging provides useful debugging info
- Health checks accurately report system status
- Performance metrics are collected

**Estimated Time:** 6-8 hours

### Task 10: Initialize React Web Interface

**Description:** Create a React application with TypeScript and modern tooling.

**Steps:**

1. Create `web` directory and initialize React app
2. Install dependencies:
   ```json
   {
     "dependencies": {
       "react": "^18.0.0",
       "react-dom": "^18.0.0",
       "react-router-dom": "^6.0.0",
       "axios": "^1.0.0",
       "socket.io-client": "^4.0.0",
       "react-hook-form": "^7.0.0",
       "@mui/material": "^5.0.0",
       "@emotion/react": "^11.0.0",
       "@emotion/styled": "^11.0.0",
       "react-query": "^3.0.0",
       "zustand": "^4.0.0"
     }
   }
   ```
3. Configure project structure:
   ```
   web/
   ├── src/
   │   ├── App.tsx
   │   ├── api/
   │   │   ├── client.ts
   │   │   ├── sessions.api.ts
   │   │   └── types.ts
   │   ├── components/
   │   │   ├── common/
   │   │   ├── sessions/
   │   │   └── layout/
   │   ├── pages/
   │   │   ├── Dashboard.tsx
   │   │   ├── SessionDetails.tsx
   │   │   ├── CreateSession.tsx
   │   │   └── Login.tsx
   │   ├── hooks/
   │   │   ├── useWebSocket.ts
   │   │   ├── useAuth.ts
   │   │   └── useSession.ts
   │   ├── stores/
   │   │   ├── auth.store.ts
   │   │   └── session.store.ts
   │   └── utils/
   │       └── constants.ts
   ```

**API Client Setup:**

```typescript
// src/api/client.ts
import axios from 'axios';
import { getAuthToken } from '../stores/auth.store';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
```

**Success Criteria:**

- React app builds and runs
- API client communicates with backend
- Routing structure is set up
- State management is configured

**Estimated Time:** 4-5 hours

### Task 11: Implement Session Dashboard and Management UI

**Description:** Create the main dashboard and session management components.

**Dashboard Implementation:**

```typescript
// src/pages/Dashboard.tsx
export const Dashboard: React.FC = () => {
  const { sessions, loading, error, refetch } = useSessions();
  const { socket } = useWebSocket();

  useEffect(() => {
    if (socket) {
      socket.on('session.updated', handleSessionUpdate);
      socket.on('session.status.changed', handleStatusChange);
    }

    return () => {
      if (socket) {
        socket.off('session.updated');
        socket.off('session.status.changed');
      }
    };
  }, [socket]);

  return (
    <DashboardLayout>
      <Header>
        <Title>Sessions</Title>
        <CreateSessionButton />
      </Header>

      <FilterBar onFilterChange={handleFilterChange} />

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}

      <SessionGrid>
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onStop={handleStopSession}
            onRestart={handleRestartSession}
            onDelete={handleDeleteSession}
          />
        ))}
      </SessionGrid>
    </DashboardLayout>
  );
};
```

**Session Creation Form:**

```typescript
// src/pages/CreateSession.tsx
export const CreateSession: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateSessionForm>();
  const navigate = useNavigate();
  const { createSession } = useSessionApi();

  const onSubmit = async (data: CreateSessionForm) => {
    try {
      const session = await createSession(data);
      toast.success('Session created successfully');
      navigate(`/sessions/${session.id}`);
    } catch (error) {
      toast.error('Failed to create session');
    }
  };

  return (
    <FormContainer>
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField
          {...register('name', { required: 'Name is required' })}
          label="Session Name"
          error={!!errors.name}
          helperText={errors.name?.message}
        />

        <TextField
          {...register('repoUrl')}
          label="Repository URL (optional)"
          placeholder="https://github.com/user/repo.git"
        />

        <TextField
          {...register('branch')}
          label="Branch"
          defaultValue="main"
        />

        <SSHKeyUpload
          onKeyUpload={(key) => setValue('sshPrivateKey', key)}
        />

        <Button type="submit" variant="contained">
          Create Session
        </Button>
      </form>
    </FormContainer>
  );
};
```

**Success Criteria:**

- Dashboard displays all sessions
- Real-time updates work via WebSocket
- Session creation form validates inputs
- Navigation between pages works

**Estimated Time:** 10-12 hours

### Task 12: Create Docker Compose for Full Stack

**Description:** Create unified Docker Compose configuration for development and production.

**Docker Compose Configuration:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  # NestJS Server
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DOCKER_SOCKET_PATH=/var/run/docker.sock
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - server-data:/app/data
    networks:
      - afk-network
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3001/health']
      interval: 30s
      timeout: 10s
      retries: 3

  # React Web Interface
  web:
    build:
      context: ./web
      dockerfile: Dockerfile
      args:
        - REACT_APP_API_URL=http://localhost:3001/api
        - REACT_APP_WS_URL=ws://localhost:3001
    ports:
      - '3000:80'
    depends_on:
      - server
    networks:
      - afk-network

  # Nginx Reverse Proxy (optional)
  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - web
      - server
    networks:
      - afk-network

  # Redis for session storage (optional)
  redis:
    image: redis:alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    networks:
      - afk-network

networks:
  afk-network:
    driver: bridge

volumes:
  server-data:
  redis-data:
```

**Server Dockerfile:**

```dockerfile
# server/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

**Success Criteria:**

- Full stack runs with single docker-compose command
- Services communicate correctly
- Configuration is externalized
- Health checks pass

**Estimated Time:** 4-5 hours

## Testing Strategy

### Unit Tests

```typescript
// Example unit test for interactor
describe('CreateSessionInteractor', () => {
  let interactor: CreateSessionInteractor;
  let dockerEngine: jest.Mocked<DockerEngineService>;
  let portManager: jest.Mocked<PortManagerService>;
  let sessionRepository: jest.Mocked<SessionRepository>;
  let sessionFactory: jest.Mocked<SessionFactory>;
  let sessionConfigFactory: jest.Mocked<SessionConfigDtoFactory>;
  let portPairFactory: jest.Mocked<PortPairDtoFactory>;

  beforeEach(() => {
    dockerEngine = createMock<DockerEngineService>();
    portManager = createMock<PortManagerService>();
    sessionRepository = createMock<SessionRepository>();
    sessionFactory = createMock<SessionFactory>();
    sessionConfigFactory = createMock<SessionConfigDtoFactory>();
    portPairFactory = createMock<PortPairDtoFactory>();

    interactor = new CreateSessionInteractor(
      dockerEngine,
      portManager,
      sessionRepository,
      sessionFactory,
      sessionConfigFactory,
      createMock<Logger>(),
    );
  });

  it('should create session with valid configuration', async () => {
    const request = createValidRequest();
    const mockSession = createMockSession();
    const mockConfig = createMockSessionConfig();
    const ports = portPairFactory.create(7681, 7682);

    sessionConfigFactory.create.mockReturnValue(mockConfig);
    sessionFactory.create.mockReturnValue(mockSession);
    portManager.allocatePortPair.mockResolvedValue(ports);
    dockerEngine.createContainer.mockResolvedValue({ id: 'container-123' });
    sessionRepository.save.mockResolvedValue(undefined);

    const result = await interactor.execute(request);

    expect(result).toBeDefined();
    expect(sessionConfigFactory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        repoUrl: request.repoUrl,
        branch: request.branch,
      }),
    );
    expect(sessionFactory.create).toHaveBeenCalledWith(
      request.name,
      mockConfig,
    );
    expect(portManager.allocatePortPair).toHaveBeenCalled();
    expect(dockerEngine.createContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionName: request.name,
        ports,
      }),
    );
  });

  it('should cleanup resources on failure', async () => {
    const request = createValidRequest();
    const mockSession = createMockSession();
    const mockConfig = createMockSessionConfig();
    const ports = portPairFactory.create(7681, 7682);

    sessionConfigFactory.create.mockReturnValue(mockConfig);
    sessionFactory.create.mockReturnValue(mockSession);
    portManager.allocatePortPair.mockResolvedValue(ports);
    dockerEngine.createContainer.mockRejectedValue(new Error('Docker error'));

    await expect(interactor.execute(request)).rejects.toThrow();

    expect(portManager.releasePortPair).toHaveBeenCalledWith(ports);
  });
});
```

### Integration Tests

- End-to-end session creation flow
- WebSocket connection and message flow
- Container lifecycle management

### E2E Tests

- Create session with git repository
- Access terminal interfaces
- Real-time status updates
- Session deletion and cleanup

## Success Criteria for Phase 2

1. **Architecture Quality:**
   - EBI pattern properly implemented
   - Clean separation of concerns
   - Domain logic isolated from infrastructure
   - Testable code with high coverage

2. **Functionality:**
   - Users can create/manage sessions via web interface
   - Real-time status updates work reliably
   - Terminal access links function correctly
   - Git integration works as expected

3. **Performance:**
   - Dashboard loads within 2 seconds
   - Session creation completes within 10 seconds
   - WebSocket latency under 100ms
   - Can handle 20+ concurrent sessions

4. **Reliability:**
   - Graceful error handling throughout
   - Automatic cleanup of orphaned resources
   - Session state consistency maintained
   - Resilient to Docker API failures

5. **Security:**
   - SSH keys handled securely
   - No sensitive data in logs

6. **Developer Experience:**
   - Comprehensive API documentation (Swagger)
   - Structured logging for debugging
   - Clear error messages
   - Well-organized codebase

## Risk Mitigation

1. **Technical Debt:**
   - Follow EBI pattern strictly from start
   - Write tests alongside implementation
   - Regular code reviews
   - Refactor as needed

2. **Docker API Complexity:**
   - Abstract Docker operations properly
   - Implement retry logic
   - Handle edge cases
   - Monitor Docker daemon health

3. **Scalability Concerns:**
   - Design for horizontal scaling from start
   - Use connection pooling
   - Implement caching where appropriate
   - Monitor resource usage

4. **Security Vulnerabilities:**
   - Regular dependency updates
   - Security audit before production
   - Implement rate limiting
   - Use security headers

## Timeline Estimate

- Total estimated time: 90-120 hours
- Suggested timeline: 4-5 weeks with full-time effort
- Can be parallelized with 2-3 developers:
  - Backend (NestJS): 50-60 hours
  - Frontend (React): 30-40 hours
  - Integration & Testing: 20-30 hours

## Deliverables

1. NestJS server with EBI architecture
2. React web interface with real-time updates
3. Docker Compose configuration
4. API documentation (Swagger)
5. Comprehensive test suite
6. Deployment documentation
7. Developer setup guide

## Next Steps

After Phase 2 completion, the system will be ready for Phase 3 (Production Infrastructure) which will focus on:

- AWS deployment using CDK TypeScript
- Kubernetes orchestration (EKS)
- Database persistence (RDS/DynamoDB)
- Monitoring and alerting (CloudWatch)
- CI/CD pipeline (GitHub Actions)
- Multi-tenancy support
- Cost optimization strategies
