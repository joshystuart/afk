import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../api/sessions.api';
import { useWebSocket } from './useWebSocket';
import type {
  ChatHistoryResponse,
  ChatMessage,
  ChatStreamEvent,
} from '../api/types';

const CHAT_QUERY_STALE_TIME_MS = 5 * 60 * 1000;
const CHAT_QUERY_GC_TIME_MS = 30 * 60 * 1000;
const SESSION_STREAMING_EVENTS_CACHE = new Map<string, ChatStreamEvent[]>();
const MAX_CACHE_SIZE = 100;

const createEmptyChatHistory = (): ChatHistoryResponse => ({
  messages: [],
  isExecuting: false,
  activeMessageId: null,
});

const getCachedStreamingEvents = (sessionId: string): ChatStreamEvent[] =>
  SESSION_STREAMING_EVENTS_CACHE.get(sessionId) ?? [];

const setCachedStreamingEvents = (
  sessionId: string,
  events: ChatStreamEvent[],
): void => {
  if (events.length === 0) {
    SESSION_STREAMING_EVENTS_CACHE.delete(sessionId);
    return;
  }

  SESSION_STREAMING_EVENTS_CACHE.set(sessionId, [...events]);

  // Implement LRU eviction if cache grows too large
  if (SESSION_STREAMING_EVENTS_CACHE.size > MAX_CACHE_SIZE) {
    const firstKey = SESSION_STREAMING_EVENTS_CACHE.keys().next().value;
    if (firstKey !== undefined) {
      SESSION_STREAMING_EVENTS_CACHE.delete(firstKey);
    }
  }
};

export const clearStreamingEventsCache = (sessionId: string): void => {
  SESSION_STREAMING_EVENTS_CACHE.delete(sessionId);
};

interface UseChatReturn {
  messages: ChatMessage[];
  streamingEvents: ChatStreamEvent[];
  isProcessing: boolean;
  isLoadingHistory: boolean;
  sendMessage: (
    content: string,
    continueConversation: boolean,
    model?: string,
  ) => void;
  cancelExecution: () => void;
}

