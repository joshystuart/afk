import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';
import { sessionsApi } from '../api/sessions.api';
import type { ChatMessage, ChatStreamEvent } from '../api/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

interface UseChatReturn {
  messages: ChatMessage[];
  streamingEvents: ChatStreamEvent[];
  isProcessing: boolean;
  isLoadingHistory: boolean;
  sendMessage: (content: string, continueConversation: boolean) => void;
  cancelExecution: () => void;
}

export const useChat = (sessionId: string): UseChatReturn => {
  const socketRef = useRef<Socket | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const streamingEventsRef = useRef<ChatStreamEvent[]>([]);
  const { token } = useAuthStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingEvents, setStreamingEvents] = useState<ChatStreamEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  messagesRef.current = messages;
  streamingEventsRef.current = streamingEvents;

  useEffect(() => {
    let cancelled = false;
    setIsLoadingHistory(true);
    sessionsApi
      .getChatHistory(sessionId)
      .then((response) => {
        if (cancelled) return;
        setMessages(response.messages);
        if (response.isExecuting) {
          setIsProcessing(true);
        }
      })
      .catch((err) => {
        console.error('Failed to load chat history:', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!token) return;

    const socket = io(`${WS_URL}/sessions`, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('subscribe.session', { sessionId });
    });

    // Server sends authoritative execution state on subscribe (and reconnect)
    socket.on(
      'chat.status',
      (data: {
        sessionId: string;
        status: 'executing' | 'idle';
        assistantMessageId: string | null;
      }) => {
        if (data.sessionId !== sessionId) return;
        setIsProcessing(data.status === 'executing');
      },
    );

    socket.on(
      'chat.stream',
      (data: {
        sessionId: string;
        messageId?: string;
        event: ChatStreamEvent;
      }) => {
        if (data.sessionId !== sessionId) return;
        const { messageId: assistantMessageId, event } = data;

        setIsProcessing(true);

        const hasExisting =
          assistantMessageId !== undefined &&
          messagesRef.current.some(
            (m) => m.role === 'assistant' && m.id === assistantMessageId,
          );

        if (hasExisting) {
          setMessages((prev) =>
            prev.map((m) =>
              m.role === 'assistant' && m.id === assistantMessageId
                ? {
                    ...m,
                    streamEvents: [...(m.streamEvents ?? []), event],
                    content:
                      event.type === 'result' && event.result != null
                        ? event.result
                        : m.content,
                  }
                : m,
            ),
          );
        } else {
          setStreamingEvents((prev) => [...prev, event]);
        }
      },
    );

    socket.on(
      'chat.complete',
      (data: {
        sessionId: string;
        messageId: string;
        conversationId: string | null;
        costUsd: number | null;
        durationMs: number;
      }) => {
        if (data.sessionId !== sessionId) return;

        const hasExisting = messagesRef.current.some(
          (m) => m.role === 'assistant' && m.id === data.messageId,
        );

        if (hasExisting) {
          setMessages((prev) =>
            prev.map((m) =>
              m.role === 'assistant' && m.id === data.messageId
                ? {
                    ...m,
                    conversationId: data.conversationId ?? undefined,
                    costUsd: data.costUsd ?? undefined,
                    durationMs: data.durationMs,
                    content:
                      m.streamEvents?.find((e) => e.type === 'result')
                        ?.result ?? m.content,
                  }
                : m,
            ),
          );
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
            setMessages((prev) => [...prev, assistantMessage]);
          }
          setStreamingEvents([]);
        }

        setIsProcessing(false);
      },
    );

    socket.on('chat.error', (data: { sessionId: string; error: string }) => {
      if (data.sessionId !== sessionId) return;
      console.error('Chat error:', data.error);
      setStreamingEvents([]);
      setIsProcessing(false);
    });

    return () => {
      socket.emit('unsubscribe.session', { sessionId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, token]);

  const sendMessage = useCallback(
    (content: string, continueConversation: boolean) => {
      if (!socketRef.current || isProcessing) return;

      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        sessionId,
        role: 'user',
        content,
        isContinuation: continueConversation,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setStreamingEvents([]);
      setIsProcessing(true);

      socketRef.current.emit('chat.send', {
        sessionId,
        content,
        continueConversation,
      });
    },
    [sessionId, isProcessing],
  );

  const cancelExecution = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('chat.cancel', { sessionId });
  }, [sessionId]);

  return {
    messages,
    streamingEvents,
    isProcessing,
    isLoadingHistory,
    sendMessage,
    cancelExecution,
  };
};
