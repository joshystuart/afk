import { create } from 'zustand';
import type { Settings, UpdateSettingsRequest } from '../api/types';
import { settingsApi } from '../api/settings.api';

interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: UpdateSettingsRequest) => Promise<void>;
  clearError: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const settings = await settingsApi.getSettings();
      set({ settings, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to fetch settings',
        loading: false,
      });
    }
  },

  updateSettings: async (settingsUpdate: UpdateSettingsRequest) => {
    set({ loading: true, error: null });
    try {
      const settings = await settingsApi.updateSettings(settingsUpdate);
      set({ settings, loading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to update settings',
        loading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
