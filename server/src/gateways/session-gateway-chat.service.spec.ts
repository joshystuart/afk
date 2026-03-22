import { Server, Socket } from 'socket.io';
import { ChatService } from '../interactors/sessions/chat/chat.service';
import { SOCKET_EVENTS } from './session-gateway.events';
import { SessionGatewayChatService } from './session-gateway-chat.service';
import { SessionGatewaySubscriptionsService } from './session-gateway-subscriptions.service';

describe('SessionGatewayChatService', () => {
  const sessionId = '11111111-1111-4111-8111-111111111111';

  let service: SessionGatewayChatService;
  let sessionGatewaySubscriptionsService: jest.Mocked<SessionGatewaySubscriptionsService>;
  let chatService: jest.Mocked<ChatService>;
  let client: jest.Mocked<Socket>;
  let roomEmitter: { emit: jest.Mock };
  let server: jest.Mocked<Server>;

  beforeEach(() => {
    sessionGatewaySubscriptionsService = {
      recordSessionActivity: jest.fn(),
    } as unknown as jest.Mocked<SessionGatewaySubscriptionsService>;

    chatService = {
      getExecutionInfo: jest.fn(),
      sendMessage: jest.fn(),
      cancelExecution: jest.fn(),
    } as unknown as jest.Mocked<ChatService>;

    client = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<Socket>;

    roomEmitter = {
      emit: jest.fn(),
    };

    server = {
      to: jest.fn().mockReturnValue(roomEmitter),
    } as unknown as jest.Mocked<Server>;

    service = new SessionGatewayChatService(
      sessionGatewaySubscriptionsService,
      chatService,
    );
  });

  it('emits the active chat status for reconnecting clients', () => {
    chatService.getExecutionInfo.mockReturnValue({
      assistantMessageId: 'assistant-1',
    });

    service.emitChatStatus(client, sessionId);

    expect(chatService.getExecutionInfo).toHaveBeenCalledWith(sessionId);
    expect(client.emit).toHaveBeenCalledWith(SOCKET_EVENTS.chatStatus, {
      sessionId,
      status: 'executing',
      assistantMessageId: 'assistant-1',
    });
  });

  it('delegates chat send and fans out stream lifecycle events', async () => {
    let onStream: ((event: unknown) => void) | undefined;
    let onComplete:
      | ((info: {
          assistantMessageId: string;
          conversationId: string | null;
          costUsd: number | null;
          durationMs: number;
        }) => void)
      | undefined;
    let onError: ((error: Error) => void) | undefined;

    chatService.sendMessage.mockImplementation(
      async (_sessionId, _content, _options, stream, complete, error) => {
        onStream = stream;
        onComplete = complete;
        onError = error;

        return {
          userMessageId: 'user-1',
          assistantMessageId: 'assistant-1',
          kill: jest.fn(),
        };
      },
    );

    const response = await service.handleChatSend(server, {
      sessionId,
      content: 'hello',
      continueConversation: false,
      model: 'sonnet',
    });

    expect(
      sessionGatewaySubscriptionsService.recordSessionActivity,
    ).toHaveBeenCalledWith(sessionId);
    expect(chatService.sendMessage).toHaveBeenCalledWith(
      sessionId,
      'hello',
      { continueConversation: false, model: 'sonnet' },
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
    expect(response).toEqual({
      event: SOCKET_EVENTS.chatStarted,
      data: {
        sessionId,
        userMessageId: 'user-1',
        assistantMessageId: 'assistant-1',
      },
    });

    onStream?.({ type: 'message.delta', text: 'hi' });
    expect(server.to).toHaveBeenCalledWith(`session:${sessionId}`);
    expect(roomEmitter.emit).toHaveBeenCalledWith(SOCKET_EVENTS.chatStream, {
      sessionId,
      messageId: 'assistant-1',
      event: { type: 'message.delta', text: 'hi' },
    });

    onComplete?.({
      assistantMessageId: 'assistant-1',
      conversationId: 'conversation-1',
      costUsd: 0.02,
      durationMs: 1234,
    });
    expect(roomEmitter.emit).toHaveBeenCalledWith(SOCKET_EVENTS.chatComplete, {
      sessionId,
      messageId: 'assistant-1',
      conversationId: 'conversation-1',
      costUsd: 0.02,
      durationMs: 1234,
    });

    onError?.(new Error('stream failed'));
    expect(roomEmitter.emit).toHaveBeenCalledWith(SOCKET_EVENTS.chatError, {
      sessionId,
      error: 'stream failed',
    });
  });

  it('returns a chat error response when execution cannot start', async () => {
    chatService.sendMessage.mockRejectedValue(new Error('Session not running'));

    await expect(
      service.handleChatSend(server, {
        sessionId,
        content: 'hello',
        continueConversation: true,
      }),
    ).resolves.toEqual({
      event: SOCKET_EVENTS.chatError,
      data: { sessionId, error: 'Session not running' },
    });
  });

  it('cancels active chat executions', async () => {
    await expect(service.handleChatCancel({ sessionId })).resolves.toEqual({
      event: SOCKET_EVENTS.chatCancelled,
      data: { sessionId },
    });

    expect(
      sessionGatewaySubscriptionsService.recordSessionActivity,
    ).toHaveBeenCalledWith(sessionId);
    expect(chatService.cancelExecution).toHaveBeenCalledWith(sessionId);
  });

  it('returns a chat error when cancellation fails', async () => {
    chatService.cancelExecution.mockRejectedValue(
      new Error('No active execution for this session'),
    );

    await expect(service.handleChatCancel({ sessionId })).resolves.toEqual({
      event: SOCKET_EVENTS.chatError,
      data: {
        sessionId,
        error: 'No active execution for this session',
      },
    });
  });
});
