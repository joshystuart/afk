import { Inject, Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SessionRepository } from '../domain/sessions/session.repository';
import { SESSION_REPOSITORY } from '../domain/sessions/session.tokens';
import { SessionIdDtoFactory } from '../domain/sessions/session-id-dto.factory';
import { DockerEngineService } from '../libs/docker/docker-engine.service';
import { getExecWorkingDir } from '../libs/docker/docker.constants';
import { SOCKET_EVENTS } from './session-gateway.events';
import { SessionGatewaySubscriptionsService } from './session-gateway-subscriptions.service';
import { SessionSubscriptionService } from './session-subscription.service';

interface PtySession {
  stream: NodeJS.ReadWriteStream;
  execId: string;
  resize: (cols: number, rows: number) => Promise<void>;
  destroy: () => void;
}

const MIN_COLS = 1;
const MAX_COLS = 500;
const MIN_ROWS = 1;
const MAX_ROWS = 200;

@Injectable()
export class SessionGatewayTerminalService {
  private readonly logger = new Logger(SessionGatewayTerminalService.name);

  private activePtys = new Map<string, Map<string, PtySession>>();

  constructor(
    private readonly sessionGatewaySubscriptionsService: SessionGatewaySubscriptionsService,
    private readonly sessionSubscriptionService: SessionSubscriptionService,
    private readonly dockerEngine: DockerEngineService,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    private readonly sessionIdFactory: SessionIdDtoFactory,
  ) {}

  async handleTerminalStart(
    server: Server,
    client: Socket,
    data: { sessionId: string; cols: number; rows: number },
  ) {
    const { sessionId, cols, rows } = data;

    const subscribers =
      this.sessionSubscriptionService.getSubscribersForSession(sessionId);
    if (!subscribers.includes(client.id)) {
      return {
        event: SOCKET_EVENTS.terminalError,
        data: { sessionId, error: 'Not subscribed to session' },
      };
    }

    if (!this.validateDimensions(cols, rows)) {
      return {
        event: SOCKET_EVENTS.terminalError,
        data: {
          sessionId,
          error: `Invalid dimensions: cols must be ${MIN_COLS}-${MAX_COLS}, rows must be ${MIN_ROWS}-${MAX_ROWS}`,
        },
      };
    }

    this.destroyClientPty(sessionId, client.id);

    try {
      const session = await this.sessionRepository.findById(
        this.sessionIdFactory.fromString(sessionId),
      );

      if (!session?.containerId) {
        return {
          event: SOCKET_EVENTS.terminalError,
          data: { sessionId, error: 'No container found for session' },
        };
      }

      const workingDir = getExecWorkingDir(session.config?.repoUrl);
      const ptySession = await this.dockerEngine.execInteractive(
        session.containerId,
        cols,
        rows,
        workingDir,
      );

      this.storePty(sessionId, client.id, ptySession);

      ptySession.stream.on('data', (chunk: Buffer) => {
        client.emit(SOCKET_EVENTS.terminalData, {
          sessionId,
          data: chunk.toString('base64'),
        });
      });

      ptySession.stream.on('end', () => {
        this.destroyClientPty(sessionId, client.id);
        client.emit(SOCKET_EVENTS.terminalClose, { sessionId });
      });

      ptySession.stream.on('close', () => {
        this.destroyClientPty(sessionId, client.id);
      });

      this.sessionGatewaySubscriptionsService.recordSessionActivity(sessionId);

      return {
        event: SOCKET_EVENTS.terminalStarted,
        data: { sessionId },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to start terminal', {
        sessionId,
        error: message,
      });
      return {
        event: SOCKET_EVENTS.terminalError,
        data: { sessionId, error: message },
      };
    }
  }

  handleTerminalInput(
    client: Socket,
    data: { sessionId: string; data: string },
  ) {
    const { sessionId } = data;

    const subscribers =
      this.sessionSubscriptionService.getSubscribersForSession(sessionId);
    if (!subscribers.includes(client.id)) {
      return {
        event: SOCKET_EVENTS.terminalError,
        data: { sessionId, error: 'Not subscribed to session' },
      };
    }

    const ptySession = this.getClientPty(sessionId, client.id);
    if (!ptySession) {
      return {
        event: SOCKET_EVENTS.terminalError,
        data: { sessionId, error: 'No active terminal for session' },
      };
    }

    ptySession.stream.write(Buffer.from(data.data, 'base64'));
  }

  async handleTerminalResize(
    client: Socket,
    data: { sessionId: string; cols: number; rows: number },
  ) {
    const { sessionId, cols, rows } = data;

    if (!this.validateDimensions(cols, rows)) {
      return {
        event: SOCKET_EVENTS.terminalError,
        data: {
          sessionId,
          error: `Invalid dimensions: cols must be ${MIN_COLS}-${MAX_COLS}, rows must be ${MIN_ROWS}-${MAX_ROWS}`,
        },
      };
    }

    const ptySession = this.getClientPty(sessionId, client.id);
    if (!ptySession) {
      return;
    }

    try {
      await ptySession.resize(cols, rows);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn('Failed to resize terminal', {
        sessionId,
        error: message,
      });
    }
  }

  handleTerminalClose(client: Socket, data: { sessionId: string }) {
    this.destroyClientPty(data.sessionId, client.id);
  }

  async handleDisconnect(clientId: string): Promise<void> {
    for (const [sessionId, clientMap] of this.activePtys.entries()) {
      const ptySession = clientMap.get(clientId);
      if (ptySession) {
        ptySession.destroy();
        clientMap.delete(clientId);
        this.logger.debug('Cleaned up PTY on disconnect', {
          sessionId,
          clientId,
        });
      }
      if (clientMap.size === 0) {
        this.activePtys.delete(sessionId);
      }
    }
  }

  private validateDimensions(cols: number, rows: number): boolean {
    return (
      Number.isInteger(cols) &&
      Number.isInteger(rows) &&
      cols >= MIN_COLS &&
      cols <= MAX_COLS &&
      rows >= MIN_ROWS &&
      rows <= MAX_ROWS
    );
  }

  private storePty(
    sessionId: string,
    clientId: string,
    ptySession: PtySession,
  ): void {
    if (!this.activePtys.has(sessionId)) {
      this.activePtys.set(sessionId, new Map());
    }
    this.activePtys.get(sessionId)!.set(clientId, ptySession);
  }

  private getClientPty(
    sessionId: string,
    clientId: string,
  ): PtySession | undefined {
    return this.activePtys.get(sessionId)?.get(clientId);
  }

  private destroyClientPty(sessionId: string, clientId: string): void {
    const ptySession = this.activePtys.get(sessionId)?.get(clientId);
    if (ptySession) {
      ptySession.destroy();
      this.activePtys.get(sessionId)!.delete(clientId);
      if (this.activePtys.get(sessionId)!.size === 0) {
        this.activePtys.delete(sessionId);
      }
    }
  }
}
