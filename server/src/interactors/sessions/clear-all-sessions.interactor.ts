import { Injectable, Logger } from '@nestjs/common';
import { SessionRepository } from '../../services/repositories/session.repository';
import { SessionLifecycleInteractor } from './session-lifecycle.interactor';
import { SessionIdDto } from '../../domain/sessions/session-id.dto';
import { SessionStatus } from '../../domain/sessions/session-status.enum';

export interface ClearAllSessionsResult {
  stopped: number;
  deleted: number;
  failed: number;
}

@Injectable()
export class ClearAllSessionsInteractor {
  private readonly logger = new Logger(ClearAllSessionsInteractor.name);

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly sessionLifecycle: SessionLifecycleInteractor,
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
          await this.sessionLifecycle.stopSession(new SessionIdDto(session.id));
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
          await this.sessionLifecycle.deleteSession(
            new SessionIdDto(session.id),
          );
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
