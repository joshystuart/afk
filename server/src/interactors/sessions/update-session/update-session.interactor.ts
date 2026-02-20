import { Injectable } from '@nestjs/common';
import { SessionRepository } from '../../../services/repositories/session.repository';
import { SessionIdDto } from '../../../domain/sessions/session-id.dto';
import { Session } from '../../../domain/sessions/session.entity';
import { UpdateSessionRequest } from './update-session-request.dto';

@Injectable()
export class UpdateSessionInteractor {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(
    sessionId: SessionIdDto,
    request: UpdateSessionRequest,
  ): Promise<Session> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    const trimmedName = request.name?.trim();
    if (!trimmedName) {
      throw new Error('Session name is required');
    }

    session.name = trimmedName;
    await this.sessionRepository.save(session);

    const updatedSession = await this.sessionRepository.findById(sessionId);
    if (!updatedSession) {
      throw new Error('Session not found');
    }

    return updatedSession;
  }
}
