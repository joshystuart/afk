import { useEffect, useRef, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

type TerminalStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

const MAX_RECONNECT_ATTEMPTS = 3;

export const useTerminal = (sessionId: string) => {
  const { socket, connected } = useWebSocket();
  const [status, setStatus] = useState<TerminalStatus>('idle');

  const onDataRef = useRef<((data: string) => void) | null>(null);
  const reconnectAttemptRef = useRef(0);
  const lastDimensionsRef = useRef<{ cols: number; rows: number } | null>(null);
  const prevConnectedRef = useRef(connected);

  const startTerminal = useCallback(
    (cols: number, rows: number) => {
      if (!socket?.connected) return;
      lastDimensionsRef.current = { cols, rows };
      setStatus('connecting');
      socket.emit('terminal.start', { sessionId, cols, rows });
    },
    [socket, sessionId],
  );

  const sendInput = useCallback(
    (data: string) => {
      if (!socket?.connected) return;
      const encoded = btoa(data);
      socket.emit('terminal.input', { sessionId, data: encoded });
    },
    [socket, sessionId],
  );

  const resize = useCallback(
    (cols: number, rows: number) => {
      if (!socket?.connected) return;
      lastDimensionsRef.current = { cols, rows };
      socket.emit('terminal.resize', { sessionId, cols, rows });
    },
    [socket, sessionId],
  );

  const closeTerminal = useCallback(() => {
    if (!socket?.connected) return;
    socket.emit('terminal.close', { sessionId });
    setStatus('idle');
  }, [socket, sessionId]);

  const setOnData = useCallback((cb: (data: string) => void) => {
    onDataRef.current = cb;
  }, []);

  useEffect(() => {
    if (!socket || !sessionId) return;

    const onStarted = (payload: { sessionId: string }) => {
      if (payload.sessionId !== sessionId) return;
      setStatus('connected');
      reconnectAttemptRef.current = 0;
    };

    const onData = (payload: { sessionId: string; data: string }) => {
      if (payload.sessionId !== sessionId) return;
      onDataRef.current?.(payload.data);
    };

    const onError = (payload: { sessionId: string; error: string }) => {
      if (payload.sessionId !== sessionId) return;
      console.error('Terminal error:', payload.error);
      setStatus('error');
    };

    const onClose = (payload: { sessionId: string }) => {
      if (payload.sessionId !== sessionId) return;
      setStatus('disconnected');
    };

    socket.on('terminal.started', onStarted);
    socket.on('terminal.data', onData);
    socket.on('terminal.error', onError);
    socket.on('terminal.close', onClose);

    return () => {
      socket.off('terminal.started', onStarted);
      socket.off('terminal.data', onData);
      socket.off('terminal.error', onError);
      socket.off('terminal.close', onClose);
    };
  }, [socket, sessionId]);

  // Auto-reconnect when socket reconnects after a drop
  useEffect(() => {
    const wasDisconnected = !prevConnectedRef.current;
    prevConnectedRef.current = connected;

    if (!wasDisconnected || !connected) return;
    if (status !== 'connected' && status !== 'disconnected') return;
    if (!lastDimensionsRef.current) return;

    if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setStatus('error');
      return;
    }

    reconnectAttemptRef.current += 1;
    const { cols, rows } = lastDimensionsRef.current;
    setStatus('connecting');
    socket?.emit('terminal.start', { sessionId, cols, rows });
  }, [connected, socket, sessionId, status]);

  return {
    startTerminal,
    sendInput,
    resize,
    closeTerminal,
    status,
    setOnData,
  };
};
