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
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import {
  SessionGatewayLogPayload,
  SessionGatewaySubscriptionsService,
} from './session-gateway-subscriptions.service';
import {
  GATEWAY_EVENTS,
  getSessionRoom,
  SOCKET_EVENTS,
} from './session-gateway.events';
import { JOB_RUN_EVENTS } from '../libs/scheduled-jobs/job-run-events';
import { SessionStatus } from '../domain/sessions/session-status.enum';
import { SessionGatewayChatService } from './session-gateway-chat.service';
import {
  DeleteCompletedPayload,
  DeleteFailedPayload,
  DeleteProgressPayload,
  GitStatusChangedPayload,
  SessionGatewayFanoutService,
  SessionUpdate,
} from './session-gateway-fanout.service';
import {
  JobRunStreamPayload,
  JobRunSubscriptionPayload,
  JobRunUpdatedPayload,
  SessionGatewayJobRunsService,
} from './session-gateway-job-runs.service';
import { SessionGatewayTerminalService } from './session-gateway-terminal.service';

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
    private readonly sessionGatewaySubscriptionsService: SessionGatewaySubscriptionsService,
    private readonly sessionGatewayChatService: SessionGatewayChatService,
    private readonly sessionGatewayJobRunsService: SessionGatewayJobRunsService,
    private readonly sessionGatewayFanoutService: SessionGatewayFanoutService,
    private readonly sessionGatewayTerminalService: SessionGatewayTerminalService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log('Client connected', {
      clientId: client.id,
    });
  }

  async handleDisconnect(client: Socket) {
    await this.sessionGatewayTerminalService.handleDisconnect(client.id);
    await this.sessionGatewaySubscriptionsService.handleDisconnect(client.id);

    this.logger.log('Client disconnected', { clientId: client.id });
  }

  @SubscribeMessage(SOCKET_EVENTS.subscribeSession)
  async handleSessionSubscription(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.sessionGatewaySubscriptionsService.subscribeToSession(
        client.id,
        data.sessionId,
      );

      client.join(getSessionRoom(data.sessionId));
      this.sessionGatewayChatService.emitChatStatus(client, data.sessionId);

      return {
        event: SOCKET_EVENTS.subscriptionSuccess,
        data: { sessionId: data.sessionId },
      };
    } catch (error) {
      return {
        event: SOCKET_EVENTS.subscriptionError,
        data: { error: error.message },
      };
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.unsubscribeSession)
  async handleSessionUnsubscription(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.sessionGatewaySubscriptionsService.unsubscribeFromSession(
      client.id,
      data.sessionId,
    );
    client.leave(getSessionRoom(data.sessionId));

    return {
      event: SOCKET_EVENTS.unsubscriptionSuccess,
      data: { sessionId: data.sessionId },
    };
  }

  @SubscribeMessage(SOCKET_EVENTS.subscribeLogs)
  async handleLogSubscription(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.sessionGatewaySubscriptionsService.subscribeToLogs(
        client.id,
        data.sessionId,
        (payload: SessionGatewayLogPayload) => {
          client.emit(SOCKET_EVENTS.logData, {
            sessionId: payload.sessionId,
            log: payload.log,
            timestamp: payload.timestamp,
          });
        },
      );

      return {
        event: SOCKET_EVENTS.logsSubscribed,
        data: { sessionId: data.sessionId },
      };
    } catch (error) {
      return {
        event: SOCKET_EVENTS.logsError,
        data: { error: error.message },
      };
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.unsubscribeLogs)
  async handleLogUnsubscription(@ConnectedSocket() client: Socket) {
    this.sessionGatewaySubscriptionsService.unsubscribeFromLogs(client.id);

    return {
      event: SOCKET_EVENTS.logsUnsubscribed,
      data: {},
    };
  }

  @SubscribeMessage(SOCKET_EVENTS.subscribeJobRun)
  async handleJobRunSubscription(
    @MessageBody() data: JobRunSubscriptionPayload,
    @ConnectedSocket() client: Socket,
  ) {
    return this.sessionGatewayJobRunsService.handleJobRunSubscription(
      client,
      data,
    );
  }

  @SubscribeMessage(SOCKET_EVENTS.unsubscribeJobRun)
  async handleJobRunUnsubscription(
    @MessageBody() data: JobRunSubscriptionPayload,
    @ConnectedSocket() client: Socket,
  ) {
    return this.sessionGatewayJobRunsService.handleJobRunUnsubscription(
      client,
      data,
    );
  }

  @OnEvent(JOB_RUN_EVENTS.stream)
  handleJobRunStream(payload: JobRunStreamPayload) {
    this.sessionGatewayJobRunsService.handleJobRunStream(this.server, payload);
  }

  @OnEvent(JOB_RUN_EVENTS.updated)
  async handleScheduledJobRunUpdated(payload: JobRunUpdatedPayload) {
    await this.sessionGatewayJobRunsService.handleScheduledJobRunUpdated(
      this.server,
      payload,
    );
  }

  // Listen for git status changes from GitWatcherService
  @OnEvent(GATEWAY_EVENTS.gitStatusChanged)
  handleGitStatusChanged(payload: GitStatusChangedPayload) {
    this.sessionGatewayFanoutService.handleGitStatusChanged(
      this.server,
      payload,
    );
  }

  // Emit session status updates
  emitSessionUpdate(sessionId: string, update: SessionUpdate) {
    this.sessionGatewayFanoutService.emitSessionUpdate(
      this.server,
      sessionId,
      update,
    );
  }

  emitSessionStatusChange(sessionId: string, status: SessionStatus) {
    this.sessionGatewayFanoutService.emitSessionStatusChange(
      this.server,
      sessionId,
      status,
    );
  }

  emitGlobalUpdate(event: string, data: Record<string, unknown>) {
    this.sessionGatewayFanoutService.emitGlobalUpdate(this.server, event, data);
  }

  @SubscribeMessage(SOCKET_EVENTS.chatSend)
  async handleChatSend(
    @MessageBody()
    data: {
      sessionId: string;
      content: string;
      continueConversation: boolean;
      model?: string;
    },
    @ConnectedSocket() _client: Socket,
  ) {
    return this.sessionGatewayChatService.handleChatSend(this.server, data);
  }

  @SubscribeMessage(SOCKET_EVENTS.chatCancel)
  async handleChatCancel(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() _client: Socket,
  ) {
    return this.sessionGatewayChatService.handleChatCancel(data);
  }

  @SubscribeMessage(SOCKET_EVENTS.terminalStart)
  async handleTerminalStart(
    @MessageBody() data: { sessionId: string; cols: number; rows: number },
    @ConnectedSocket() client: Socket,
  ) {
    return this.sessionGatewayTerminalService.handleTerminalStart(
      this.server,
      client,
      data,
    );
  }

  @SubscribeMessage(SOCKET_EVENTS.terminalInput)
  handleTerminalInput(
    @MessageBody() data: { sessionId: string; data: string },
    @ConnectedSocket() client: Socket,
  ) {
    return this.sessionGatewayTerminalService.handleTerminalInput(client, data);
  }

  @SubscribeMessage(SOCKET_EVENTS.terminalResize)
  async handleTerminalResize(
    @MessageBody() data: { sessionId: string; cols: number; rows: number },
    @ConnectedSocket() client: Socket,
  ) {
    return this.sessionGatewayTerminalService.handleTerminalResize(
      client,
      data,
    );
  }

  @SubscribeMessage(SOCKET_EVENTS.terminalClose)
  handleTerminalClose(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    return this.sessionGatewayTerminalService.handleTerminalClose(client, data);
  }

  @OnEvent(SOCKET_EVENTS.sessionDeleteProgress)
  handleDeleteProgress(payload: DeleteProgressPayload) {
    this.sessionGatewayFanoutService.handleDeleteProgress(this.server, payload);
  }

  @OnEvent(SOCKET_EVENTS.sessionDeleted)
  handleSessionDeleted(payload: DeleteCompletedPayload) {
    this.sessionGatewayFanoutService.handleSessionDeleted(this.server, payload);
  }

  @OnEvent(SOCKET_EVENTS.sessionDeleteFailed)
  handleDeleteFailed(payload: DeleteFailedPayload) {
    this.sessionGatewayFanoutService.handleDeleteFailed(this.server, payload);
  }
}
