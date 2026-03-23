import { SessionIdDto } from './session-id.dto';
import { Session } from './session.entity';
import { SessionStatus } from './session-status.enum';

export interface SessionFilters {
  status?: SessionStatus;
  userId?: string;
}

export interface SessionRepository {
  save(session: Session): Promise<void>;
  findById(id: SessionIdDto): Promise<Session | null>;
  findAll(filters?: SessionFilters): Promise<Session[]>;
  delete(id: SessionIdDto): Promise<void>;
  exists(id: SessionIdDto): Promise<boolean>;
  count(filters?: SessionFilters): Promise<number>;
  findByContainerId(containerId: string): Promise<Session | null>;
  findExpiredSessions(timeoutMinutes: number): Promise<Session[]>;
}
