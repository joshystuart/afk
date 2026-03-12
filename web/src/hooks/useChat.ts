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
  const { token } = useAuthStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingEvents, setStreamingEvents] = useState<ChatStreamEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  messagesRef.current = messages;

  // Load chat history on mount
  useEffect(() => {
    let cancelled = false;
    setIsLoadingHistory(true);
    sessionsApi
      .getChatMessages(sessionId)
      .then((msgs) => {
        if (!cancelled) setMessages(msgs);
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

  // Set up WebSocket connection for chat events
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

    socket.on(
      'chat.stream',
      (data: {
        sessionId: string;
        messageId?: string;
        event: ChatStreamEvent;
      }) => {
        if (data.sessionId !== sessionId) return;
        const { messageId: assistantMessageId, event } = data;

        const currentMessages = messagesRef.current;
        const existingIdx =
          assistantMessageId !== undefined
            ? currentMessages.findIndex(
                (m) =>
                  m.role === 'assistant' && m.id === assistantMessageId,
              )
            : -1;

        if (existingIdx !== -1) {
          // We have this message (e.g. restored from history after navigating back): merge into it, don't show separate streaming bubble
          setIsProcessing(true);
          setMessages((prev) => {
            const idx = prev.findIndex(
              (m) => m.role === 'assistant' && m.id === assistantMessageId,
            );
            if (idx === -1) return prev;
            const msg = prev[idx];
            const nextEvents = [...(msg.streamEvents ?? []), event];
            return prev.map((m, i) =>
              i === idx
                ? {
                    ...m,
                    streamEvents: nextEvents,
                    content:
                      event.type === 'result' && event.result != null
                        ? event.result
                        : m.content,
                  }
                : m,
            );
          });
          return;
        }

        // New run: message not in list yet; show event in streaming bubble
        setStreamingEvents((prev) => [...prev, event]);
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

        setMessages((prev) => {
          const existingIdx = prev.findIndex(
            (m) => m.role === 'assistant' && m.id === data.messageId,
          );
          if (existingIdx !== -1) {
            // We were merging stream into this message (e.g. restored from history); just update metadata
            const existing = prev[existingIdx];
            const next = [...prev];
            next[existingIdx] = {
              ...existing,
              conversationId: data.conversationId ?? undefined,
              costUsd: data.costUsd ?? undefined,
              durationMs: data.durationMs,
              content:
                existing.streamEvents?.find((e) => e.type === 'result')
                  ?.result ?? existing.content,
            };
            return next;
          }
          return prev;
        });

        // If we had a separate streaming bubble, move its events into a new completed message
        setStreamingEvents((currentEvents) => {
          if (currentEvents.length > 0) {
            const resultEvent = currentEvents.find((e) => e.type === 'result');
            const assistantMessage: ChatMessage = {
              id: data.messageId,
              sessionId: data.sessionId,
              role: 'assistant',
              content: resultEvent?.result || '',
              streamEvents: currentEvents,
              conversationId: data.conversationId ?? undefined,
              isContinuation: false,
              costUsd: data.costUsd ?? undefined,
              durationMs: data.durationMs,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
          }
          return [];
        });

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
    setIsProcessing(false);
    setStreamingEvents([]);
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