export const useChat = (sessionId: string): UseChatReturn => {
  const { socket, connected } = useWebSocket();
  const messagesRef = useRef<ChatMessage[]>([]);
  const streamingEventsRef = useRef<ChatStreamEvent[]>([]);
  const queryClient = useQueryClient();

  const [streamingEvents, setStreamingEventsState] = useState<
    ChatStreamEvent[]
  >(() => getCachedStreamingEvents(sessionId));

  const { data: chatHistory, isPending } = useQuery({
    queryKey: ['chat', sessionId],
    queryFn: () => sessionsApi.getChatHistory(sessionId),
    enabled: !!sessionId,
    staleTime: CHAT_QUERY_STALE_TIME_MS,
    gcTime: CHAT_QUERY_GC_TIME_MS,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
  });

  const messages = chatHistory?.messages ?? [];
  const isProcessing = chatHistory?.isExecuting ?? false;
  const isLoadingHistory = isPending && chatHistory == null;

  const updateChatHistory = useCallback(
    (
      updater: (current: ChatHistoryResponse) => ChatHistoryResponse,
      targetSessionId = sessionId,
    ) => {
      queryClient.setQueryData<ChatHistoryResponse>(
        ['chat', targetSessionId],
        (current) => updater(current ?? createEmptyChatHistory()),
      );
    },
    [queryClient, sessionId],
  );

  const setStreamingEvents = useCallback(
    (
      updater:
        | ChatStreamEvent[]
        | ((current: ChatStreamEvent[]) => ChatStreamEvent[]),
      targetSessionId = sessionId,
    ) => {
      if (targetSessionId !== sessionId) {
        const currentEvents = getCachedStreamingEvents(targetSessionId);
        const nextEvents =
          typeof updater === 'function' ? updater(currentEvents) : updater;
        setCachedStreamingEvents(targetSessionId, nextEvents);
        return;
      }

      setStreamingEventsState((currentEvents) => {
        const nextEvents =
          typeof updater === 'function' ? updater(currentEvents) : updater;
        setCachedStreamingEvents(targetSessionId, nextEvents);
        return nextEvents;
      });
    },
    [sessionId],
  );

  useEffect(() => {
    setStreamingEventsState(getCachedStreamingEvents(sessionId));
  }, [sessionId]);

  useEffect(() => {
    if (chatHistory != null && !chatHistory.isExecuting) {
      setStreamingEvents([], sessionId);
    }
  }, [chatHistory, sessionId, setStreamingEvents]);

  messagesRef.current = messages;
  streamingEventsRef.current = streamingEvents;

  useEffect(() => {
    if (!socket || !connected || !sessionId) {
      return;
    }

    const onChatStatus = (data: {
      sessionId: string;
      status: 'executing' | 'idle';
      assistantMessageId: string | null;
    }) => {
      if (data.sessionId !== sessionId) return;
      void queryClient.cancelQueries({ queryKey: ['chat', sessionId] });
      updateChatHistory((current) => ({
        ...current,
        isExecuting: data.status === 'executing',
        activeMessageId:
          data.status === 'executing'
            ? (data.assistantMessageId ?? current.activeMessageId)
            : null,
      }));

      if (data.status === 'idle') {
        void queryClient.invalidateQueries({ queryKey: ['chat', sessionId] });
      }
    };

    const onChatStream = (data: {
      sessionId: string;
      messageId?: string;
      event: ChatStreamEvent;
    }) => {
      if (data.sessionId !== sessionId) return;
      const { messageId: assistantMessageId, event } = data;
      void queryClient.cancelQueries({ queryKey: ['chat', sessionId] });

      const hasExisting =
        assistantMessageId !== undefined &&
        messagesRef.current.some(
          (m) => m.role === 'assistant' && m.id === assistantMessageId,
        );

      if (hasExisting) {
        updateChatHistory((current) => ({
          ...current,
          isExecuting: true,
          activeMessageId: assistantMessageId ?? current.activeMessageId,
          messages: current.messages.map((message) =>
            message.role === 'assistant' && message.id === assistantMessageId
              ? {
                  ...message,
                  streamEvents: [...(message.streamEvents ?? []), event],
                  content:
                    event.type === 'result' && event.result != null
                      ? event.result
                      : message.content,
                }
              : message,
          ),
        }));
      } else {
        updateChatHistory((current) => ({
          ...current,
          isExecuting: true,
          activeMessageId: assistantMessageId ?? current.activeMessageId,
        }));
        setStreamingEvents((currentEvents) => [...currentEvents, event]);
      }
    };

    const onChatComplete = (data: {
      sessionId: string;
      messageId: string;
      conversationId: string | null;
      costUsd: number | null;
      durationMs: number;
    }) => {
      if (data.sessionId !== sessionId) return;
      void queryClient.cancelQueries({ queryKey: ['chat', sessionId] });

      const hasExisting = messagesRef.current.some(
        (m) => m.role === 'assistant' && m.id === data.messageId,
      );

      if (hasExisting) {
        updateChatHistory((current) => ({
          ...current,
          isExecuting: false,
          activeMessageId: null,
          messages: current.messages.map((message) =>
            message.role === 'assistant' && message.id === data.messageId
              ? {
                  ...message,
                  conversationId: data.conversationId ?? undefined,
                  costUsd: data.costUsd ?? undefined,
                  durationMs: data.durationMs,
                  content:
                    message.streamEvents?.find(
                      (event) => event.type === 'result',
                    )?.result ?? message.content,
                }
              : message,
          ),
        }));
      } else {
        const currentEvents = streamingEventsRef.current;
        if (currentEvents.length > 0) {
          const resultEvent = currentEvents.find((e) => e.type === 'result');
          const assistantMessage: ChatMessage = {
            id: data.messageId,
            sessionId: data.sessionId,
            role: 'assistant',
            content: resultEvent?.result || '',
            streamEvents: [...currentEvents],
            conversationId: data.conversationId ?? undefined,
            isContinuation: false,
            costUsd: data.costUsd ?? undefined,
            durationMs: data.durationMs,
            createdAt: new Date().toISOString(),
          };
          updateChatHistory((current) => ({
            ...current,
            isExecuting: false,
            activeMessageId: null,
            messages: [...current.messages, assistantMessage],
          }));
        } else {
          updateChatHistory((current) => ({
            ...current,
            isExecuting: false,
            activeMessageId: null,
          }));
        }
        setStreamingEvents([]);
      }
      void queryClient.invalidateQueries({ queryKey: ['chat', sessionId] });
    };

    const onChatError = (data: { sessionId: string; error: string }) => {
      if (data.sessionId !== sessionId) return;
      console.error('Chat error:', data.error);
      void queryClient.cancelQueries({ queryKey: ['chat', sessionId] });
      setStreamingEvents([]);
      updateChatHistory((current) => ({
        ...current,
        isExecuting: false,
        activeMessageId: null,
      }));
      void queryClient.invalidateQueries({ queryKey: ['chat', sessionId] });
    };

    socket.on('chat.status', onChatStatus);
    socket.on('chat.stream', onChatStream);
    socket.on('chat.complete', onChatComplete);
    socket.on('chat.error', onChatError);

    return () => {
      socket.off('chat.status', onChatStatus);
      socket.off('chat.stream', onChatStream);
      socket.off('chat.complete', onChatComplete);
      socket.off('chat.error', onChatError);
    };
  }, [
    socket,
    connected,
    queryClient,
    sessionId,
    setStreamingEvents,
    updateChatHistory,
  ]);

  const sendMessage = useCallback(
    (content: string, continueConversation: boolean, model?: string) => {
      if (!socket?.connected || isProcessing) return;

      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        sessionId,
        role: 'user',
        content,
        isContinuation: continueConversation,
        createdAt: new Date().toISOString(),
      };
      void queryClient.cancelQueries({ queryKey: ['chat', sessionId] });
      updateChatHistory((current) => ({
        ...current,
        messages: [...current.messages, userMessage],
        isExecuting: true,
      }));
      setStreamingEvents([]);

      socket.emit('chat.send', {
        sessionId,
        content,
        continueConversation,
        model: model || undefined,
      });
    },
    [
      socket,
      sessionId,
      isProcessing,
      queryClient,
      setStreamingEvents,
      updateChatHistory,
    ],
  );

  const cancelExecution = useCallback(() => {
    if (!socket?.connected) return;
    socket.emit('chat.cancel', { sessionId });
  }, [socket, sessionId]);

  return {
    messages,
    streamingEvents,
    isProcessing,
    isLoadingHistory,
    sendMessage,
    cancelExecution,
  };
};
