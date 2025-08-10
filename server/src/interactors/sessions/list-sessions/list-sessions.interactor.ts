import { Injectable, Logger } from '@nestjs/common';
import { SessionRepository } from '../../../services/repositories/session.repository';
import { Session } from '../../../domain/sessions/session.entity';
import { ListSessionsRequest } from './list-sessions-request.dto';

@Injectable()
export class ListSessionsInteractor {
  private readonly logger = new Logger(ListSessionsInteractor.name);

  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(request: ListSessionsRequest): Promise<Session[]> {
    this.logger.log('Listing sessions', { filters: request });

    const sessions = await this.sessionRepository.findAll({
      status: request.status,
      userId: request.userId,
    });

    this.logger.log(`Found ${sessions.length} sessions`);

    return sessions;
  }
}
