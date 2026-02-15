import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../api/sessions.api';

export const useGitStatus = (sessionId: string | null, enabled: boolean) => {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['gitStatus', sessionId],
    queryFn: () => sessionsApi.getGitStatus(sessionId!),
    enabled: enabled && !!sessionId,
    refetchInterval: 30_000, // Poll every 30 seconds
    retry: false,
  });

  const commitAndPushMutation = useMutation({
    mutationFn: (message: string) =>
      sessionsApi.commitAndPush(sessionId!, { message }),
    onSuccess: () => {
      // Refetch git status after a successful commit
      queryClient.invalidateQueries({ queryKey: ['gitStatus', sessionId] });
    },
  });

  return {
    // Status data
    hasChanges: statusQuery.data?.hasChanges ?? false,
    changedFileCount: statusQuery.data?.changedFileCount ?? 0,
    branch: statusQuery.data?.branch ?? '',
    isLoadingStatus: statusQuery.isLoading,
    statusError: statusQuery.error,
    refetchStatus: statusQuery.refetch,

    // Commit & push
    commitAndPush: commitAndPushMutation.mutateAsync,
    isCommitting: commitAndPushMutation.isPending,
    commitError: commitAndPushMutation.error,
    commitResult: commitAndPushMutation.data,
    resetCommitState: commitAndPushMutation.reset,
  };
};
