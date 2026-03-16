import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { githubApi } from '../api/github.api';
import { useSettingsStore } from '../stores/settings.store';

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

const isElectron = !!window.electronAPI?.openExternal;

export const useGitHub = () => {
  const queryClient = useQueryClient();
  const { settings } = useSettingsStore();

  const isConnected = settings?.hasGitHubToken ?? false;
  const username = settings?.githubUsername;

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    pollTimerRef.current = null;
    timeoutRef.current = null;
    setIsAuthenticating(false);
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const startAuth = useCallback(async () => {
    if (!isElectron) return;

    const authUrl = `${githubApi.getAuthUrl()}?source=electron`;
    await window.electronAPI!.openExternal(authUrl);

    setIsAuthenticating(true);

    pollTimerRef.current = setInterval(async () => {
      try {
        const status = await githubApi.getStatus();
        if (status.connected) {
          stopPolling();
          await useSettingsStore.getState().fetchSettings();
          queryClient.invalidateQueries({ queryKey: ['github-repos'] });
        }
      } catch {
        // Ignore transient poll errors
      }
    }, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(stopPolling, POLL_TIMEOUT_MS);
  }, [queryClient, stopPolling]);

  const useRepos = (search?: string, enabled = true) =>
    useQuery({
      queryKey: ['github-repos', search],
      queryFn: () => githubApi.listRepos(search, 'pushed', 1, 100),
      enabled: enabled && isConnected,
      staleTime: 2 * 60 * 1000,
    });

  const disconnectMutation = useMutation({
    mutationFn: () => githubApi.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github-repos'] });
      useSettingsStore.getState().fetchSettings();
    },
  });

  return {
    isConnected,
    username,
    isElectron,
    authUrl: githubApi.getAuthUrl(),
    startAuth,
    isAuthenticating,
    cancelAuth: stopPolling,
    useRepos,
    disconnect: disconnectMutation.mutateAsync,
    isDisconnecting: disconnectMutation.isPending,
  };
};
