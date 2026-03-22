import { Inject, Injectable, Logger } from '@nestjs/common';
import { ContainerLogStreamService } from '../../../libs/docker/container-log-stream.service';
import { DockerEngineService } from '../../../libs/docker/docker-engine.service';
import { GitWatcherService } from '../../../libs/git-watcher/git-watcher.service';
import { SessionIdDto } from '../../../domain/sessions/session-id.dto';
import { SessionRepository } from '../../../domain/sessions/session.repository';
import { SESSION_REPOSITORY } from '../../../domain/sessions/session.tokens';
import { SessionStatus } from '../../../domain/sessions/session-status.enum';

@Injectable()
export class SessionRuntimeService {
  private readonly logger = new Logger(SessionRuntimeService.name);

  constructor(
    private readonly dockerEngine: DockerEngineService,
    private readonly containerLogStream: ContainerLogStreamService,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    private readonly gitWatcherService: GitWatcherService,
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
}
