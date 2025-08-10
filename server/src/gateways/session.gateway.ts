import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SessionSubscriptionService } from './session-subscription.service';
import { DockerEngineService } from '../services/docker/docker-engine.service';
import { SessionStatus } from '../domain/sessions/session-status.enum';

export interface SessionUpdate {
  type: 'status' | 'container' | 'logs';
  data: any;
}

@WebSocketGateway({
  namespace: '/sessions',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class SessionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(SessionGateway.name);

  constructor(
    private readonly sessionSubscriptionService: SessionSubscriptionService,
    private readonly dockerEngine: DockerEngineService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log('Client connected', {
      clientId: client.id,
    });
  }

  async handleDisconnect(client: Socket) {
    await this.sessionSubscriptionService.unsubscribeAll(client.id);
    this.logger.log('Client disconnected', { clientId: client.id });
  }

  @SubscribeMessage('subscribe.session')
  async handleSessionSubscription(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.sessionSubscriptionService.subscribe(
        client.id,
        data.sessionId,
      );

      client.join(`session:${data.sessionId}`);

      return {
        event: 'subscription.success',
        data: { sessionId: data.sessionId },
      };
    } catch (error) {
      return {
        event: 'subscription.error',
        data: { error: error.message },
      };
    }
  }

  @SubscribeMessage('unsubscribe.session')
  async handleSessionUnsubscription(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.sessionSubscriptionService.unsubscribe(
      client.id,
      data.sessionId,
    );
    client.leave(`session:${data.sessionId}`);

    return {
      event: 'unsubscription.success',
      data: { sessionId: data.sessionId },
    };
  }

  @SubscribeMessage('subscribe.logs')
  async handleLogSubscription(
    @MessageBody() data: { sessionId: string; containerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Start streaming logs
      const stream = await this.dockerEngine.streamContainerLogs(
        data.containerId,
        (log: string) => {
          client.emit('log.data', {
            sessionId: data.sessionId,
            log,
            timestamp: new Date().toISOString(),
          });
        },
      );

      // Store stream reference for cleanup
      (client as any).logStream = stream;

      return {
        event: 'logs.subscribed',
        data: { sessionId: data.sessionId },
      };
    } catch (error) {
      return {
        event: 'logs.error',
        data: { error: error.message },
      };
    }
  }

  @SubscribeMessage('unsubscribe.logs')
  async handleLogUnsubscription(@ConnectedSocket() client: Socket) {
    const stream = (client as any).logStream;
    if (stream) {
      stream.destroy();
      delete (client as any).logStream;
    }

    return {
      event: 'logs.unsubscribed',
      data: {},
    };
  }

  // Emit session status updates
  emitSessionUpdate(sessionId: string, update: SessionUpdate) {
    this.server.to(`session:${sessionId}`).emit('session.updated', {
      sessionId,
      update,
      timestamp: new Date().toISOString(),
    });
  }

  emitSessionStatusChange(sessionId: string, status: SessionStatus) {
    this.server.to(`session:${sessionId}`).emit('session.status.changed', {
      sessionId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  emitGlobalUpdate(event: string, data: any) {
    this.server.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}
