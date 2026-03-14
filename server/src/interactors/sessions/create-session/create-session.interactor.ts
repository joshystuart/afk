import { Injectable, Logger, Inject } from '@nestjs/common';
import * as fs from 'fs';
import { DockerEngineService } from '../../../services/docker/docker-engine.service';
import { PortManagerService } from '../../../services/docker/port-manager.service';
import { SessionRepository } from '../../../services/repositories/session.repository';
import { SessionFactory } from '../../../domain/sessions/session.factory';
import { SessionConfigDtoFactory } from '../../../domain/sessions/session-config-dto.factory';
import { SessionConfig } from '../../../libs/config/session.config';
import { CreateSessionRequest } from './create-session-request.dto';
import { Session } from '../../../domain/sessions/session.entity';
import { SessionStatus } from '../../../domain/sessions/session-status.enum';
import { SettingsRepository } from '../../../domain/settings/settings.repository';
import { SETTINGS_REPOSITORY } from '../../../domain/settings/settings.tokens';
import { DockerImageRepository } from '../../../domain/docker-images/docker-image.repository';
import { DockerImageStatus } from '../../../domain/docker-images/docker-image-status.enum';
import { MountPathValidator } from '../../../libs/validators/mount-path.validator';
import { MountPathValidationError } from '../../../libs/validators/mount-path-validation.error';

@Injectable()
export class CreateSessionInteractor {
  private readonly logger = new Logger(CreateSessionInteractor.name);
  private readonly creationLock = new Map<string, Promise<void>>();

  constructor(
    private readonly dockerEngine: DockerEngineService,
    private readonly portManager: PortManagerService,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionFactory: SessionFactory,
    private readonly sessionConfigFactory: SessionConfigDtoFactory,
    private readonly sessionConfig: SessionConfig,
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
    private readonly dockerImageRepository: DockerImageRepository,
    private readonly mountPathValidator: MountPathValidator,
  ) {}

  async execute(request: CreateSessionRequest): Promise<Session> {
    // Default name from repo URL and branch if not provided
    const sessionName =
      request.name || this.deriveSessionName(request.repoUrl, request.branch);

    this.logger.log('Creating new session', { sessionName });

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
      mountToHost: request.mountToHost,
      hostMountPathOverride: request.hostMountPath,
      defaultMountDirectory: settings.defaultMountDirectory ?? undefined,
      cleanupOnDelete: request.cleanupOnDelete,
    });

    // Validate and prepare mount path if specified
    if (sessionConfig.hostMountPath) {
      try {
        this.mountPathValidator.validate(sessionConfig.hostMountPath);
      } catch (error) {
        if (error instanceof MountPathValidationError) {
          throw new Error(error.message);
        }
        throw error;
      }

      // Serialize mount-path setup per resolved path to prevent race conditions
      // where concurrent requests could pass the conflict check simultaneously
      await this.withMountPathLock(sessionConfig.hostMountPath, async () => {
        await this.checkMountPathConflict(
          sessionConfig.hostMountPath!,
          sessionName,
        );

        fs.mkdirSync(sessionConfig.hostMountPath!, { recursive: true });

        // Re-validate after creation by resolving symlinks to prevent
        // path traversal via symlinked intermediate directories
        try {
          this.mountPathValidator.validateReal(sessionConfig.hostMountPath!);
        } catch (error) {
          if (error instanceof MountPathValidationError) {
            throw new Error(
              `Mount path resolved to a forbidden location after following symlinks: ${error.message}`,
            );
          }
          throw error;
        }
      });

      this.logger.log('Ensured host mount directory exists', {
        hostMountPath: sessionConfig.hostMountPath,
      });
    }

    const session = this.sessionFactory.create(sessionName, sessionConfig);

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

      // Resolve Docker image by the requested imageId
      const dockerImage = await this.dockerImageRepository.findById(
        request.imageId,
      );
      if (!dockerImage) {
        throw new Error(`Docker image not found: ${request.imageId}`);
      }
      if (dockerImage.status !== DockerImageStatus.AVAILABLE) {
        throw new Error(
          `Docker image "${dockerImage.name}" is not available (status: ${dockerImage.status})`,
        );
      }

      // Create container
      const container = await this.dockerEngine.createContainer({
        sessionId: session.id,
        sessionName: session.name,
        imageName: dockerImage.image,
        repoUrl: sessionConfig.repoUrl || undefined,
        branch: sessionConfig.branch,
        gitUserName: sessionConfig.gitUserName,
        gitUserEmail: sessionConfig.gitUserEmail,
        sshPrivateKey: settings.sshPrivateKey,
        ports,
        claudeToken: settings.claudeToken,
        githubToken,
        hostMountPath: sessionConfig.hostMountPath || undefined,
      });

      // Store image reference on the session
      session.imageId = dockerImage.id;
      session.imageName = dockerImage.image;

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

  private async withMountPathLock<T>(
    mountPath: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    // Wait for any existing operation on this mount path to finish
    while (this.creationLock.has(mountPath)) {
      await this.creationLock.get(mountPath);
    }

    let resolve!: () => void;
    const lockPromise = new Promise<void>((r) => (resolve = r));
    this.creationLock.set(mountPath, lockPromise);

    try {
      return await fn();
    } finally {
      this.creationLock.delete(mountPath);
      resolve();
    }
  }

  private async checkMountPathConflict(
    hostMountPath: string,
    sessionName: string,
  ): Promise<void> {
    const allSessions = await this.sessionRepository.findAll({});
    const activeSessions = allSessions.filter(
      (s) =>
        s.status !== SessionStatus.STOPPED && s.status !== SessionStatus.ERROR,
    );

    const conflict = activeSessions.find(
      (s) => s.config?.hostMountPath === hostMountPath,
    );

    if (conflict) {
      throw new Error(
        `Mount path '${hostMountPath}' is already in use by session '${conflict.name}'. Use a custom path override or stop the other session.`,
      );
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

  private deriveSessionName(repoUrl?: string, branch?: string): string {
    if (!repoUrl) {
      return `session-${Date.now()}`;
    }

    // Extract repo name from URL (supports HTTPS and SSH formats)
    let repoName: string;
    try {
      // SSH format: git@github.com:owner/repo.git
      const sshMatch = repoUrl.match(/[:/]([^/]+?)(?:\.git)?$/);
      if (sshMatch) {
        repoName = sshMatch[1];
      } else {
        repoName =
          repoUrl
            .split('/')
            .pop()
            ?.replace(/\.git$/, '') || 'repo';
      }
    } catch {
      repoName = 'repo';
    }

    const branchName = branch || 'main';
    return `${repoName}/${branchName}`;
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
