import { Inject, Injectable } from '@nestjs/common';
import { DockerEngineService } from '../../../libs/docker/docker-engine.service';
import { SessionIdDto } from '../../../domain/sessions/session-id.dto';
import { SessionRepository } from '../../../domain/sessions/session.repository';
import { SessionStatus } from '../../../domain/sessions/session-status.enum';
import { SESSION_REPOSITORY } from '../../../domain/sessions/session.tokens';

export interface SessionHealthStatus {
  terminalReady: boolean;
  allReady: boolean;
}

@Injectable()
export class CheckSessionHealthInteractor {
  constructor(
    private readonly dockerEngine: DockerEngineService,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(sessionId: SessionIdDto): Promise<SessionHealthStatus> {
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
