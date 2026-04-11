import { apiClient } from './client';
import type {
  Settings,
  UpdateSettingsRequest,
  ListSkillsResponse,
} from './types';

export const settingsApi = {
  async getSettings(): Promise<Settings> {
    const response = await apiClient.get<Settings>('/settings');
    return response as unknown as Settings;
  },

  async updateSettings(settings: UpdateSettingsRequest): Promise<Settings> {
    const response = await apiClient.put<Settings>('/settings', settings);
    return response as unknown as Settings;
  },

  async listSkills(): Promise<ListSkillsResponse> {
    const response =
      await apiClient.get<ListSkillsResponse>('/settings/skills');
    return response as unknown as ListSkillsResponse;
  },
};
