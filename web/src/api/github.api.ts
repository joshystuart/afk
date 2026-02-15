import { apiClient } from './client';
import type { GitHubRepo, GitHubStatus } from './types';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const githubApi = {
  /** Get the full auth URL to redirect to (direct browser navigation) */
  getAuthUrl(returnUrl?: string): string {
    const params = new URLSearchParams();
    if (returnUrl) {
      params.set('returnUrl', returnUrl);
    }
    return `${API_BASE_URL}/github/auth${params.toString() ? `?${params.toString()}` : ''}`;
  },

  /** Get GitHub connection status */
  async getStatus(): Promise<GitHubStatus> {
    const response = await apiClient.get<GitHubStatus>('/github/status');
    return response as unknown as GitHubStatus;
  },

  /** List GitHub repositories */
  async listRepos(
    search?: string,
    sort?: string,
    page?: number,
    perPage?: number,
  ): Promise<GitHubRepo[]> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    if (page) params.set('page', page.toString());
    if (perPage) params.set('perPage', perPage.toString());

    const response = await apiClient.get<GitHubRepo[]>(
      `/github/repos?${params.toString()}`,
    );
    return response as unknown as GitHubRepo[];
  },

  /** Disconnect GitHub */
  async disconnect(): Promise<void> {
    await apiClient.delete('/github/disconnect');
  },
};
