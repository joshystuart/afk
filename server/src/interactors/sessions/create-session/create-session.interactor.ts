import { Injectable, Logger } from '@nestjs/common';
import { DockerEngineService } from '../../../services/docker/docker-engine.service';
import { PortManagerService } from '../../../services/docker/port-manager.service';
import { SessionRepository } from '../../../services/repositories/session.repository';
import { SessionFactory } from '../../../domain/sessions/session.factory';
import { SessionConfigDtoFactory } from '../../../domain/sessions/session-config-dto.factory';
import { SessionConfig } from '../../../libs/config/session.config';
import { CreateSessionRequest } from './create-session-request.dto';
import { Session } from '../../../domain/sessions/session.entity';

@Injectable()
export class CreateSessionInteractor {
  private readonly logger = new Logger(CreateSessionInteractor.name);

  constructor(
    private readonly dockerEngine: DockerEngineService,
    private readonly portManager: PortManagerService,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionFactory: SessionFactory,
    private readonly sessionConfigFactory: SessionConfigDtoFactory,
    private readonly sessionConfig: SessionConfig,
  ) {}

  async execute(request: CreateSessionRequest): Promise<Session> {
    this.logger.log('Creating new session', { sessionName: request.name });

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
        repoUrl: sessionConfig.repoUrl || undefined,
        branch: sessionConfig.branch,
        gitUserName: sessionConfig.gitUserName,
        gitUserEmail: sessionConfig.gitUserEmail,
        sshPrivateKey: request.sshPrivateKey,
        terminalMode: sessionConfig.terminalMode.toString(),
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
        containerId: container.id,
        ports: ports.toJSON(),
      });

      return session;
    } catch (error) {
      // Cleanup on failure
      if (session.ports) {
        await this.portManager.releasePortPair(session.ports);
      }
      if (session.containerId) {
        await this.dockerEngine.removeContainer(session.containerId).catch(() => {});
      }
      
      session.markAsError();
      await this.sessionRepository.save(session);
      
      this.logger.error('Failed to create session', error);
      throw new Error(`Session creation failed: ${error.message}`);
    }
  }

  private async validateRequest(request: CreateSessionRequest): Promise<void> {
    // Check session limits
    const existingSessions = await this.sessionRepository.findAll({
      userId: request.userId,
    });

    if (existingSessions.length >= this.sessionConfig.maxSessionsPerUser) {
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

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Container failed to start within timeout');
  }

  private isValidRepoUrl(url: string): boolean {
    const patterns = [
      /^https?:\/\/.+$/,
      /^git@.+:.+\.git$/,
      /^ssh:\/\/.+$/,
    ];
    return patterns.some(pattern => pattern.test(url));
  }

  private isValidSSHKey(key: string): boolean {
    return key.includes('BEGIN') && key.includes('PRIVATE KEY');
  }
}