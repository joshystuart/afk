import { Inject, Injectable, Logger } from '@nestjs/common';
import { SessionIdDtoFactory } from '../domain/sessions/session-id-dto.factory';
import { SessionRepository } from '../domain/sessions/session.repository';
import { SessionStatus } from '../domain/sessions/session-status.enum';
import { SESSION_REPOSITORY } from '../domain/sessions/session.tokens';
import { ContainerLogStreamService } from '../services/docker/container-log-stream.service';
import { GitWatcherService } from '../services/git-watcher/git-watcher.service';
import { SessionSubscriptionService } from './session-subscription.service';

export interface SessionGatewayLogPayload {
  sessionId: string;
  log: string;
  timestamp: string;
}

@Injectable()
export class SessionGatewaySubscriptionsService {
  private readonly logger = new Logger(SessionGatewaySubscriptionsService.name);

  constructor(
    private readonly sessionSubscriptionService: SessionSubscriptionService,
    private readonly containerLogStream: ContainerLogStreamService,
    private readonly gitWatcherService: GitWatcherService,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    private readonly sessionIdFactory: SessionIdDtoFactory,
  ) {}

  async handleDisconnect(clientId: string): Promise<void> {
    this.containerLogStream.removeAllSubscribersForSocket(clientId);

    const sessions =
      this.sessionSubscriptionService.getSessionsForClient(clientId);

    await this.sessionSubscriptionService.unsubscribeAll(clientId);

    for (const sessionId of sessions) {
      const remaining =
        this.sessionSubscriptionService.getSubscribersForSession(sessionId);
      if (remaining.length === 0) {
        await this.gitWatcherService.stopWatching(sessionId);
      }
    }
  }

  async subscribeToSession(clientId: string, sessionId: string): Promise<void> {
    await this.sessionSubscriptionService.subscribe(clientId, sessionId);

    this.recordSessionActivity(sessionId);
    this.queueGitWatcherStart(sessionId);
  }

  async unsubscribeFromSession(
    clientId: string,
    sessionId: string,
  ): Promise<void> {
    await this.sessionSubscriptionService.unsubscribe(clientId, sessionId);

    const remaining =
      this.sessionSubscriptionService.getSubscribersForSession(sessionId);
    if (remaining.length === 0) {
      await this.gitWatcherService.stopWatching(sessionId);
    }
  }

  async subscribeToLogs(
    clientId: string,
    sessionId: string,
    onLog: (payload: SessionGatewayLogPayload) => void,
  ): Promise<void> {
    const session = await this.sessionRepository.findById(
      this.sessionIdFactory.fromString(sessionId),
    );

    if (!session?.containerId) {
      throw new Error('No container found for session');
    }

    this.recordSessionActivity(sessionId);

    await this.containerLogStream.ensureRunningLogStream(
      sessionId,
      session.containerId,
    );
    this.containerLogStream.addSubscriber(
      sessionId,
      session.containerId,
      clientId,
      (log: string) => {
        onLog({
          sessionId,
          log,
          timestamp: this.nowIso(),
        });
      },
    );
  }

  unsubscribeFromLogs(clientId: string): void {
    this.containerLogStream.removeSubscriber(clientId);
  }

  recordSessionActivity(sessionId: string): void {
    void this.touchSession(sessionId);
  }

  private queueGitWatcherStart(sessionId: string): void {
    this.startGitWatcherIfRunning(sessionId).catch((error: unknown) => {
      this.logger.warn('Failed to start git watcher on subscribe', {
        sessionId,
        error: this.getErrorMessage(error),
      });
    });
  }

  private async touchSession(sessionId: string): Promise<void> {
    try {
      const session = await this.sessionRepository.findById(
        this.sessionIdFactory.fromString(sessionId),
      );
      if (session?.isRunning()) {
        session.markAsAccessed();
        await this.sessionRepository.save(session);
      }
    } catch (error: unknown) {
      this.logger.warn('Failed to mark session as accessed', {
        sessionId,
        error: this.getErrorMessage(error),
      });
    }
  }

  private async startGitWatcherIfRunning(sessionId: string): Promise<void> {
    if (this.gitWatcherService.isWatching(sessionId)) {
      return;
    }

    const session = await this.sessionRepository.findById(
      this.sessionIdFactory.fromString(sessionId),
    );

    if (
      session &&
      session.status === SessionStatus.RUNNING &&
      session.containerId
    ) {
      await this.gitWatcherService.startWatching(
        sessionId,
        session.containerId,
      );
    }
  }

  private nowIso(): string {
    return new Date().toISOString();
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
