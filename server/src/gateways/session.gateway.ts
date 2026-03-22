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
  getJobRunRoom,
  getSessionRoom,
  SOCKET_EVENTS,
} from './session-gateway.events';
import { GitStatusResult } from '../services/git/git.service';
import { SessionStatus } from '../domain/sessions/session-status.enum';
import { ScheduledJobRepository } from '../domain/scheduled-jobs/scheduled-job.repository';
import { ScheduledJobRunRepository } from '../domain/scheduled-jobs/scheduled-job-run.repository';
import { ScheduledJobRunStatus } from '../domain/scheduled-jobs/scheduled-job-run-status.enum';
import { JOB_RUN_EVENTS } from '../libs/scheduled-jobs/job-run-events';
import { ScheduledJobGatewayResponseFactory } from './scheduled-job-gateway-response.factory';
import { SessionGatewayChatService } from './session-gateway-chat.service';

export interface SessionUpdate {
  type: 'status' | 'container' | 'logs';
  data: any;
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
    private readonly scheduledJobRepository: ScheduledJobRepository,
    private readonly scheduledJobRunRepository: ScheduledJobRunRepository,
    private readonly scheduledJobGatewayResponseFactory: ScheduledJobGatewayResponseFactory,
  ) {}

  private nowIso(): string {
    return new Date().toISOString();
  }

  async handleConnection(client: Socket) {
    this.logger.log('Client connected', {
      clientId: client.id,
    });
  }

  async handleDisconnect(client: Socket) {
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
    @MessageBody() data: { runId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const run = await this.scheduledJobRunRepository.findById(data.runId);
    if (!run) {
      return {
        event: SOCKET_EVENTS.jobRunError,
        data: { runId: data.runId, error: 'Scheduled job run not found' },
      };
    }

    client.emit(SOCKET_EVENTS.jobRunUpdated, {
      run: this.scheduledJobGatewayResponseFactory.createRun(run),
      timestamp: this.nowIso(),
    });

    if (run.status !== ScheduledJobRunStatus.RUNNING) {
      return {
        event: SOCKET_EVENTS.jobRunSubscribed,
        data: { runId: data.runId, active: false },
      };
    }

    await client.join(getJobRunRoom(data.runId));

    return {
      event: SOCKET_EVENTS.jobRunSubscribed,
      data: { runId: data.runId, active: true },
    };
  }

  @SubscribeMessage(SOCKET_EVENTS.unsubscribeJobRun)
  async handleJobRunUnsubscription(
    @MessageBody() data: { runId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(getJobRunRoom(data.runId));

    return {
      event: SOCKET_EVENTS.jobRunUnsubscribed,
      data: { runId: data.runId },
    };
  }

  @OnEvent(JOB_RUN_EVENTS.stream)
  handleJobRunStream(payload: {
    jobId: string;
    runId: string;
    event: unknown;
  }) {
    this.server
      .to(getJobRunRoom(payload.runId))
      .emit(SOCKET_EVENTS.jobRunStream, {
        jobId: payload.jobId,
        runId: payload.runId,
        event: payload.event,
        timestamp: this.nowIso(),
      });
  }

  @OnEvent(JOB_RUN_EVENTS.updated)
  async handleScheduledJobRunUpdated(payload: {
    jobId: string;
    runId: string;
  }) {
    const [job, run] = await Promise.all([
      this.scheduledJobRepository.findById(payload.jobId),
      this.scheduledJobRunRepository.findById(payload.runId),
    ]);

    if (run) {
      const runResponse =
        this.scheduledJobGatewayResponseFactory.createRun(run);

      this.server
        .to(getJobRunRoom(payload.runId))
        .emit(SOCKET_EVENTS.jobRunUpdated, {
          run: runResponse,
          timestamp: this.nowIso(),
        });

      this.server.emit(SOCKET_EVENTS.scheduledJobRunUpdated, {
        run: runResponse,
        timestamp: this.nowIso(),
      });
    }

    if (!job) {
      return;
    }

    const jobResponse =
      await this.scheduledJobGatewayResponseFactory.createJob(job);

    this.server.emit(SOCKET_EVENTS.scheduledJobUpdated, {
      job: jobResponse,
      timestamp: this.nowIso(),
    });
  }

  // Listen for git status changes from GitWatcherService
  @OnEvent(GATEWAY_EVENTS.gitStatusChanged)
  handleGitStatusChanged(payload: {
    sessionId: string;
    status: GitStatusResult;
  }) {
    this.server
      .to(getSessionRoom(payload.sessionId))
      .emit(SOCKET_EVENTS.sessionGitStatus, {
        sessionId: payload.sessionId,
        ...payload.status,
        timestamp: this.nowIso(),
      });
  }

  // Emit session status updates
  emitSessionUpdate(sessionId: string, update: SessionUpdate) {
    this.server
      .to(getSessionRoom(sessionId))
      .emit(SOCKET_EVENTS.sessionUpdated, {
        sessionId,
        update,
        timestamp: this.nowIso(),
      });
  }

  emitSessionStatusChange(sessionId: string, status: SessionStatus) {
    this.server
      .to(getSessionRoom(sessionId))
      .emit(SOCKET_EVENTS.sessionStatusChanged, {
        sessionId,
        status,
        timestamp: this.nowIso(),
      });
  }

  emitGlobalUpdate(event: string, data: any) {
    this.server.emit(event, {
      ...data,
      timestamp: this.nowIso(),
    });
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

  @OnEvent(SOCKET_EVENTS.sessionDeleteProgress)
  handleDeleteProgress(payload: DeleteProgressPayload) {
    this.server
      .to(getSessionRoom(payload.sessionId))
      .emit(SOCKET_EVENTS.sessionDeleteProgress, {
        sessionId: payload.sessionId,
        message: payload.message,
        timestamp: this.nowIso(),
      });

    this.server.emit(SOCKET_EVENTS.sessionDeleteProgress, {
      sessionId: payload.sessionId,
      message: payload.message,
      timestamp: this.nowIso(),
    });
  }

  @OnEvent(SOCKET_EVENTS.sessionDeleted)
  handleSessionDeleted(payload: DeleteCompletedPayload) {
    this.server
      .to(getSessionRoom(payload.sessionId))
      .emit(SOCKET_EVENTS.sessionDeleted, {
        sessionId: payload.sessionId,
        timestamp: this.nowIso(),
      });

    this.server.emit(SOCKET_EVENTS.sessionDeleted, {
      sessionId: payload.sessionId,
      timestamp: this.nowIso(),
    });
  }

  @OnEvent(SOCKET_EVENTS.sessionDeleteFailed)
  handleDeleteFailed(payload: DeleteFailedPayload) {
    this.server
      .to(getSessionRoom(payload.sessionId))
      .emit(SOCKET_EVENTS.sessionDeleteFailed, {
        sessionId: payload.sessionId,
        error: payload.error,
        timestamp: this.nowIso(),
      });

    this.server.emit(SOCKET_EVENTS.sessionDeleteFailed, {
      sessionId: payload.sessionId,
      error: payload.error,
      timestamp: this.nowIso(),
    });
  }
}
