import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '../stores/session.store';
import { useAuthStore } from '../stores/auth.store';
import { SessionStatus } from '../api/types';
import type { GitStatus, Session } from '../api/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4919';

interface WebSocketContextValue {
  socketRef: React.RefObject<Socket | null>;
  subscribeToSession: (sessionId: string) => void;
  subscribeToSessionLogs: (sessionId: string) => void;
  unsubscribeFromSession: (sessionId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const socketRef = useRef<Socket | null>(null);
  const { isAuthenticated, token } = useAuthStore();
  const {
    handleSessionStatusChange,
    handleDeleteProgress,
    handleDeleteCompleted,
    handleDeleteFailed,
  } = useSessionStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(`${WS_URL}/sessions`, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    socket.on(
      'session.status',
      (data: { sessionId: string; status: SessionStatus }) => {
        handleSessionStatusChange(data.sessionId, data.status);
      },
    );

    socket.on('session.logs', (data: { sessionId: string; logs: string[] }) => {
      console.log('Session logs:', data);
    });

    socket.on(
      'session.git.status',
      (data: {
        sessionId: string;
        hasChanges: boolean;
        changedFileCount: number;
        branch: string;
      }) => {
        const gitStatus: GitStatus = {
          hasChanges: data.hasChanges,
          changedFileCount: data.changedFileCount,
          branch: data.branch,
        };
        queryClient.setQueryData(['gitStatus', data.sessionId], gitStatus);
      },
    );

    socket.on(
      'session.delete.progress',
      (data: { sessionId: string; message: string }) => {
        handleDeleteProgress(data.sessionId, data.message);
      },
    );

    socket.on('session.deleted', (data: { sessionId: string }) => {
      handleDeleteCompleted(data.sessionId);
      queryClient.setQueryData<Session[]>(['sessions'], (old) =>
        old ? old.filter((s) => s.id !== data.sessionId) : [],
      );
      queryClient.removeQueries({ queryKey: ['session', data.sessionId] });
    });

    socket.on(
      'session.delete.failed',
      (data: { sessionId: string; error: string }) => {
        handleDeleteFailed(data.sessionId, data.error);
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    isAuthenticated,
    token,
    handleSessionStatusChange,
    handleDeleteProgress,
    handleDeleteCompleted,
    handleDeleteFailed,
    queryClient,
  ]);

  const subscribeToSession = useCallback((sessionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe.session', { sessionId });
    }
  }, []);

  const subscribeToSessionLogs = useCallback((sessionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe.logs', { sessionId });
    }
  }, []);

  const unsubscribeFromSession = useCallback((sessionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe.session', { sessionId });
    }
  }, []);

  const value: WebSocketContextValue = {
    socketRef,
    subscribeToSession,
    subscribeToSessionLogs,
    unsubscribeFromSession,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return {
    socket: context.socketRef.current,
    subscribeToSession: context.subscribeToSession,
    subscribeToSessionLogs: context.subscribeToSessionLogs,
    unsubscribeFromSession: context.unsubscribeFromSession,
  };
};
