import { useState, useEffect, useCallback } from 'react';
import { sessionsApi } from '../api/sessions.api';

interface TerminalHealthStatus {
  terminalReady: boolean;
  allReady: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useSessionHealth = (
  sessionId: string | null,
  enabled: boolean = true,
) => {
  const [healthStatus, setHealthStatus] = useState<TerminalHealthStatus>({
    terminalReady: false,
    allReady: false,
    isLoading: false,
    error: null,
  });

  const checkHealth = useCallback(async () => {
    if (!sessionId || !enabled) return;

    setHealthStatus((prev) =>
      prev.isLoading && prev.error === null
        ? prev
        : { ...prev, isLoading: true, error: null },
    );

    try {
      const health = await sessionsApi.checkSessionHealth(sessionId);
      // Bail out if nothing actually changed — otherwise a new object
      // reference every 2s (from the polling interval below) forces every
      // consumer of this hook to re-render, cascading into panels like the
      // file preview and clearing things like in-progress text selection.
      setHealthStatus((prev) =>
        prev.terminalReady === health.terminalReady &&
        prev.allReady === health.allReady &&
        prev.isLoading === false &&
        prev.error === null
          ? prev
          : {
              terminalReady: health.terminalReady,
              allReady: health.allReady,
              isLoading: false,
              error: null,
            },
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to check terminal health';
      setHealthStatus((prev) =>
        prev.isLoading === false && prev.error === message
          ? prev
          : {
              ...prev,
              isLoading: false,
              error: message,
            },
      );
    }
  }, [sessionId, enabled]);

  useEffect(() => {
    if (!sessionId || !enabled) return;

    checkHealth();

    const interval = setInterval(() => {
      checkHealth();
    }, 2000);

    return () => clearInterval(interval);
  }, [checkHealth, sessionId, enabled]);

  useEffect(() => {
    if (healthStatus.allReady) {
      const timeout = setTimeout(() => {
        setHealthStatus((prev) =>
          prev.isLoading === false ? prev : { ...prev, isLoading: false },
        );
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [healthStatus.allReady]);

  return {
    ...healthStatus,
    refetch: checkHealth,
  };
};
