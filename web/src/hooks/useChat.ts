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
  const { token } = useAuthStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingEvents, setStreamingEvents] = useState<ChatStreamEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

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

    socket.on('chat.stream', (data: { sessionId: string; event: ChatStreamEvent }) => {
      if (data.sessionId !== sessionId) return;
      setStreamingEvents((prev) => [...prev, data.event]);
    });

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

        // Move streaming events into a completed assistant message
        setStreamingEvents((currentEvents) => {
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
