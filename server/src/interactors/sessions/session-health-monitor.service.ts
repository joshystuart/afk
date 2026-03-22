import { Inject, Injectable, Logger } from '@nestjs/common';
import { Session } from '../../domain/sessions/session.entity';
import { SessionIdDto } from '../../domain/sessions/session-id.dto';
import { SessionRepository } from '../../domain/sessions/session.repository';
import { SESSION_REPOSITORY } from '../../domain/sessions/session.tokens';
import { CheckSessionHealthInteractor } from './check-session-health/check-session-health.interactor';

@Injectable()
export class SessionHealthMonitorService {
  private readonly logger = new Logger(SessionHealthMonitorService.name);

  constructor(
    private readonly checkSessionHealth: CheckSessionHealthInteractor,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
  ) {}

  performBackgroundHealthCheck(session: Session): void {
    void (async () => {
      const maxAttempts = 30;
      let attempts = 0;

      while (attempts < maxAttempts) {
        try {
          const health = await this.checkSessionHealth.execute(
            new SessionIdDto(session.id),
          );

          if (health.allReady) {
            this.logger.log('Background health check passed', {
              sessionId: session.id,
              attempts: attempts + 1,
            });
            return;
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown error';

          this.logger.debug('Background health check attempt failed', {
            sessionId: session.id,
            attempt: attempts + 1,
            error: message,
          });
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      this.logger.error('Background health check failed after all attempts', {
        sessionId: session.id,
        maxAttempts,
      });

      session.markAsError();
      await this.sessionRepository.save(session);
    })().catch((error) => {
      const message = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error('Background health check error', {
        sessionId: session.id,
        error: message,
      });
    });
  }
}
