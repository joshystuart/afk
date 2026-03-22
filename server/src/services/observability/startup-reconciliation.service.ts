import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { SessionStatus } from '../../domain/sessions/session-status.enum';
import { SessionRepository } from '../../domain/sessions/session.repository';
import { SESSION_REPOSITORY } from '../../domain/sessions/session.tokens';
import { DockerEngineService } from '../docker/docker-engine.service';
import { ContainerInfo } from '../../domain/containers/container.entity';
import { ChatMessageRepository } from '../../domain/chat/chat-message.repository';
import { ChatStreamChunkRepository } from '../../domain/chat/chat-stream-chunk.repository';

@Injectable()
export class StartupReconciliationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupReconciliationService.name);

  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    private readonly dockerEngine: DockerEngineService,
    private readonly chatMessageRepository: ChatMessageRepository,
    private readonly chatStreamChunkRepository: ChatStreamChunkRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.reconcile();
    } catch (error) {
      this.logger.error('Startup reconciliation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async reconcile(): Promise<void> {
    this.logger.log('Starting boot reconciliation...');

    const [sessionResults, staleMessageResults] = await Promise.allSettled([
      this.reconcileSessionsVsDocker(),
      this.detectStaleStreamData(),
    ]);

    if (sessionResults.status === 'rejected') {
      this.logger.error('Session reconciliation failed', {
        error: sessionResults.reason,
      });
    }
    if (staleMessageResults.status === 'rejected') {
      this.logger.error('Stale stream detection failed', {
        error: staleMessageResults.reason,
      });
    }

    this.logger.log('Boot reconciliation complete');
  }

  /**
   * Finds all sessions marked RUNNING in the DB, checks if their
   * containers actually exist and are running in Docker, and marks
   * orphaned sessions as STOPPED.
   *
   * Log stream registry is left untouched (it rebuilds lazily on
   * first subscriber).
   */
  private async reconcileSessionsVsDocker(): Promise<void> {
    const runningSessions = await this.sessionRepository.findAll({
      status: SessionStatus.RUNNING,
    });

    if (runningSessions.length === 0) {
      this.logger.log('No RUNNING sessions to reconcile');
      return;
    }

    let dockerContainers: ContainerInfo[];
    try {
      dockerContainers = await this.dockerEngine.listAFKContainers();
    } catch (error) {
      this.logger.warn(
        'Cannot list Docker containers during reconciliation; skipping session reconciliation',
        { error: error instanceof Error ? error.message : String(error) },
      );
      return;
    }

    const runningContainerIds = new Set(
      dockerContainers.filter((c) => c.state === 'running').map((c) => c.id),
    );

    let reconciled = 0;
    for (const session of runningSessions) {
      if (!session.containerId) {
        session.stop();
        await this.sessionRepository.save(session);
        reconciled++;
        this.logger.warn('Reconciled session with no container ID', {
          sessionId: session.id,
        });
        continue;
      }

      if (!runningContainerIds.has(session.containerId)) {
        session.stop();
        await this.sessionRepository.save(session);
        reconciled++;
        this.logger.warn(
          'Reconciled session whose container is no longer running',
          {
            sessionId: session.id,
            containerId: session.containerId,
          },
        );
      }
    }

    this.logger.log('Session reconciliation summary', {
      totalRunning: runningSessions.length,
      reconciled,
      stillRunning: runningSessions.length - reconciled,
    });
  }

  /**
   * Detects assistant messages that look like incomplete placeholders
   * (empty content, null durationMs) from interrupted runs. Logs
   * warnings so the operator has visibility.
   *
   * For messages with no associated stream chunks, cleans up the
   * empty placeholder. For messages with partial chunks, updates
   * summary fields from chunk data.
   */
  private async detectStaleStreamData(): Promise<void> {
    const allSessions = await this.sessionRepository.findAll();
    let stalePlaceholders = 0;
    let cleanedUp = 0;
    let patched = 0;

    for (const session of allSessions) {
      const messages = await this.chatMessageRepository.findBySessionId(
        session.id,
      );

      for (const msg of messages) {
        if (msg.role !== 'assistant') continue;
        if (msg.durationMs !== null) continue;
        if (msg.content && msg.content.length > 0) continue;

        stalePlaceholders++;

        const chunks =
          await this.chatStreamChunkRepository.findByMessageIdOrdered(msg.id);

        if (chunks.length === 0) {
          await this.chatMessageRepository.deleteById(msg.id);
          cleanedUp++;
          this.logger.debug('Cleaned up empty placeholder message', {
            messageId: msg.id,
            sessionId: session.id,
          });
        } else {
          const totalEventCount = chunks.reduce(
            (sum, c) => sum + c.eventCount,
            0,
          );
          const totalByteCount = chunks.reduce(
            (sum, c) => sum + c.byteLength,
            0,
          );
          await this.chatMessageRepository.updateMessage(msg.id, {
            content: '(interrupted)',
            streamEventCount: totalEventCount,
            streamByteCount: totalByteCount,
          });
          patched++;
          this.logger.debug('Patched incomplete message with chunk data', {
            messageId: msg.id,
            sessionId: session.id,
            eventCount: totalEventCount,
            byteCount: totalByteCount,
          });
        }
      }
    }

    if (stalePlaceholders > 0) {
      this.logger.log('Stale stream data summary', {
        stalePlaceholders,
        cleanedUp,
        patched,
      });
    } else {
      this.logger.log('No stale stream data found');
    }
  }
}
