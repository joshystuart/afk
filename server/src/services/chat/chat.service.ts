import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../../domain/chat/chat-message.entity';
import { ChatMessageRepository } from '../../domain/chat/chat-message.repository';
import { SessionRepository } from '../repositories/session.repository';
import { SessionIdDtoFactory } from '../../domain/sessions/session-id-dto.factory';
import { SessionStatus } from '../../domain/sessions/session-status.enum';
import { DockerEngineService } from '../docker/docker-engine.service';
import { NdjsonParser } from './ndjson-parser';

export interface ChatStreamEvent {
  type: string;
  [key: string]: any;
}

export interface SendMessageOptions {
  continueConversation: boolean;
  model?: string;
}

export interface SendMessageResult {
  userMessageId: string;
  assistantMessageId: string;
  kill: () => Promise<void>;
}

interface ActiveExecution {
  kill: () => Promise<void>;
  assistantMessageId: string;
}

@Injectable()
export class ChatService {
  private static readonly PERSIST_INTERVAL_EVENTS = 15;

  private readonly logger = new Logger(ChatService.name);
  private readonly activeExecutions = new Map<string, ActiveExecution>();

  constructor(
    private readonly chatMessageRepository: ChatMessageRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionIdFactory: SessionIdDtoFactory,
    private readonly dockerEngine: DockerEngineService,
  ) {}

