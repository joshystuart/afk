import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { SettingsRepository } from '../../domain/settings/settings.repository';
import { SETTINGS_REPOSITORY } from '../../domain/settings/settings.tokens';
import { SessionIdDto } from '../../domain/sessions/session-id.dto';
import { SessionRepository } from '../../domain/sessions/session.repository';
import { SESSION_REPOSITORY } from '../../domain/sessions/session.tokens';
import { SessionRuntimeService } from './session-runtime.service';

const CLEANUP_INTERVAL_MS = 60_000;

@Injectable()
export class SessionIdleCleanupService implements OnModuleDestroy {
  private readonly logger = new Logger(SessionIdleCleanupService.name);
  private running = false;
  private _sessionsAutoStopped = 0;

  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    private readonly sessionRuntime: SessionRuntimeService,
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  onModuleDestroy(): void {
    this.running = false;
  }

  @Interval(CLEANUP_INTERVAL_MS)
  async checkIdleSessions(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    try {
      await this.performCleanup();
    } finally {
      this.running = false;
    }
  }

  private async performCleanup(): Promise<void> {
    const settings = await this.settingsRepository.get();

    if (!settings.general.idleCleanupEnabled) {
      return;
    }

    const timeoutMinutes = settings.general.idleTimeoutMinutes;
    const expiredSessions =
      await this.sessionRepository.findExpiredSessions(timeoutMinutes);

    if (expiredSessions.length === 0) {
      return;
    }

    this.logger.log(
      `Found ${expiredSessions.length} idle session(s) exceeding ${timeoutMinutes}m timeout`,
    );

    for (const session of expiredSessions) {
      await this.stopIdleSession(session.id, timeoutMinutes);
    }
  }

  private async stopIdleSession(
    sessionId: string,
    timeoutMinutes: number,
  ): Promise<void> {
    try {
      await this.sessionRuntime.stopSession(new SessionIdDto(sessionId));
      this._sessionsAutoStopped++;
      this.logger.log('Auto-stopped idle session', {
        sessionId,
        reason: `inactive for >${timeoutMinutes}m`,
        totalAutoStopped: this._sessionsAutoStopped,
      });
    } catch (error) {
      this.logger.warn('Failed to auto-stop idle session', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  getSessionsAutoStoppedCount(): number {
    return this._sessionsAutoStopped;
  }
}
