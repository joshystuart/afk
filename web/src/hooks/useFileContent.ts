import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '../api/workspace.api';
import type { FileContent } from '../api/types';

export const useFileContent = (sessionId: string, path: string | null) => {
  return useQuery<FileContent>({
    queryKey: ['workspace', 'content', sessionId, path],
    queryFn: () => workspaceApi.getFileContent(sessionId, path!),
    enabled: !!path && !!sessionId,
    staleTime: 30_000,
    retry: 1,
  });
};
