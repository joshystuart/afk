import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '../stores/session.store';
import { useAuthStore } from '../stores/auth.store';
import { SessionStatus } from '../api/types';
import type { GitStatus, Session } from '../api/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4919';

interface WebSocketContextValue {
  socket: Socket | null;
  connected: boolean;
  subscribeToSession: (sessionId: string) => void;
  subscribeToSessionLogs: (sessionId: string) => void;
  unsubscribeFromSession: (sessionId: string) => void;
  unsubscribeFromSessionLogs: (sessionId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const sessionSubscriptionsRef = useRef(new Set<string>());
  const logsSubscriptionsRef = useRef(new Set<string>());

  const { isAuthenticated, token } = useAuthStore();
  const {
    handleSessionStatusChange,
    handleDeleteProgress,
    handleDeleteCompleted,
    handleDeleteFailed,
  } = useSessionStore();
  const queryClient = useQueryClient();

  const resubscribeAll = useCallback(() => {
    const s = socketRef.current;
    if (!s?.connected) {
      return;
    }
    for (const sessionId of sessionSubscriptionsRef.current) {
      s.emit('subscribe.session', { sessionId });
    }
    for (const sessionId of logsSubscriptionsRef.current) {
      s.emit('subscribe.logs', { sessionId });
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setConnected(false);
      sessionSubscriptionsRef.current.clear();
      logsSubscriptionsRef.current.clear();
      return;
    }

    const newSocket = io(`${WS_URL}/sessions`, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    const onConnect = () => {
      setConnected(true);
      resubscribeAll();
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    newSocket.on('connect', onConnect);
    newSocket.on('disconnect', onDisconnect);

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    newSocket.on(
      'session.status',
      (data: { sessionId: string; status: SessionStatus }) => {
        handleSessionStatusChange(data.sessionId, data.status);
      },
    );

    newSocket.on(
      'session.logs',
      (data: { sessionId: string; logs: string[] }) => {
        console.log('Session logs:', data);
      },
    );

    newSocket.on(
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

    newSocket.on(
      'session.delete.progress',
      (data: { sessionId: string; message: string }) => {
        handleDeleteProgress(data.sessionId, data.message);
      },
    );

    newSocket.on('session.deleted', (data: { sessionId: string }) => {
      handleDeleteCompleted(data.sessionId);
      queryClient.setQueryData<Session[]>(['sessions'], (old) =>
        old ? old.filter((s) => s.id !== data.sessionId) : [],
      );
      queryClient.removeQueries({ queryKey: ['session', data.sessionId] });
    });

    newSocket.on(
      'session.delete.failed',
      (data: { sessionId: string; error: string }) => {
        handleDeleteFailed(data.sessionId, data.error);
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
      },
    );

    if (newSocket.connected) {
      setConnected(true);
      resubscribeAll();
    }

    return () => {
      newSocket.off('connect', onConnect);
      newSocket.off('disconnect', onDisconnect);
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      sessionSubscriptionsRef.current.clear();
      logsSubscriptionsRef.current.clear();
    };
  }, [
    isAuthenticated,
    token,
    handleSessionStatusChange,
    handleDeleteProgress,
    handleDeleteCompleted,
    handleDeleteFailed,
    queryClient,
    resubscribeAll,
  ]);

  const subscribeToSession = useCallback((sessionId: string) => {
    sessionSubscriptionsRef.current.add(sessionId);
    const s = socketRef.current;
    if (s?.connected) {
      s.emit('subscribe.session', { sessionId });
    }
  }, []);

  const subscribeToSessionLogs = useCallback((sessionId: string) => {
    logsSubscriptionsRef.current.add(sessionId);
    const s = socketRef.current;
    if (s?.connected) {
      s.emit('subscribe.logs', { sessionId });
    }
  }, []);

  const unsubscribeFromSession = useCallback((sessionId: string) => {
    sessionSubscriptionsRef.current.delete(sessionId);
    const s = socketRef.current;
    if (s?.connected) {
      s.emit('unsubscribe.session', { sessionId });
    }
  }, []);

  const unsubscribeFromSessionLogs = useCallback((sessionId: string) => {
    logsSubscriptionsRef.current.delete(sessionId);
    const s = socketRef.current;
    if (!s?.connected) {
      return;
    }
    s.emit('unsubscribe.logs');
    for (const id of logsSubscriptionsRef.current) {
      s.emit('subscribe.logs', { sessionId: id });
    }
  }, []);

  const value: WebSocketContextValue = {
    socket,
    connected,
    subscribeToSession,
    subscribeToSessionLogs,
    unsubscribeFromSession,
    unsubscribeFromSessionLogs,
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
  return context;
};