  async sendMessage(
    sessionId: string,
    content: string,
    options: SendMessageOptions,
    onStreamEvent: (event: ChatStreamEvent) => void,
    onComplete: (info: {
      assistantMessageId: string;
      conversationId: string | null;
      costUsd: number | null;
      durationMs: number;
    }) => void,
    onError: (error: Error) => void,
  ): Promise<SendMessageResult> {
    if (this.activeExecutions.has(sessionId)) {
      throw new Error('A prompt is already running for this session');
    }

    const session = await this.sessionRepository.findById(
      this.sessionIdFactory.fromString(sessionId),
    );

    if (!session) {
      throw new Error('Session not found');
    }
    if (session.status !== SessionStatus.RUNNING || !session.containerId) {
      throw new Error('Session is not running');
    }

    const userMessageId = uuidv4();
    const userMessage = new ChatMessage({
      id: userMessageId,
      sessionId,
      role: 'user',
      content,
      isContinuation: options.continueConversation,
    });
    await this.chatMessageRepository.save(userMessage);

    const assistantMessageId = uuidv4();
    const startTime = Date.now();
    const cmd = this.buildClaudeCommand(
      content,
      options.continueConversation,
      options.model,
    );

    this.logger.log('Executing Claude command', {
      sessionId,
      assistantMessageId,
      cmd: cmd.join(' '),
    });

    const parser = new NdjsonParser();
    const streamEvents: any[] = [];
    let conversationId: string | null = null;
    let costUsd: number | null = null;
    let resultContent = '';

    // Persist placeholder so partial output survives navigation away or server restart
    await this.chatMessageRepository.save(
      new ChatMessage({
        id: assistantMessageId,
        sessionId,
        role: 'assistant',
        content: '',
        streamEvents: [],
        conversationId: null,
        isContinuation: options.continueConversation,
        costUsd: null,
        durationMs: null,
      }),
    );

    let lastPersistedCount = 0;
    let pendingPersist: Promise<void> | null = null;

    const persistPartialStream = () => {
      const eventsSnapshot = [...streamEvents];
      pendingPersist = this.chatMessageRepository
        .updateMessage(assistantMessageId, { streamEvents: eventsSnapshot })
        .catch((err) =>
          this.logger.warn('Failed to persist partial stream', {
            sessionId,
            error: err instanceof Error ? err.message : String(err),
          }),
        )
        .finally(() => {
          pendingPersist = null;
        });
    };

    // Guard: completion logic can be triggered by the `result` event
    // (preferred) or by stream `end`/`error` — whichever fires first.
    let completed = false;

    const finalize = async (killStream: () => Promise<void>) => {
      if (completed) return;
      completed = true;

      if (pendingPersist) {
        await pendingPersist.catch(() => {});
      }

      const durationMs = Date.now() - startTime;

      try {
        await this.chatMessageRepository.updateMessage(assistantMessageId, {
          content: resultContent,
          streamEvents,
          conversationId,
          costUsd,
          durationMs,
        });

        this.logger.log('Claude execution completed', {
          sessionId,
          assistantMessageId,
          durationMs,
          costUsd,
          conversationId,
        });

        onComplete({
          assistantMessageId,
          conversationId,
          costUsd,
          durationMs,
        });
      } catch (err) {
        this.logger.error('Failed to save assistant message', err);
        onError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        this.activeExecutions.delete(sessionId);
      }

      // Claude CLI hangs after emitting the result event (known bug).
      // Kill the Docker exec process so it doesn't linger.
      killStream().catch((err) =>
        this.logger.warn('Error killing exec stream after completion', {
          sessionId,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    };

    try {
      const { stream, kill } = await this.dockerEngine.execStreamInContainer(
        session.containerId,
        cmd,
        (chunk: string) => {
          const events = parser.parse(chunk);
          for (const event of events) {
            streamEvents.push(event);
            onStreamEvent(event);

            if (event.type === 'result') {
              conversationId = event.session_id ?? null;
              costUsd = event.cost_usd ?? null;
              resultContent = event.result ?? '';

              // Don't await — let the stream handler return so the event
              // loop can process the kill and subsequent end/error events.
              finalize(kill);
            }
          }

          const delta = streamEvents.length - lastPersistedCount;
          if (delta >= ChatService.PERSIST_INTERVAL_EVENTS && !pendingPersist) {
            lastPersistedCount = streamEvents.length;
            persistPartialStream();
          }
        },
        '/workspace/repo',
      );

      this.activeExecutions.set(sessionId, { kill, assistantMessageId });

      const wrappedKill = async () => {
        await kill();
        this.activeExecutions.delete(sessionId);
      };

      // Fallback: if the stream ends naturally (e.g. future CLI fix),
      // finalize here so nothing is lost.
      stream.on('end', async () => {
        const remaining = parser.flush();
        for (const event of remaining) {
          streamEvents.push(event);
          onStreamEvent(event);
          if (event.type === 'result') {
            conversationId = event.session_id ?? null;
            costUsd = event.cost_usd ?? null;
            resultContent = event.result ?? '';
          }
        }
        await finalize(kill);
      });

      stream.on('error', async (err: Error) => {
        if (completed) {
          // Stream error after we already finalized (expected when we
          // kill the hanging process) — ignore silently.
          return;
        }

        this.activeExecutions.delete(sessionId);
        this.logger.error('Stream error during Claude execution', {
          sessionId,
          error: err.message,
        });

        if (streamEvents.length > 0) {
          const durationMs = Date.now() - startTime;
          await this.chatMessageRepository
            .updateMessage(assistantMessageId, {
              content: resultContent || '(interrupted)',
              streamEvents,
              conversationId,
              costUsd,
              durationMs,
            })
            .catch((persistErr) =>
              this.logger.warn('Failed to persist partial stream on error', {
                sessionId,
                error:
                  persistErr instanceof Error
                    ? persistErr.message
                    : String(persistErr),
              }),
            );
        } else {
          await this.chatMessageRepository
            .deleteById(assistantMessageId)
            .catch(() => {});
        }

        onError(err);
      });

      return { userMessageId, assistantMessageId, kill: wrappedKill };
    } catch (err) {
      this.activeExecutions.delete(sessionId);
      await this.chatMessageRepository
        .deleteById(assistantMessageId)
        .catch(() => {});
      throw err;
    }
  }

  async cancelExecution(sessionId: string): Promise<void> {
    const execution = this.activeExecutions.get(sessionId);
    if (!execution) {
      throw new Error('No active execution for this session');
    }
    await execution.kill();
    this.activeExecutions.delete(sessionId);
    this.logger.log('Execution cancelled', { sessionId });
  }

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    return this.chatMessageRepository.findBySessionId(sessionId);
  }

  isExecuting(sessionId: string): boolean {
    return this.activeExecutions.has(sessionId);
  }

  getExecutionInfo(sessionId: string): { assistantMessageId: string } | null {
    const execution = this.activeExecutions.get(sessionId);
    return execution
      ? { assistantMessageId: execution.assistantMessageId }
      : null;
  }

  private buildClaudeCommand(
    prompt: string,
    continueConversation: boolean,
    model?: string,
  ): string[] {
    const cmd = [
      'claude',
      '-p',
      prompt,
      '--output-format',
      'stream-json',
      '--verbose',
      '--dangerously-skip-permissions',
      '--include-partial-messages',
    ];

    if (model) {
      cmd.push('--model', model);
    }

    if (continueConversation) {
      cmd.push('--continue');
    }

    return cmd;
  }
}
