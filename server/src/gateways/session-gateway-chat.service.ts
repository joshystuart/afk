import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../interactors/sessions/chat/chat.service';
import {
  CHAT_STATUS,
  getSessionRoom,
  SOCKET_EVENTS,
} from './session-gateway.events';
import { SessionGatewaySubscriptionsService } from './session-gateway-subscriptions.service';

interface ChatSendPayload {
  sessionId: string;
  content: string;
  continueConversation: boolean;
  model?: string;
}

interface ChatCancelPayload {
  sessionId: string;
}

@Injectable()
export class SessionGatewayChatService {
  private readonly logger = new Logger(SessionGatewayChatService.name);

  constructor(
    private readonly sessionGatewaySubscriptionsService: SessionGatewaySubscriptionsService,
    private readonly chatService: ChatService,
  ) {}

  emitChatStatus(client: Socket, sessionId: string): void {
    const executionInfo = this.chatService.getExecutionInfo(sessionId);

    client.emit(SOCKET_EVENTS.chatStatus, {
      sessionId,
      status: executionInfo ? CHAT_STATUS.executing : CHAT_STATUS.idle,
      assistantMessageId: executionInfo?.assistantMessageId ?? null,
    });
  }

  async handleChatSend(server: Server, data: ChatSendPayload) {
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
          server.to(getSessionRoom(sessionId)).emit(SOCKET_EVENTS.chatStream, {
            sessionId,
            messageId: result.assistantMessageId,
            event,
          });
        },
        (info) => {
          server
            .to(getSessionRoom(sessionId))
            .emit(SOCKET_EVENTS.chatComplete, {
              sessionId,
              messageId: info.assistantMessageId,
              conversationId: info.conversationId,
              costUsd: info.costUsd,
              durationMs: info.durationMs,
            });
        },
        (error) => {
          server.to(getSessionRoom(sessionId)).emit(SOCKET_EVENTS.chatError, {
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
      const message =
        error instanceof Error ? error.message : 'Unknown chat error';

      this.logger.error('Failed to start chat execution', {
        sessionId,
        error: message,
      });

      return {
        event: SOCKET_EVENTS.chatError,
        data: { sessionId, error: message },
      };
    }
  }

  async handleChatCancel(data: ChatCancelPayload) {
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
      const message =
        error instanceof Error ? error.message : 'Unknown chat error';

      return {
        event: SOCKET_EVENTS.chatError,
        data: { sessionId: data.sessionId, error: message },
      };
    }
  }
}
