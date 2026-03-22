import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { SessionStatus } from '../domain/sessions/session-status.enum';
import { GitStatusResult } from '../libs/git/git.service';
import { getSessionRoom, SOCKET_EVENTS } from './session-gateway.events';

export interface SessionUpdate {
  type: 'status' | 'container' | 'logs';
  data: unknown;
}

export interface GitStatusChangedPayload {
  sessionId: string;
  status: GitStatusResult;
}

export interface DeleteProgressPayload {
  sessionId: string;
  message: string;
}

export interface DeleteCompletedPayload {
  sessionId: string;
}

export interface DeleteFailedPayload {
  sessionId: string;
  error: string;
}

@Injectable()
export class SessionGatewayFanoutService {
  handleGitStatusChanged(
    server: Server,
    payload: GitStatusChangedPayload,
  ): void {
    server
      .to(getSessionRoom(payload.sessionId))
      .emit(SOCKET_EVENTS.sessionGitStatus, {
        sessionId: payload.sessionId,
        ...payload.status,
        timestamp: this.nowIso(),
      });
  }

  emitSessionUpdate(
    server: Server,
    sessionId: string,
    update: SessionUpdate,
  ): void {
    server.to(getSessionRoom(sessionId)).emit(SOCKET_EVENTS.sessionUpdated, {
      sessionId,
      update,
      timestamp: this.nowIso(),
    });
  }

  emitSessionStatusChange(
    server: Server,
    sessionId: string,
    status: SessionStatus,
  ): void {
    server
      .to(getSessionRoom(sessionId))
      .emit(SOCKET_EVENTS.sessionStatusChanged, {
        sessionId,
        status,
        timestamp: this.nowIso(),
      });
  }

  emitGlobalUpdate(
    server: Server,
    event: string,
    data: Record<string, unknown>,
  ): void {
    server.emit(event, {
      ...data,
      timestamp: this.nowIso(),
    });
  }

  handleDeleteProgress(server: Server, payload: DeleteProgressPayload): void {
    server
      .to(getSessionRoom(payload.sessionId))
      .emit(SOCKET_EVENTS.sessionDeleteProgress, {
        sessionId: payload.sessionId,
        message: payload.message,
        timestamp: this.nowIso(),
      });

    server.emit(SOCKET_EVENTS.sessionDeleteProgress, {
      sessionId: payload.sessionId,
      message: payload.message,
      timestamp: this.nowIso(),
    });
  }

  handleSessionDeleted(server: Server, payload: DeleteCompletedPayload): void {
    server
      .to(getSessionRoom(payload.sessionId))
      .emit(SOCKET_EVENTS.sessionDeleted, {
        sessionId: payload.sessionId,
        timestamp: this.nowIso(),
      });

    server.emit(SOCKET_EVENTS.sessionDeleted, {
      sessionId: payload.sessionId,
      timestamp: this.nowIso(),
    });
  }

  handleDeleteFailed(server: Server, payload: DeleteFailedPayload): void {
    server
      .to(getSessionRoom(payload.sessionId))
      .emit(SOCKET_EVENTS.sessionDeleteFailed, {
        sessionId: payload.sessionId,
        error: payload.error,
        timestamp: this.nowIso(),
      });

    server.emit(SOCKET_EVENTS.sessionDeleteFailed, {
      sessionId: payload.sessionId,
      error: payload.error,
      timestamp: this.nowIso(),
    });
  }

  private nowIso(): string {
    return new Date().toISOString();
  }
}
