import { apiClient } from './client';
import type { DirectoryListing, FileContent, FileIndexResponse } from './types';

export const workspaceApi = {
  listDirectory: async (
    sessionId: string,
    path: string = '/',
  ): Promise<DirectoryListing> => {
    const response = await apiClient.get(
      `/sessions/${sessionId}/files?path=${encodeURIComponent(path)}`,
    );
    return response as unknown as DirectoryListing;
  },

  getFileContent: async (
    sessionId: string,
    path: string,
  ): Promise<FileContent> => {
    const response = await apiClient.get(
      `/sessions/${sessionId}/files/content?path=${encodeURIComponent(path)}`,
    );
    return response as unknown as FileContent;
  },

  getFileIndex: async (sessionId: string): Promise<string[]> => {
    const response = await apiClient.get(`/sessions/${sessionId}/files/index`);
    return (response as unknown as FileIndexResponse).files;
  },
};
