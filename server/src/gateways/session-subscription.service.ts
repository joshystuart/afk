import { Injectable, Logger } from '@nestjs/common';
import { SessionRepository } from '../services/repositories/session.repository';
import { SessionIdDtoFactory } from '../domain/sessions/session-id-dto.factory';

@Injectable()
export class SessionSubscriptionService {
  private subscriptions = new Map<string, Set<string>>();
  private clientSessions = new Map<string, Set<string>>();
  private readonly logger = new Logger(SessionSubscriptionService.name);

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly sessionIdFactory: SessionIdDtoFactory,
  ) {}

  async subscribe(clientId: string, sessionId: string): Promise<void> {
    // Verify session exists
    const session = await this.sessionRepository.findById(
      this.sessionIdFactory.fromString(sessionId),
    );

    if (!session) {
      throw new Error('Session not found');
    }

    // Add subscription
    if (!this.subscriptions.has(sessionId)) {
      this.subscriptions.set(sessionId, new Set());
    }
    this.subscriptions.get(sessionId)!.add(clientId);

    // Track client's sessions
    if (!this.clientSessions.has(clientId)) {
      this.clientSessions.set(clientId, new Set());
    }
    this.clientSessions.get(clientId)!.add(sessionId);

    this.logger.debug('Client subscribed to session', { clientId, sessionId });
  }

  async unsubscribe(clientId: string, sessionId: string): Promise<void> {
    this.subscriptions.get(sessionId)?.delete(clientId);
    this.clientSessions.get(clientId)?.delete(sessionId);

    this.logger.debug('Client unsubscribed from session', {
      clientId,
      sessionId,
    });
  }

  async unsubscribeAll(clientId: string): Promise<void> {
    const sessions = this.clientSessions.get(clientId);

    if (sessions) {
      sessions.forEach((sessionId) => {
        this.subscriptions.get(sessionId)?.delete(clientId);
      });
      this.clientSessions.delete(clientId);
    }

    this.logger.debug('Client unsubscribed from all sessions', { clientId });
  }

  getSubscribersForSession(sessionId: string): string[] {
    return Array.from(this.subscriptions.get(sessionId) || []);
  }

  getSessionsForClient(clientId: string): string[] {
    return Array.from(this.clientSessions.get(clientId) || []);
  }

  getActiveSubscriptions(): { sessions: number; clients: number } {
    return {
      sessions: this.subscriptions.size,
      clients: this.clientSessions.size,
    };
  }
}
