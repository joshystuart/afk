import { Injectable, Logger, Inject } from '@nestjs/common';
import { DockerEngineService } from '../../../services/docker/docker-engine.service';
import { PortManagerService } from '../../../services/docker/port-manager.service';
import { SessionRepository } from '../../../services/repositories/session.repository';
import { SessionFactory } from '../../../domain/sessions/session.factory';
import { SessionConfigDtoFactory } from '../../../domain/sessions/session-config-dto.factory';
import { SessionConfig } from '../../../libs/config/session.config';
import { CreateSessionRequest } from './create-session-request.dto';
import { Session } from '../../../domain/sessions/session.entity';
import { SettingsRepository } from '../../../domain/settings/settings.repository';
import { SETTINGS_REPOSITORY } from '../../../domain/settings/settings.tokens';

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
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async execute(request: CreateSessionRequest): Promise<Session> {
    this.logger.log('Creating new session', { sessionName: request.name });

    // Get global settings
    const settings = await this.settingsRepository.get();

    // Validate request
    await this.validateRequest(request);

    // Create domain entity using global settings as defaults
    const sessionConfig = this.sessionConfigFactory.create({
      repoUrl: request.repoUrl,
      branch: request.branch,
      gitUserName: request.gitUserName || settings.gitUserName,
      gitUserEmail: request.gitUserEmail || settings.gitUserEmail,
      hasSSHKey: !!settings.sshPrivateKey,
    });

    const session = this.sessionFactory.create(request.name, sessionConfig);

    try {
      // Allocate ports
      const ports = await this.portManager.allocatePortPair();

      // Determine if we should pass the GitHub token for HTTPS cloning
      const isGitHubHttpsUrl =
        sessionConfig.repoUrl &&
        sessionConfig.repoUrl.startsWith('https://github.com');
      const githubToken =
        isGitHubHttpsUrl && settings.githubAccessToken
          ? settings.githubAccessToken
          : undefined;

      // Create container
      const container = await this.dockerEngine.createContainer({
        sessionId: session.id,
        sessionName: session.name,
        repoUrl: sessionConfig.repoUrl || undefined,
        branch: sessionConfig.branch,
        gitUserName: sessionConfig.gitUserName,
        gitUserEmail: sessionConfig.gitUserEmail,
        sshPrivateKey: settings.sshPrivateKey,
        ports,
        claudeToken: settings.claudeToken,
        githubToken,
      });

      // Update session with container info
      session.assignContainer(container.id, ports);

      // Save session immediately after container assignment (in STARTING state)
      await this.sessionRepository.save(session);

      // Wait for container to be ready
      await this.waitForContainerReady(container.id);
      session.markAsRunning();

      // Update session status to running
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
        await this.dockerEngine
          .removeContainer(session.containerId)
          .catch(() => {});
      }

      session.markAsError();
      await this.sessionRepository.save(session);

      this.logger.error('Failed to create session', error);
      throw new Error(`Session creation failed: ${error.message}`);
    }
  }

  private async validateRequest(request: CreateSessionRequest): Promise<void> {
    // Get settings for validation
    const settings = await this.settingsRepository.get();

    // SSH key is required unless GitHub is connected or no repo URL needs SSH
    const hasGitHub = !!settings.githubAccessToken;
    const isHttpsUrl =
      request.repoUrl && request.repoUrl.startsWith('https://');
    const needsSshKey = !hasGitHub && !isHttpsUrl;

    if (
      needsSshKey &&
      (!settings.sshPrivateKey || settings.sshPrivateKey.trim() === '')
    ) {
      throw new Error(
        'SSH Private Key is required for SSH repository URLs. Please configure it in Settings or connect GitHub for HTTPS access.',
      );
    }

    if (!settings.claudeToken || settings.claudeToken.trim() === '') {
      throw new Error(
        'Claude Token is required. Please configure it in Settings before creating a session.',
      );
    }

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

    // SSH key validation is now handled at the settings level
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
    try {
      // Validate SSH key format (supports various key types)
      const keyPatterns = [
        /-----BEGIN OPENSSH PRIVATE KEY-----/,
        /-----BEGIN RSA PRIVATE KEY-----/,
        /-----BEGIN DSA PRIVATE KEY-----/,
        /-----BEGIN EC PRIVATE KEY-----/,
        /-----BEGIN PRIVATE KEY-----/,
      ];

      const hasBeginMarker = keyPatterns.some((pattern) => pattern.test(key));
      const hasEndMarker =
        key.includes('-----END') && key.includes('PRIVATE KEY-----');

      return hasBeginMarker && hasEndMarker;
    } catch (error) {
      this.logger.warn('SSH key validation failed', { error: error.message });
      return false;
    }
  }
}
