import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../api/sessions.api';
import type { GitStatus } from '../api/types';

const EMPTY_GIT_STATUS: GitStatus = {
  hasChanges: false,
  changedFileCount: 0,
  branch: '',
};

const isLikelyBranchName = (value: string): boolean => {
  // Keep branch validation intentionally strict so command error text is ignored.
  return /^[A-Za-z0-9._/-]+$/.test(value);
};

export const useGitStatus = (sessionId: string | null, enabled: boolean) => {
  const queryClient = useQueryClient();
  const [initialBranch, setInitialBranch] = useState('');

  useEffect(() => {
    // Keep branch cache scoped to the active session.
    setInitialBranch('');
  }, [sessionId]);

  const statusQuery = useQuery({
    queryKey: ['gitStatus', sessionId],
    queryFn: async () => {
      try {
        return await sessionsApi.getGitStatus(sessionId!);
      } catch {
        const cachedStatus = queryClient.getQueryData<GitStatus>([
          'gitStatus',
          sessionId,
        ]);
        return cachedStatus ?? EMPTY_GIT_STATUS;
      }
    },
    enabled: enabled && !!sessionId,
    refetchInterval: 60_000, // Fallback poll every 60s in case WebSocket misses an update
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (initialBranch) return;

    const branch = statusQuery.data?.branch?.trim();
    if (branch && isLikelyBranchName(branch)) {
      setInitialBranch(branch);
    }
  }, [statusQuery.data?.branch, initialBranch]);

  const commitAndPushMutation = useMutation({
    mutationFn: (message: string) =>
      sessionsApi.commitAndPush(sessionId!, { message }),
    onSuccess: () => {
      // Refetch git status after a successful commit
      queryClient.invalidateQueries({ queryKey: ['gitStatus', sessionId] });
    },
  });

  const rawBranch = statusQuery.data?.branch?.trim() || '';
  const safeBranch = isLikelyBranchName(rawBranch) ? rawBranch : '';

  return {
    // Status data
    hasChanges: statusQuery.data?.hasChanges ?? false,
    changedFileCount: statusQuery.data?.changedFileCount ?? 0,
    branch: initialBranch || safeBranch,
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
