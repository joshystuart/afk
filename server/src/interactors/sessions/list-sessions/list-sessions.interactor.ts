import { Inject, Injectable, Logger } from '@nestjs/common';
import { SessionRepository } from '../../../domain/sessions/session.repository';
import { Session } from '../../../domain/sessions/session.entity';
import { SESSION_REPOSITORY } from '../../../domain/sessions/session.tokens';
import { ListSessionsRequest } from './list-sessions-request.dto';

@Injectable()
export class ListSessionsInteractor {
  private readonly logger = new Logger(ListSessionsInteractor.name);

  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
  ) {}

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
