import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSessionStore } from '../stores/session.store';
import { useAuthStore } from '../stores/auth.store';
import { SessionStatus } from '../api/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export const useWebSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { isAuthenticated, token } = useAuthStore();
  const { handleSessionStatusChange } = useSessionStore();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Create socket connection
    const socket = io(WS_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Session status updates
    socket.on(
      'session.status',
      (data: { sessionId: string; status: SessionStatus }) => {
        handleSessionStatusChange(data.sessionId, data.status);
      },
    );

    // Session logs
    socket.on('session.logs', (data: { sessionId: string; logs: string[] }) => {
      // Handle log updates (could be stored in a separate store)
      console.log('Session logs:', data);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, handleSessionStatusChange]);

  // Subscribe to session updates
  const subscribeToSession = (sessionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe.session', { sessionId });
    }
  };

  // Subscribe to session logs
  const subscribeToSessionLogs = (sessionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe.logs', { sessionId });
    }
  };

  // Unsubscribe from session updates
  const unsubscribeFromSession = (sessionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe.session', { sessionId });
    }
  };

  return {
    socket: socketRef.current,
    subscribeToSession,
    subscribeToSessionLogs,
    unsubscribeFromSession,
  };
};
