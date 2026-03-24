import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

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
  const {
    socket,
    connected,
    subscribeToSessionLogs,
    unsubscribeFromSessionLogs,
  } = useWebSocket();
  const [logs, setLogs] = useState<string[]>([]);

  const clear = useCallback(() => setLogs([]), []);

  useEffect(() => {
    if (!enabled || !sessionId || !socket || !connected) {
      return;
    }

    subscribeToSessionLogs(sessionId);

    const onLogData = (data: { sessionId: string; log: string }) => {
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
    };

    socket.on('log.data', onLogData);

    return () => {
      socket.off('log.data', onLogData);
      unsubscribeFromSessionLogs(sessionId);
    };
  }, [
    sessionId,
    enabled,
    socket,
    connected,
    subscribeToSessionLogs,
    unsubscribeFromSessionLogs,
  ]);

  return { logs, isConnected: connected, clear };
};
