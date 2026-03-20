import { Injectable } from '@nestjs/common';
import { ContainerLogStreamService } from '../docker/container-log-stream.service';
import { ChatService } from '../chat/chat.service';
import {
  ArchiveMetrics,
  ClaudeEventArchiveService,
} from '../stream-archive/claude-event-archive.service';
import { SessionIdleCleanupService } from '../sessions/session-idle-cleanup.service';
import { SessionSubscriptionService } from '../../gateways/session-subscription.service';
import { SessionRepository } from '../repositories/session.repository';
import { SessionStatus } from '../../domain/sessions/session-status.enum';

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
