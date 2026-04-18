import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '../api/workspace.api';
import type { DirectoryListing } from '../api/types';

export const useFileTree = (
  sessionId: string,
  path: string,
  enabled: boolean = true,
) => {
  return useQuery<DirectoryListing>({
    queryKey: ['workspace', 'files', sessionId, path],
    queryFn: () => workspaceApi.listDirectory(sessionId, path),
    enabled: enabled && !!sessionId,
    staleTime: 30_000,
    retry: 1,
  });
};
