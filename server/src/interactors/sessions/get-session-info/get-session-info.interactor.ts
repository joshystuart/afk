import { Inject, Injectable, Logger } from '@nestjs/common';
import { ContainerInfo } from '../../../domain/containers/container.entity';
import { Session } from '../../../domain/sessions/session.entity';
import { SessionIdDto } from '../../../domain/sessions/session-id.dto';
import { SessionRepository } from '../../../domain/sessions/session.repository';
import { SESSION_REPOSITORY } from '../../../domain/sessions/session.tokens';
import { DockerEngineService } from '../../../services/docker/docker-engine.service';

export interface SessionInfo {
  session: Session;
  container: ContainerInfo | null;
  error?: string;
}

@Injectable()
export class GetSessionInfoInteractor {
  private readonly logger = new Logger(GetSessionInfoInteractor.name);

  constructor(
    private readonly dockerEngine: DockerEngineService,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(sessionId: SessionIdDto): Promise<SessionInfo> {
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
      const message = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error('Failed to get container info', error);
      return {
        session,
        container: null,
        error: message,
      };
    }
  }
}
