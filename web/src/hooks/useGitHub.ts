import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { githubApi } from '../api/github.api';
import { useSettingsStore } from '../stores/settings.store';

export const useGitHub = () => {
  const queryClient = useQueryClient();
  const { settings } = useSettingsStore();

  const isConnected = settings?.hasGitHubToken ?? false;
  const username = settings?.githubUsername;

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
    useRepos,
    disconnect: disconnectMutation.mutateAsync,
    isDisconnecting: disconnectMutation.isPending,
  };
};
