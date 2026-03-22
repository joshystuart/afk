import { Inject, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChatMessageRepository } from '../../../domain/chat/chat-message.repository';
import { Session } from '../../../domain/sessions/session.entity';
import { SessionIdDto } from '../../../domain/sessions/session-id.dto';
import { SessionRepository } from '../../../domain/sessions/session.repository';
import { SESSION_REPOSITORY } from '../../../domain/sessions/session.tokens';
import { MountPathValidator } from '../../../libs/validators/mount-path.validator';
import { ContainerLogStreamService } from '../../../libs/docker/container-log-stream.service';
import { ContainerNotFoundError } from '../../../libs/docker/container-not-found.error';
import { DockerEngineService } from '../../../libs/docker/docker-engine.service';
import { PortManagerService } from '../../../libs/docker/port-manager.service';
import { GitWatcherService } from '../../../libs/git-watcher/git-watcher.service';

@Injectable()
export class DeleteSessionInteractor {
  private readonly logger = new Logger(DeleteSessionInteractor.name);

  constructor(
    private readonly containerLogStream: ContainerLogStreamService,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    private readonly portManager: PortManagerService,
    private readonly gitWatcherService: GitWatcherService,
    private readonly eventEmitter: EventEmitter2,
    private readonly chatMessageRepository: ChatMessageRepository,
    private readonly mountPathValidator: MountPathValidator,
    private readonly dockerEngine: DockerEngineService,
  ) {}

  async execute(sessionId: SessionIdDto): Promise<void> {
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
      const message = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error('Background deletion failed', {
        sessionId: sessionId.toString(),
        error: message,
      });
    });
  }

  private emitDeleteProgress(sessionId: string, message: string): void {
    this.eventEmitter.emit('session.delete.progress', { sessionId, message });
  }

  private async performDeletion(
    sessionId: SessionIdDto,
    session: Session,
  ): Promise<void> {
    const sid = sessionId.toString();

    try {
      await this.stopWatchingAndReleaseLogsForDeletion(sid);
      await this.removeDockerResourcesForDeletion(session, sid);
      await this.cleanupHostMountIfConfigured(session, sid);

      this.emitDeleteProgress(sid, 'Finalizing...');
      await this.deleteSessionRecordsAndReleasePorts(session, sessionId);

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

      const message = error instanceof Error ? error.message : 'Unknown error';

      this.eventEmitter.emit('session.delete.failed', {
        sessionId: sid,
        error: message,
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
    session: Session,
    sessionId: string,
  ): Promise<void> {
    this.emitDeleteProgress(sessionId, 'Removing container and volumes...');

    const containerRemoval = session.containerId
      ? this.dockerEngine
          .removeContainer(session.containerId)
          .catch((error) => {
            if (error instanceof ContainerNotFoundError) {
              this.logger.warn('Container already removed, continuing', {
                sessionId,
                containerId: session.containerId,
              });
              return;
            }

            throw error;
          })
      : Promise.resolve();

    const volumeRemoval = this.dockerEngine
      .removeSessionVolumes(session.id)
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : 'Unknown error';

        this.logger.warn('Failed to remove session volumes, continuing', {
          sessionId,
          error: message,
        });
      });

    await Promise.all([containerRemoval, volumeRemoval]);
  }

  private async cleanupHostMountIfConfigured(
    session: Session,
    sessionId: string,
  ): Promise<void> {
    if (!session.config?.cleanupOnDelete || !session.config?.hostMountPath) {
      return;
    }

    this.emitDeleteProgress(sessionId, 'Cleaning up workspace files...');

    try {
      const safePath = this.mountPathValidator.validateReal(
        session.config.hostMountPath,
      );
      await fs.rm(safePath, { recursive: true, force: true });
      this.logger.log('Cleaned up host mount directory', {
        sessionId,
        hostMountPath: safePath,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      this.logger.warn('Failed to clean up host mount directory, continuing', {
        sessionId,
        hostMountPath: session.config.hostMountPath,
        error: message,
      });
    }
  }

  private async deleteSessionRecordsAndReleasePorts(
    session: Session,
    sessionId: SessionIdDto,
  ): Promise<void> {
    if (session.ports) {
      await this.portManager.releasePortPair(session.ports);
    }

    await this.chatMessageRepository.deleteBySessionId(session.id);
    await this.sessionRepository.delete(sessionId);
  }
}
