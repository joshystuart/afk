import { Inject, Injectable, Logger } from '@nestjs/common';
import { SessionIdDto } from '../../domain/sessions/session-id.dto';
import { SessionRepository } from '../../domain/sessions/session.repository';
import { SessionStatus } from '../../domain/sessions/session-status.enum';
import { SESSION_REPOSITORY } from '../../domain/sessions/session.tokens';
import { DeleteSessionInteractor } from './delete-session/delete-session.interactor';
import { StopSessionInteractor } from './stop-session/stop-session.interactor';

export interface ClearAllSessionsResult {
  stopped: number;
  deleted: number;
  failed: number;
}

@Injectable()
export class ClearAllSessionsInteractor {
  private readonly logger = new Logger(ClearAllSessionsInteractor.name);

  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    private readonly stopSession: StopSessionInteractor,
    private readonly deleteSession: DeleteSessionInteractor,
  ) {}

  async execute(): Promise<ClearAllSessionsResult> {
    const sessions = await this.sessionRepository.findAll();
    let stopped = 0;
    let deleted = 0;
    let failed = 0;

    // First pass: stop any running/starting sessions
    for (const session of sessions) {
      if (
        session.status === SessionStatus.RUNNING ||
        session.status === SessionStatus.STARTING
      ) {
        try {
          await this.stopSession.execute(new SessionIdDto(session.id));
          stopped++;
        } catch (error) {
          this.logger.error(`Failed to stop session ${session.id}`, error);
          failed++;
        }
      }
    }

    // Re-fetch to get updated statuses after stops
    const updatedSessions = await this.sessionRepository.findAll();

    // Second pass: delete all deletable sessions
    for (const session of updatedSessions) {
      if (session.canBeDeleted()) {
        try {
          await this.deleteSession.execute(new SessionIdDto(session.id));
          deleted++;
        } catch (error) {
          this.logger.error(`Failed to delete session ${session.id}`, error);
          failed++;
        }
      }
    }

    this.logger.log(
      `Clear all sessions complete: stopped=${stopped}, deleted=${deleted}, failed=${failed}`,
    );
    return { stopped, deleted, failed };
  }
}
