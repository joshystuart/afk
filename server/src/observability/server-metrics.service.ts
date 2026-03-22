import { Inject, Injectable } from '@nestjs/common';
import { ChatService } from '../interactors/sessions/chat/chat.service';
import { SessionIdleCleanupService } from '../interactors/sessions/runtime/session-idle-cleanup.service';
import { SessionSubscriptionService } from '../gateways/session-subscription.service';
import { ContainerLogStreamService } from '../libs/docker/container-log-stream.service';
import {
  ArchiveMetrics,
  ClaudeEventArchiveService,
} from '../libs/stream-archive/claude-event-archive.service';
import { SessionRepository } from '../domain/sessions/session.repository';
import { SessionStatus } from '../domain/sessions/session-status.enum';
import { SESSION_REPOSITORY } from '../domain/sessions/session.tokens';

export interface ServerMetricsSnapshot {
  timestamp: string;
  uptime: number;
  dockerLogStreams: {
    activeStreams: number;
    totalSubscribers: number;
    streams: Array<{
      sessionId: string;
      containerId: string;
      subscriberCount: number;
      bytesSeen: number;
      startedAt: number;
      lastActivityAt: number;
    }>;
  };
  websocketSubscriptions: {
    sessions: number;
    clients: number;
  };
  claudeExecutions: {
    activeCount: number;
    activeSessionIds: string[];
  };
  streamArchive: ArchiveMetrics;
  idleCleanup: {
    sessionsAutoStopped: number;
  };
  sessions: {
    running: number;
    stopped: number;
    total: number;
  };
}

@Injectable()
export class ServerMetricsService {
  constructor(
    private readonly containerLogStream: ContainerLogStreamService,
    private readonly chatService: ChatService,
    private readonly claudeEventArchive: ClaudeEventArchiveService,
    private readonly sessionIdleCleanup: SessionIdleCleanupService,
    private readonly sessionSubscription: SessionSubscriptionService,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
  ) {}

  async getSnapshot(): Promise<ServerMetricsSnapshot> {
    const [runningCount, stoppedCount, totalCount] = await Promise.all([
      this.sessionRepository.count({ status: SessionStatus.RUNNING }),
      this.sessionRepository.count({ status: SessionStatus.STOPPED }),
      this.sessionRepository.count(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dockerLogStreams: this.containerLogStream.getMetrics(),
      websocketSubscriptions: this.sessionSubscription.getActiveSubscriptions(),
      claudeExecutions: {
        activeCount: this.chatService.getActiveExecutionCount(),
        activeSessionIds: this.chatService.getActiveSessionIds(),
      },
      streamArchive: this.claudeEventArchive.getMetrics(),
      idleCleanup: {
        sessionsAutoStopped:
          this.sessionIdleCleanup.getSessionsAutoStoppedCount(),
      },
      sessions: {
        running: runningCount,
        stopped: stoppedCount,
        total: totalCount,
      },
    };
  }
}
