import { Inject, Injectable } from '@nestjs/common';
import { SessionIdDto } from '../../../domain/sessions/session-id.dto';
import { SessionRepository } from '../../../domain/sessions/session.repository';
import { Session } from '../../../domain/sessions/session.entity';
import { SESSION_REPOSITORY } from '../../../domain/sessions/session.tokens';
import { UpdateSessionRequest } from './update-session-request.dto';

@Injectable()
export class UpdateSessionInteractor {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(
    sessionId: SessionIdDto,
    request: UpdateSessionRequest,
  ): Promise<Session> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (request.name !== undefined) {
      const trimmedName = request.name?.trim();
      if (!trimmedName) {
        throw new Error('Session name is required');
      }
      session.name = trimmedName;
    }

    if (request.model !== undefined) {
      session.model = request.model;
    }

    if (request.agentMode !== undefined) {
      session.agentMode = request.agentMode;
    }

    await this.sessionRepository.save(session);

    const updatedSession = await this.sessionRepository.findById(sessionId);
    if (!updatedSession) {
      throw new Error('Session not found');
    }

    return updatedSession;
  }
}
