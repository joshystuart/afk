import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../../domain/chat/chat-message.entity';
import { ChatMessageRepository } from '../../domain/chat/chat-message.repository';
import { SessionRepository } from '../repositories/session.repository';
import { SessionIdDtoFactory } from '../../domain/sessions/session-id-dto.factory';
import { SessionStatus } from '../../domain/sessions/session-status.enum';
import {
  ClaudeStreamExecutionError,
  ClaudeStreamRunnerService,
} from './claude-stream-runner.service';

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
    private readonly claudeStreamRunner: ClaudeStreamRunnerService,
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
    const executionOptions = {
      containerId: session.containerId,
      prompt: content,
      continueConversation: options.continueConversation,
      model: options.model,
      includePartialMessages: true,
      persistEveryEvents: ChatService.PERSIST_INTERVAL_EVENTS,
      workingDir: '/workspace/repo',
    };

    this.logger.log('Executing Claude command', {
      sessionId,
      assistantMessageId,
      promptLength: content.length,
      continueConversation: options.continueConversation,
      model: options.model,
    });

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

    try {
      const execution = await this.claudeStreamRunner.startPrompt({
        ...executionOptions,
        onEvent: onStreamEvent,
        onPersistSnapshot: async (streamEvents) => {
          await this.chatMessageRepository.updateMessage(assistantMessageId, {
            streamEvents,
          });
        },
      });

      this.activeExecutions.set(sessionId, {
        kill: execution.kill,
        assistantMessageId,
      });

      const wrappedKill = async () => {
        await execution.kill();
        this.activeExecutions.delete(sessionId);
      };

      execution.result
        .then(async (result) => {
          try {
            await this.chatMessageRepository.updateMessage(assistantMessageId, {
              content: result.resultContent,
              streamEvents: result.streamEvents,
              conversationId: result.conversationId,
              costUsd: result.costUsd,
              durationMs: result.durationMs,
            });

            this.logger.log('Claude execution completed', {
              sessionId,
              assistantMessageId,
              durationMs: result.durationMs,
              costUsd: result.costUsd,
              conversationId: result.conversationId,
            });

            onComplete({
              assistantMessageId,
              conversationId: result.conversationId,
              costUsd: result.costUsd,
              durationMs: result.durationMs,
            });
          } catch (err) {
            this.logger.error('Failed to save assistant message', err);
            onError(err instanceof Error ? err : new Error(String(err)));
          } finally {
            this.activeExecutions.delete(sessionId);
          }
        })
        .catch(async (err: unknown) => {
          const error = err instanceof Error ? err : new Error(String(err));
          const partialResult =
            err instanceof ClaudeStreamExecutionError
              ? err.partialResult
              : null;

          this.activeExecutions.delete(sessionId);
          this.logger.error('Stream error during Claude execution', {
            sessionId,
            error: error.message,
          });

          if (partialResult && partialResult.streamEvents.length > 0) {
            await this.chatMessageRepository
              .updateMessage(assistantMessageId, {
                content: partialResult.resultContent || '(interrupted)',
                streamEvents: partialResult.streamEvents,
                conversationId: partialResult.conversationId,
                costUsd: partialResult.costUsd,
                durationMs: partialResult.durationMs || Date.now() - startTime,
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

          onError(error);
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
}
