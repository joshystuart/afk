import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { githubApi } from '../api/github.api';
import { useSettingsStore } from '../stores/settings.store';

export const useGitHub = () => {
  const queryClient = useQueryClient();
  const { settings } = useSettingsStore();

  const isConnected = settings?.hasGitHubToken ?? false;
  const username = settings?.githubUsername;

  // Query repos - only enabled when connected
  const useRepos = (search?: string, enabled = true) =>
    useQuery({
      queryKey: ['github-repos', search],
      queryFn: () => githubApi.listRepos(search, 'pushed', 1, 100),
      enabled: enabled && isConnected,
      staleTime: 2 * 60 * 1000, // 2 minutes
    });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: () => githubApi.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github-repos'] });
      // Refetch settings to update the connection status
      useSettingsStore.getState().fetchSettings();
    },
  });

  return {
    isConnected,
    username,
    authUrl: githubApi.getAuthUrl(),
    useRepos,
    disconnect: disconnectMutation.mutateAsync,
    isDisconnecting: disconnectMutation.isPending,
  };
};
