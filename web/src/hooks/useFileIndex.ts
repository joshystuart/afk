import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '../api/workspace.api';

export const useFileIndex = (
  sessionId: string | null,
  enabled: boolean = true,
) => {
  return useQuery<string[]>({
    queryKey: ['workspace', 'index', sessionId],
    queryFn: () => workspaceApi.getFileIndex(sessionId!),
    enabled: !!sessionId && enabled,
    staleTime: 60_000,
    retry: 1,
  });
};
