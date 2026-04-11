import { Inject, Injectable, Logger } from '@nestjs/common';
import { DockerImageStatus } from '../../../domain/docker-images/docker-image-status.enum';
import { DockerImageRepository } from '../../../domain/docker-images/docker-image.repository';
import { Session } from '../../../domain/sessions/session.entity';
import { SessionRepository } from '../../../domain/sessions/session.repository';
import { SESSION_REPOSITORY } from '../../../domain/sessions/session.tokens';
import { Settings } from '../../../domain/settings/settings.entity';
import { ContainerLogStreamService } from '../../../libs/docker/container-log-stream.service';
import { DockerEngineService } from '../../../libs/docker/docker-engine.service';
import { PortManagerService } from '../../../libs/docker/port-manager.service';
import { CreateSessionRequest } from './create-session-request.dto';
import { SessionHealthMonitorService } from '../session-health-monitor.service';

@Injectable()
export class CreateSessionStartupService {
  private readonly logger = new Logger(CreateSessionStartupService.name);

  constructor(
    private readonly dockerEngine: DockerEngineService,
    private readonly containerLogStream: ContainerLogStreamService,
    private readonly portManager: PortManagerService,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    private readonly dockerImageRepository: DockerImageRepository,
    private readonly sessionHealthMonitor: SessionHealthMonitorService,
  ) {}

  async start(
    request: CreateSessionRequest,
    session: Session,
    settings: Settings,
  ): Promise<Session> {
    try {
      const ports = await this.portManager.allocatePortPair();
      const githubToken = this.resolveGithubToken(
        session.config.repoUrl,
        settings,
      );

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

      const container = await this.dockerEngine.createContainer({
        sessionId: session.id,
        sessionName: session.name,
        imageName: dockerImage.image,
        repoUrl: session.config.repoUrl || undefined,
        branch: session.config.branch,
        gitUserName: session.config.gitUserName,
        gitUserEmail: session.config.gitUserEmail,
        sshPrivateKey: settings.git.sshPrivateKey,
        ports,
        claudeToken: settings.general.claudeToken,
        githubToken,
        hostMountPath: session.config.hostMountPath || undefined,
        skillsPath: session.config.skillsPath || undefined,
      });

      session.imageId = dockerImage.id;
      session.imageName = dockerImage.image;
      session.assignContainer(container.id, ports);
      await this.sessionRepository.save(session);

      session.markAsRunning();
      await this.sessionRepository.save(session);

      await this.containerLogStream.ensureRunningLogStream(
        session.id,
        container.id,
      );

      this.logger.log('Session created successfully (awaiting readiness)', {
        sessionId: session.id,
        containerId: container.id,
        ports: ports.toJSON(),
      });

      this.sessionHealthMonitor.performBackgroundHealthCheck(session);
      return session;
    } catch (error) {
      await this.cleanupFailedSession(session);

      this.logger.error('Failed to create session', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Session creation failed: ${message}`);
    }
  }

  private resolveGithubToken(
    repoUrl: string | null,
    settings: Settings,
  ): string | undefined {
    const isGitHubHttpsUrl =
      repoUrl !== null && repoUrl.startsWith('https://github.com');

    if (!isGitHubHttpsUrl || !settings.git.githubAccessToken) {
      return undefined;
    }

    return settings.git.githubAccessToken;
  }

  private async cleanupFailedSession(session: Session): Promise<void> {
    if (session.ports) {
      await this.portManager.releasePortPair(session.ports);
    }

    if (session.containerId) {
      await this.containerLogStream.releaseSession(session.id).catch(() => {});
      await this.dockerEngine.removeContainer(session.containerId).catch(() => {
        return;
      });
    }

    session.markAsError();
    await this.sessionRepository.save(session);
  }
}
