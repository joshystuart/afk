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
import { GitStatusResult } from '../services/git/git.service';
import { SessionStatus } from '../domain/sessions/session-status.enum';
import { ChatService } from '../services/chat/chat.service';
import { ScheduledJobRepository } from '../domain/scheduled-jobs/scheduled-job.repository';
import { ScheduledJobRunRepository } from '../domain/scheduled-jobs/scheduled-job-run.repository';
import { ScheduledJobRunStatus } from '../domain/scheduled-jobs/scheduled-job-run-status.enum';
import { JOB_RUN_EVENTS } from '../libs/scheduled-jobs/job-run-events';
import { ScheduledJobGatewayResponseFactory } from './scheduled-job-gateway-response.factory';

const ROOM_PREFIX = 'session:';
const JOB_RUN_ROOM_PREFIX = 'job-run:';

const SOCKET_EVENTS = {
  subscribeSession: 'subscribe.session',
  unsubscribeSession: 'unsubscribe.session',
  subscribeLogs: 'subscribe.logs',
  unsubscribeLogs: 'unsubscribe.logs',
  subscribeJobRun: 'subscribe.job.run',
  unsubscribeJobRun: 'unsubscribe.job.run',
  chatSend: 'chat.send',
  chatCancel: 'chat.cancel',
  chatStatus: 'chat.status',
  chatStarted: 'chat.started',
  chatStream: 'chat.stream',
  chatComplete: 'chat.complete',
  chatError: 'chat.error',
  chatCancelled: 'chat.cancelled',
  logData: 'log.data',
  logsError: 'logs.error',
  logsSubscribed: 'logs.subscribed',
  logsUnsubscribed: 'logs.unsubscribed',
  jobRunSubscribed: 'job.run.subscribed',
  jobRunUnsubscribed: 'job.run.unsubscribed',
  jobRunStream: 'job.run.stream',
  jobRunUpdated: 'job.run.updated',
  jobRunError: 'job.run.error',
  scheduledJobUpdated: 'scheduled.job.updated',
  scheduledJobRunUpdated: 'scheduled.job.run.updated',
  subscriptionSuccess: 'subscription.success',
  subscriptionError: 'subscription.error',
  unsubscriptionSuccess: 'unsubscription.success',
  sessionGitStatus: 'session.git.status',
  sessionUpdated: 'session.updated',
  sessionStatusChanged: 'session.status.changed',
  sessionDeleteProgress: 'session.delete.progress',
  sessionDeleted: 'session.deleted',
  sessionDeleteFailed: 'session.delete.failed',
} as const;

const CHAT_STATUS = {
  executing: 'executing',
  idle: 'idle',
} as const;

const GATEWAY_EVENTS = {
  gitStatusChanged: 'git.status.changed',
} as const;

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
    private readonly chatService: ChatService,
    private readonly scheduledJobRepository: ScheduledJobRepository,
    private readonly scheduledJobRunRepository: ScheduledJobRunRepository,
    private readonly scheduledJobGatewayResponseFactory: ScheduledJobGatewayResponseFactory,
  ) {}

  private getSessionRoom(sessionId: string): string {
    return `${ROOM_PREFIX}${sessionId}`;
  }

  private getJobRunRoom(runId: string): string {
    return `${JOB_RUN_ROOM_PREFIX}${runId}`;
  }

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

      client.join(this.getSessionRoom(data.sessionId));

      // Sync current chat execution state so reconnecting clients
      // immediately know if Claude is mid-run
      const executionInfo = this.chatService.getExecutionInfo(data.sessionId);
      client.emit(SOCKET_EVENTS.chatStatus, {
        sessionId: data.sessionId,
        status: executionInfo ? CHAT_STATUS.executing : CHAT_STATUS.idle,
        assistantMessageId: executionInfo?.assistantMessageId ?? null,
      });

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
    client.leave(this.getSessionRoom(data.sessionId));

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

    await client.join(this.getJobRunRoom(data.runId));

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
    await client.leave(this.getJobRunRoom(data.runId));

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
      .to(this.getJobRunRoom(payload.runId))
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
        .to(this.getJobRunRoom(payload.runId))
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
      .to(this.getSessionRoom(payload.sessionId))
      .emit(SOCKET_EVENTS.sessionGitStatus, {
        sessionId: payload.sessionId,
        ...payload.status,
        timestamp: this.nowIso(),
      });
  }

  // Emit session status updates
  emitSessionUpdate(sessionId: string, update: SessionUpdate) {
    this.server
      .to(this.getSessionRoom(sessionId))
      .emit(SOCKET_EVENTS.sessionUpdated, {
        sessionId,
        update,
        timestamp: this.nowIso(),
      });
  }

  emitSessionStatusChange(sessionId: string, status: SessionStatus) {
    this.server
      .to(this.getSessionRoom(sessionId))
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
    const { sessionId, content, continueConversation, model } = data;
    this.logger.log('Chat message received', {
      sessionId,
      continueConversation,
    });

    this.sessionGatewaySubscriptionsService.recordSessionActivity(sessionId);

    try {
      const result = await this.chatService.sendMessage(
        sessionId,
        content,
        { continueConversation, model },
        (event) => {
          this.server
            .to(this.getSessionRoom(sessionId))
            .emit(SOCKET_EVENTS.chatStream, {
              sessionId,
              messageId: result.assistantMessageId,
              event,
            });
        },
        (info) => {
          this.server
            .to(this.getSessionRoom(sessionId))
            .emit(SOCKET_EVENTS.chatComplete, {
              sessionId,
              messageId: info.assistantMessageId,
              conversationId: info.conversationId,
              costUsd: info.costUsd,
              durationMs: info.durationMs,
            });
        },
        (error) => {
          this.server
            .to(this.getSessionRoom(sessionId))
            .emit(SOCKET_EVENTS.chatError, {
              sessionId,
              error: error.message,
            });
        },
      );

      return {
        event: SOCKET_EVENTS.chatStarted,
        data: {
          sessionId,
          userMessageId: result.userMessageId,
          assistantMessageId: result.assistantMessageId,
        },
      };
    } catch (error) {
      this.logger.error('Failed to start chat execution', {
        sessionId,
        error: error.message,
      });
      return {
        event: SOCKET_EVENTS.chatError,
        data: { sessionId, error: error.message },
      };
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.chatCancel)
  async handleChatCancel(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() _client: Socket,
  ) {
    this.sessionGatewaySubscriptionsService.recordSessionActivity(
      data.sessionId,
    );

    try {
      await this.chatService.cancelExecution(data.sessionId);
      return {
        event: SOCKET_EVENTS.chatCancelled,
        data: { sessionId: data.sessionId },
      };
    } catch (error) {
      return {
        event: SOCKET_EVENTS.chatError,
        data: { sessionId: data.sessionId, error: error.message },
      };
    }
  }

  @OnEvent(SOCKET_EVENTS.sessionDeleteProgress)
  handleDeleteProgress(payload: DeleteProgressPayload) {
    this.server
      .to(this.getSessionRoom(payload.sessionId))
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
      .to(this.getSessionRoom(payload.sessionId))
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
      .to(this.getSessionRoom(payload.sessionId))
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
