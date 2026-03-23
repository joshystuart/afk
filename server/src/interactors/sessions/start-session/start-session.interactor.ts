import { Inject, Injectable, Logger } from '@nestjs/common';
import { DockerEngineService } from '../../../libs/docker/docker-engine.service';
import { ContainerLogStreamService } from '../../../libs/docker/container-log-stream.service';
import { DockerImageRepository } from '../../../domain/docker-images/docker-image.repository';
import { Session } from '../../../domain/sessions/session.entity';
import { SessionIdDto } from '../../../domain/sessions/session-id.dto';
import { SessionRepository } from '../../../domain/sessions/session.repository';
import { SessionStatus } from '../../../domain/sessions/session-status.enum';
import { SESSION_REPOSITORY } from '../../../domain/sessions/session.tokens';
import { SessionHealthMonitorService } from '../session-health-monitor.service';

@Injectable()
export class StartSessionInteractor {
  private readonly logger = new Logger(StartSessionInteractor.name);

  constructor(
    private readonly dockerEngine: DockerEngineService,
    private readonly containerLogStream: ContainerLogStreamService,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    private readonly dockerImageRepository: DockerImageRepository,
    private readonly sessionHealthMonitor: SessionHealthMonitorService,
  ) {}

  async execute(sessionId: SessionIdDto): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== SessionStatus.STOPPED) {
      throw new Error('Session is not stopped');
    }

    if (!session.containerId) {
      throw new Error('Session has no associated container');
    }

    try {
      let containerInfo;

      try {
        containerInfo = await this.dockerEngine.getContainerInfo(
          session.containerId,
        );
      } catch {
        this.logger.warn('Container not found or corrupted, recreating', {
          sessionId: sessionId.toString(),
          containerId: session.containerId,
        });

        await this.recreateContainer(session);
        await this.markSessionAsRunning(session);
        this.sessionHealthMonitor.performBackgroundHealthCheck(session);
        return;
      }

      if (
        containerInfo.state !== 'running' &&
        containerInfo.state !== 'exited'
      ) {
        this.logger.warn('Container in inconsistent state, recreating', {
          sessionId: sessionId.toString(),
          containerState: containerInfo.state,
        });

        await this.dockerEngine.removeContainer(session.containerId);
        await this.recreateContainer(session);
        await this.markSessionAsRunning(session);
        this.sessionHealthMonitor.performBackgroundHealthCheck(session);
        return;
      }

      await this.dockerEngine.startContainer(session.containerId);

      session.start();
      await this.sessionRepository.save(session);

      session.markAsRunning();
      session.markAsAccessed();
      await this.sessionRepository.save(session);

      await this.containerLogStream.ensureRunningLogStream(
        session.id,
        session.containerId,
      );

      this.logger.log('Session started (optimistically)', {
        sessionId: sessionId.toString(),
      });

      this.sessionHealthMonitor.performBackgroundHealthCheck(session);
    } catch (error) {
      session.markAsError();
      await this.sessionRepository.save(session);
      this.logger.error('Failed to start session', error);
      throw error;
    }
  }

  private async recreateContainer(session: Session): Promise<void> {
    await this.containerLogStream.releaseSession(session.id);

    if (session.containerId) {
      try {
        await this.dockerEngine.removeContainer(session.containerId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';

        this.logger.warn('Failed to remove old container, continuing', {
          error: message,
        });
      }
    }

    let imageName = session.imageName;
    if (!imageName) {
      const defaultImage = await this.dockerImageRepository.findDefault();
      imageName = defaultImage?.image ?? 'awayfromklaude/afk-node:latest';
    }

    const container = await this.dockerEngine.createContainer({
      sessionId: session.id,
      sessionName: session.name,
      imageName,
      repoUrl: session.config.repoUrl ?? undefined,
      branch: session.config.branch,
      gitUserName: session.config.gitUserName,
      gitUserEmail: session.config.gitUserEmail,
      ports: session.ports!,
      hostMountPath: session.config.hostMountPath || undefined,
    });

    session.containerId = container.id;
    await this.sessionRepository.save(session);

    await this.containerLogStream.ensureRunningLogStream(
      session.id,
      container.id,
    );

    this.logger.log('Container recreated successfully', {
      sessionId: session.id,
      newContainerId: container.id,
    });
  }

  private async markSessionAsRunning(session: Session): Promise<void> {
    session.start();
    await this.sessionRepository.save(session);

    session.markAsRunning();
    session.markAsAccessed();
    await this.sessionRepository.save(session);
  }
}
