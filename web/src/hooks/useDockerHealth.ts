import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const POLL_INTERVAL_MS = 30_000;

interface DockerHealthState {
  isAvailable: boolean | null;
  isLoading: boolean;
  error: string | null;
}

export const useDockerHealth = () => {
  const [state, setState] = useState<DockerHealthState>({
    isAvailable: null,
    isLoading: true,
    error: null,
  });
  const mountedRef = useRef(true);

  const checkHealth = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health/ready`, {
        timeout: 10_000,
      });
      if (!mountedRef.current) return;
      setState({
        isAvailable: response.data?.data?.status === 'ok',
        isLoading: false,
        error: null,
      });
    } catch (err) {
      if (!mountedRef.current) return;
      const detail =
        err instanceof axios.AxiosError
          ? err.response?.data?.error?.docker?.message
          : undefined;
      setState({
        isAvailable: false,
        isLoading: false,
        error: detail || 'Docker is not accessible',
      });
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    checkHealth();
    const interval = setInterval(checkHealth, POLL_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [checkHealth]);

  return { ...state, refetch: checkHealth };
};
