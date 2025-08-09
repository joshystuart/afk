import { apiClient } from './client';
import type { Settings, UpdateSettingsRequest } from './types';

export const settingsApi = {
  async getSettings(): Promise<Settings> {
    const response = await apiClient.get<Settings>('/settings');
    // The response interceptor already unwraps the data from the ApiResponse structure
    return response as unknown as Settings;
  },

  async updateSettings(settings: UpdateSettingsRequest): Promise<Settings> {
    const response = await apiClient.put<Settings>('/settings', settings);
    // The response interceptor already unwraps the data from the ApiResponse structure
    return response as unknown as Settings;
  }
};