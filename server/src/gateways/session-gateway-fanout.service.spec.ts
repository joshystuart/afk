import { Server } from 'socket.io';
import { SessionStatus } from '../domain/sessions/session-status.enum';
import { SOCKET_EVENTS } from './session-gateway.events';
import { SessionGatewayFanoutService } from './session-gateway-fanout.service';

describe('SessionGatewayFanoutService', () => {
  let service: SessionGatewayFanoutService;
  let roomEmitter: { emit: jest.Mock };
  let server: jest.Mocked<Server>;

  beforeEach(() => {
    roomEmitter = {
      emit: jest.fn(),
    };

    server = {
      emit: jest.fn(),
      to: jest.fn().mockReturnValue(roomEmitter),
    } as unknown as jest.Mocked<Server>;

    service = new SessionGatewayFanoutService();
  });

  it('fans out git status and session lifecycle updates to the session room', () => {
    service.handleGitStatusChanged(server, {
      sessionId: 'session-1',
      status: {
        branch: 'main',
        hasChanges: false,
        changedFileCount: 0,
      },
    });

    service.emitSessionUpdate(server, 'session-1', {
      type: 'status',
      data: { healthy: true },
    });

    service.emitSessionStatusChange(server, 'session-1', SessionStatus.RUNNING);

    expect(server.to).toHaveBeenCalledWith('session:session-1');
    expect(roomEmitter.emit).toHaveBeenCalledWith(
      SOCKET_EVENTS.sessionGitStatus,
      expect.objectContaining({
        sessionId: 'session-1',
        branch: 'main',
        timestamp: expect.any(String),
      }),
    );
    expect(roomEmitter.emit).toHaveBeenCalledWith(
      SOCKET_EVENTS.sessionUpdated,
      {
        sessionId: 'session-1',
        update: {
          type: 'status',
          data: { healthy: true },
        },
        timestamp: expect.any(String),
      },
    );
    expect(roomEmitter.emit).toHaveBeenCalledWith(
      SOCKET_EVENTS.sessionStatusChanged,
      {
        sessionId: 'session-1',
        status: SessionStatus.RUNNING,
        timestamp: expect.any(String),
      },
    );
  });

  it('adds timestamps to global events', () => {
    service.emitGlobalUpdate(server, 'custom.event', { ok: true });

    expect(server.emit).toHaveBeenCalledWith('custom.event', {
      ok: true,
      timestamp: expect.any(String),
    });
  });

  it('broadcasts delete lifecycle events to both the room and global listeners', () => {
    service.handleDeleteProgress(server, {
      sessionId: 'session-1',
      message: 'Deleting session',
    });
    service.handleSessionDeleted(server, { sessionId: 'session-1' });
    service.handleDeleteFailed(server, {
      sessionId: 'session-1',
      error: 'Permission denied',
    });

    expect(roomEmitter.emit).toHaveBeenCalledWith(
      SOCKET_EVENTS.sessionDeleteProgress,
      {
        sessionId: 'session-1',
        message: 'Deleting session',
        timestamp: expect.any(String),
      },
    );
    expect(roomEmitter.emit).toHaveBeenCalledWith(
      SOCKET_EVENTS.sessionDeleted,
      {
        sessionId: 'session-1',
        timestamp: expect.any(String),
      },
    );
    expect(roomEmitter.emit).toHaveBeenCalledWith(
      SOCKET_EVENTS.sessionDeleteFailed,
      {
        sessionId: 'session-1',
        error: 'Permission denied',
        timestamp: expect.any(String),
      },
    );
    expect(server.emit).toHaveBeenCalledWith(
      SOCKET_EVENTS.sessionDeleteProgress,
      expect.objectContaining({
        sessionId: 'session-1',
        message: 'Deleting session',
      }),
    );
    expect(server.emit).toHaveBeenCalledWith(
      SOCKET_EVENTS.sessionDeleted,
      expect.objectContaining({
        sessionId: 'session-1',
      }),
    );
    expect(server.emit).toHaveBeenCalledWith(
      SOCKET_EVENTS.sessionDeleteFailed,
      expect.objectContaining({
        sessionId: 'session-1',
        error: 'Permission denied',
      }),
    );
  });
});
