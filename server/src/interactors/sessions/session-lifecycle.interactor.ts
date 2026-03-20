import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DockerEngineService } from '../../services/docker/docker-engine.service';
import { ContainerLogStreamService } from '../../services/docker/container-log-stream.service';
import { ContainerNotFoundError } from '../../services/docker/container-not-found.error';
import { SessionRepository } from '../../services/repositories/session.repository';
import { PortManagerService } from '../../services/docker/port-manager.service';
import { GitWatcherService } from '../../services/git-watcher/git-watcher.service';
import { DockerImageRepository } from '../../domain/docker-images/docker-image.repository';
import { ChatMessageRepository } from '../../domain/chat/chat-message.repository';
import { SessionIdDto } from '../../domain/sessions/session-id.dto';
import { SessionStatus } from '../../domain/sessions/session-status.enum';
import { MountPathValidator } from '../../libs/validators/mount-path.validator';

@Injectable()
export class SessionLifecycleInteractor {
  private readonly logger = new Logger(SessionLifecycleInteractor.name);

  constructor(
    private readonly dockerEngine: DockerEngineService,
    private readonly containerLogStream: ContainerLogStreamService,
    private readonly sessionRepository: SessionRepository,
    private readonly portManager: PortManagerService,
    private readonly gitWatcherService: GitWatcherService,
    private readonly dockerImageRepository: DockerImageRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly chatMessageRepository: ChatMessageRepository,
    private readonly mountPathValidator: MountPathValidator,
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
      // Stop git watcher before stopping container
      await this.gitWatcherService.stopWatching(sessionId.toString());

      await this.containerLogStream.releaseSession(sessionId.toString());

      await this.dockerEngine.stopContainer(session.containerId!);
      session.stop();
      await this.sessionRepository.save(session);

      this.logger.log('Session stopped', { sessionId: sessionId.toString() });
    } catch (error) {
      this.logger.error('Failed to stop session', error);
      throw error;
    }
  }

  async startSession(sessionId: SessionIdDto): Promise<void> {
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
      // Check if container exists and its current state
      let containerInfo;
      try {
        containerInfo = await this.dockerEngine.getContainerInfo(
          session.containerId,
        );
      } catch (error) {
        // Container doesn't exist or is corrupted, recreate it
        this.logger.warn('Container not found or corrupted, recreating', {
          sessionId: sessionId.toString(),
          containerId: session.containerId,
        });
        await this.recreateContainer(session);

        // Transition through proper states: stopped -> starting -> running
        session.start();
        await this.sessionRepository.save(session);
        session.markAsRunning();
        session.markAsAccessed();
        await this.sessionRepository.save(session);

        // Start health check in background
        this.performBackgroundHealthCheck(session);
        return;
      }

      // If container exists but is in an inconsistent state, recreate it
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

        // Transition through proper states: stopped -> starting -> running
        session.start();
        await this.sessionRepository.save(session);
        session.markAsRunning();
        session.markAsAccessed();
        await this.sessionRepository.save(session);

        // Start health check in background
        this.performBackgroundHealthCheck(session);
        return;
      }

      // Try to start the existing container
      await this.dockerEngine.startContainer(session.containerId);

      // First mark as starting, then as running
      session.start();
      await this.sessionRepository.save(session);

      // Optimistically mark as running immediately
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

      // Start health check in background with longer timeout
      this.performBackgroundHealthCheck(session);
    } catch (error) {
      session.markAsError();
      await this.sessionRepository.save(session);
      this.logger.error('Failed to start session', error);
      throw error;
    }
  }

  private async recreateContainer(session: any): Promise<void> {
    await this.containerLogStream.releaseSession(session.id);

    // Remove old container if it exists
    if (session.containerId) {
      try {
        await this.dockerEngine.removeContainer(session.containerId);
      } catch (error) {
        this.logger.warn('Failed to remove old container, continuing', {
          error: error.message,
        });
      }
    }

    // Resolve image: use session's snapshot, fall back to default
    let imageName = session.imageName;
    if (!imageName) {
      const defaultImage = await this.dockerImageRepository.findDefault();
      imageName = defaultImage?.image ?? 'awayfromklaude/afk-node:latest';
    }

    // Create new container with same configuration
    const container = await this.dockerEngine.createContainer({
      sessionId: session.id,
      sessionName: session.name,
      imageName,
      repoUrl: session.config.repoUrl,
      branch: session.config.branch,
      gitUserName: session.config.gitUserName,
      gitUserEmail: session.config.gitUserEmail,
      sshPrivateKey: session.config.sshPrivateKey,
      claudeToken: session.config.claudeToken,
      ports: session.ports,
      hostMountPath: session.config.hostMountPath || undefined,
    });

    // Update session with new container ID
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

  async performBackgroundHealthCheck(session: any): Promise<void> {
    // Run health check in background without blocking
    (async () => {
      const maxAttempts = 30; // 60 seconds total (30 * 2 seconds)
      let attempts = 0;

      while (attempts < maxAttempts) {
        try {
          const health = await this.checkTerminalHealth(
            new SessionIdDto(session.id),
          );
          if (health.allReady) {
            this.logger.log('Background health check passed', {
              sessionId: session.id,
              attempts: attempts + 1,
            });
            return;
          }
        } catch (error) {
          this.logger.debug('Background health check attempt failed', {
            sessionId: session.id,
            attempt: attempts + 1,
            error: error.message,
          });
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
      }

      // If we get here, health check failed after all attempts
      this.logger.error('Background health check failed after all attempts', {
        sessionId: session.id,
        maxAttempts,
      });

      // Mark session as error
      session.markAsError();
      await this.sessionRepository.save(session);
    })().catch((error) => {
      this.logger.error('Background health check error', {
        sessionId: session.id,
        error: error.message,
      });
    });
  }

  async deleteSession(sessionId: SessionIdDto): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.canBeDeleted()) {
      throw new Error('Session must be stopped before deletion');
    }

    session.markAsDeleting();
    await this.sessionRepository.save(session);

    this.emitDeleteProgress(sessionId.toString(), 'Preparing to delete...');

    this.performDeletion(sessionId, session).catch((error) => {
      this.logger.error('Background deletion failed', {
        sessionId: sessionId.toString(),
        error: error.message,
      });
    });
  }

  private emitDeleteProgress(sessionId: string, message: string): void {
    this.eventEmitter.emit('session.delete.progress', { sessionId, message });
  }

  private async performDeletion(
    sessionId: SessionIdDto,
    session: any,
  ): Promise<void> {
    const sid = sessionId.toString();

    try {
      await this.stopWatchingAndReleaseLogsForDeletion(sid);
      await this.removeDockerResourcesForDeletion(session, sid);
      await this.cleanupHostMountIfConfigured(session, sid);

      this.emitDeleteProgress(sid, 'Finalizing...');
      await this.deleteSessionRecordsAndReleasePorts(session, sessionId, sid);

      this.logger.log('Session deleted', { sessionId: sid });
      this.eventEmitter.emit('session.deleted', { sessionId: sid });
    } catch (error) {
      this.logger.error('Failed to delete session', error);

      try {
        session.markAsError();
        await this.sessionRepository.save(session);
      } catch (saveError) {
        this.logger.error('Failed to revert session status', saveError);
      }

      this.eventEmitter.emit('session.delete.failed', {
        sessionId: sid,
        error: error.message,
      });
    }
  }

  private async stopWatchingAndReleaseLogsForDeletion(
    sessionId: string,
  ): Promise<void> {
    await this.gitWatcherService.stopWatching(sessionId);
    await this.containerLogStream.releaseSession(sessionId);
  }

  private async removeDockerResourcesForDeletion(
    session: any,
    sid: string,
  ): Promise<void> {
    this.emitDeleteProgress(sid, 'Removing container and volumes...');

    const containerRemoval = session.containerId
      ? this.dockerEngine.removeContainer(session.containerId).catch((err) => {
          if (err instanceof ContainerNotFoundError) {
            this.logger.warn('Container already removed, continuing', {
              sessionId: sid,
              containerId: session.containerId,
            });
          } else {
            throw err;
          }
        })
      : Promise.resolve();

    const volumeRemoval = this.dockerEngine
      .removeSessionVolumes(session.id)
      .catch((volumeError) => {
        this.logger.warn('Failed to remove session volumes, continuing', {
          sessionId: sid,
          error: volumeError.message,
        });
      });

    await Promise.all([containerRemoval, volumeRemoval]);
  }

  private async cleanupHostMountIfConfigured(
    session: any,
    sid: string,
  ): Promise<void> {
    if (!session.config?.cleanupOnDelete || !session.config?.hostMountPath) {
      return;
    }

    this.emitDeleteProgress(sid, 'Cleaning up workspace files...');

    try {
      const safePath = this.mountPathValidator.validateReal(
        session.config.hostMountPath,
      );
      await fs.rm(safePath, { recursive: true, force: true });
      this.logger.log('Cleaned up host mount directory', {
        sessionId: sid,
        hostMountPath: safePath,
      });
    } catch (cleanupError) {
      this.logger.warn('Failed to clean up host mount directory, continuing', {
        sessionId: sid,
        hostMountPath: session.config.hostMountPath,
        error: cleanupError.message,
      });
    }
  }

  private async deleteSessionRecordsAndReleasePorts(
    session: any,
    sessionId: SessionIdDto,
    sid: string,
  ): Promise<void> {
    if (session.ports) {
      await this.portManager.releasePortPair(session.ports);
    }

    await this.chatMessageRepository.deleteBySessionId(sid);
    await this.sessionRepository.delete(sessionId);
  }

  async getSessionInfo(sessionId: SessionIdDto): Promise<any> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.containerId) {
      return {
        session,
        container: null,
      };
    }

    try {
      const containerInfo = await this.dockerEngine.getContainerInfo(
        session.containerId,
      );
      return {
        session,
        container: containerInfo,
      };
    } catch (error) {
      this.logger.error('Failed to get container info', error);
      return {
        session,
        container: null,
        error: error.message,
      };
    }
  }

  async checkTerminalHealth(sessionId: SessionIdDto): Promise<{
    terminalReady: boolean;
    allReady: boolean;
  }> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== SessionStatus.RUNNING || !session.containerId) {
      return {
        terminalReady: false,
        allReady: false,
      };
    }

    const ready = await this.dockerEngine.isContainerReady(session.containerId);

    return {
      terminalReady: ready,
      allReady: ready,
    };
  }
}
