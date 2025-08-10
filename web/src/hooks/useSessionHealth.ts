import { useState, useEffect, useCallback } from 'react';
import { sessionsApi } from '../api/sessions.api';

interface TerminalHealthStatus {
  claudeTerminalReady: boolean;
  manualTerminalReady: boolean;
  allReady: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useSessionHealth = (
  sessionId: string | null,
  enabled: boolean = true,
) => {
  const [healthStatus, setHealthStatus] = useState<TerminalHealthStatus>({
    claudeTerminalReady: false,
    manualTerminalReady: false,
    allReady: false,
    isLoading: false,
    error: null,
  });

  const checkHealth = useCallback(async () => {
    if (!sessionId || !enabled) return;

    setHealthStatus((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const health = await sessionsApi.checkSessionHealth(sessionId);
      setHealthStatus({
        claudeTerminalReady: health.claudeTerminalReady,
        manualTerminalReady: health.manualTerminalReady,
        allReady: health.allReady,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setHealthStatus((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check terminal health',
      }));
    }
  }, [sessionId, enabled]);

  useEffect(() => {
    if (!sessionId || !enabled) return;

    // Initial check
    checkHealth();

    // Poll every 2 seconds until all terminals are ready
    const interval = setInterval(() => {
      checkHealth();
    }, 2000);

    return () => clearInterval(interval);
  }, [checkHealth, sessionId, enabled]);

  // Stop polling when all terminals are ready
  useEffect(() => {
    if (healthStatus.allReady) {
      // Add a small delay to ensure terminals are fully loaded
      const timeout = setTimeout(() => {
        setHealthStatus((prev) => ({ ...prev, isLoading: false }));
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [healthStatus.allReady]);

  return {
    ...healthStatus,
    refetch: checkHealth,
  };
};
