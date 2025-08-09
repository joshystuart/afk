import { Injectable } from '@nestjs/common';
import { Session } from '../../domain/sessions/session.entity';
import { SessionIdDto } from '../../domain/sessions/session-id.dto';
import { SessionStatus } from '../../domain/sessions/session-status.enum';

export interface SessionFilters {
  status?: SessionStatus;
  userId?: string;
}

@Injectable()
export class SessionRepository {
  private sessions: Map<string, Session> = new Map();

  async save(session: Session): Promise<void> {
    this.sessions.set(session.id.toString(), session);
  }

  async findById(id: SessionIdDto): Promise<Session | null> {
    return this.sessions.get(id.toString()) || null;
  }

  async findAll(filters?: SessionFilters): Promise<Session[]> {
    let sessions = Array.from(this.sessions.values());

    if (filters) {
      if (filters.status) {
        sessions = sessions.filter((s) => s.status === filters.status);
      }
      // Note: userId filtering would need to be implemented when user system is added
    }

    return sessions;
  }

  async delete(id: SessionIdDto): Promise<void> {
    this.sessions.delete(id.toString());
  }

  async exists(id: SessionIdDto): Promise<boolean> {
    return this.sessions.has(id.toString());
  }

  async count(filters?: SessionFilters): Promise<number> {
    const sessions = await this.findAll(filters);
    return sessions.length;
  }

  async findByContainerId(containerId: string): Promise<Session | null> {
    const sessions = Array.from(this.sessions.values());
    return sessions.find((s) => s.containerId === containerId) || null;
  }

  async findExpiredSessions(timeoutMinutes: number): Promise<Session[]> {
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    const sessions = Array.from(this.sessions.values());

    return sessions.filter(
      (s) =>
        s.status === SessionStatus.RUNNING &&
        s.lastAccessedAt &&
        s.lastAccessedAt < cutoffTime,
    );
  }
}
