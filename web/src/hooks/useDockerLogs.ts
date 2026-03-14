import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
const MAX_LOG_LINES = 500;

interface UseDockerLogsReturn {
  logs: string[];
  isConnected: boolean;
  clear: () => void;
}

export const useDockerLogs = (
  sessionId: string,
  enabled: boolean,
): UseDockerLogsReturn => {
  const socketRef = useRef<Socket | null>(null);
  const { token } = useAuthStore();
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const clear = useCallback(() => setLogs([]), []);

  useEffect(() => {
    if (!enabled || !token || !sessionId) return;

    const socket = io(`${WS_URL}/sessions`, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('subscribe.logs', { sessionId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('log.data', (data: { sessionId: string; log: string }) => {
      if (data.sessionId !== sessionId) return;

      const lines = data.log
        .split('\n')
        .map((l) => l.replace(/[\x00-\x08\x0e-\x1f]/g, '').trimEnd())
        .filter((l) => l.length > 0);

      if (lines.length === 0) return;

      setLogs((prev) => {
        const next = [...prev, ...lines];
        return next.length > MAX_LOG_LINES
          ? next.slice(next.length - MAX_LOG_LINES)
          : next;
      });
    });

    return () => {
      socket.emit('unsubscribe.logs');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, enabled, token]);

  return { logs, isConnected, clear };
};
