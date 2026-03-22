import { Injectable, Logger } from '@nestjs/common';
import { SessionFactory } from '../../../domain/sessions/session.factory';
import { CreateSessionRequest } from './create-session-request.dto';
import { Session } from '../../../domain/sessions/session.entity';
import { CreateSessionRequestService } from './create-session-request.service';
import { CreateSessionStartupService } from './create-session-startup.service';

@Injectable()
export class CreateSessionInteractor {
  private readonly logger = new Logger(CreateSessionInteractor.name);

  constructor(
    private readonly sessionFactory: SessionFactory,
    private readonly createSessionRequestService: CreateSessionRequestService,
    private readonly createSessionStartupService: CreateSessionStartupService,
  ) {}

  async execute(request: CreateSessionRequest): Promise<Session> {
    const { sessionName, sessionConfig, settings } =
      await this.createSessionRequestService.prepare(request);

    this.logger.log('Creating new session', { sessionName });

    const session = this.sessionFactory.create(sessionName, sessionConfig);
    return this.createSessionStartupService.start(request, session, settings);
  }
}
