import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import Settings from '../pages/Settings';
import { useSettingsStore } from '../stores/settings.store';
import type { Settings as SettingsType } from '../api/types';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const now = new Date().toISOString();

const mockSettings = {
  empty: {
    hasSshPrivateKey: false,
    claudeToken: '',
    gitUserName: '',
    gitUserEmail: '',
    updatedAt: now,
  },
  partial: {
    hasSshPrivateKey: false,
    claudeToken: '',
    gitUserName: 'Jane Doe',
    gitUserEmail: 'jane@example.com',
    updatedAt: now,
  },
  fullyConfigured: {
    hasSshPrivateKey: true,
    claudeToken: 'sk-ant-api03-abc123xyz',
    gitUserName: 'Jane Doe',
    gitUserEmail: 'jane@example.com',
    updatedAt: now,
  },
  withSshKeyOnly: {
    hasSshPrivateKey: true,
    claudeToken: '',
    gitUserName: '',
    gitUserEmail: '',
    updatedAt: now,
  },
} satisfies Record<string, SettingsType>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface StoryConfig {
  settings?: SettingsType | null;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Creates a Storybook decorator that provides all the context the Settings
 * page needs: a MemoryRouter and a zustand store initialised with the
 * given config.
 */
const withSettingsContext = (config: StoryConfig = {}) => {
  return (Story: () => React.JSX.Element) => {
    useSettingsStore.setState({
      settings: config.settings ?? null,
      loading: config.isLoading ?? false,
      error: config.error ?? null,
      // Provide no-op implementations so the component doesn't fire real API calls
      fetchSettings: async () => {},
      updateSettings: async () => {},
      clearError: () => useSettingsStore.setState({ error: null }),
    });

    return (
      <MemoryRouter>
        <Box sx={{ width: '100%', minHeight: '100vh' }}>
          <Story />
        </Box>
      </MemoryRouter>
    );
  };
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: 'Pages/Settings',
  component: Settings,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Settings>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Spinner shown while settings are being fetched for the first time. */
export const Loading: Story = {
  decorators: [withSettingsContext({ isLoading: true })],
};

/** Default state with all fields empty (fresh install). */
export const Empty: Story = {
  decorators: [withSettingsContext({ settings: mockSettings.empty })],
};

/** Only git configuration is filled in. */
export const GitConfigured: Story = {
  decorators: [withSettingsContext({ settings: mockSettings.partial })],
};

/** All settings are fully configured, including an SSH key. */
export const FullyConfigured: Story = {
  decorators: [withSettingsContext({ settings: mockSettings.fullyConfigured })],
};

/** Only the SSH key is configured – shows the lock indicator. */
export const SshKeyConfigured: Story = {
  decorators: [withSettingsContext({ settings: mockSettings.withSshKeyOnly })],
};

/** Settings form with an error banner displayed. */
export const WithError: Story = {
  decorators: [
    withSettingsContext({
      settings: mockSettings.fullyConfigured,
      error:
        'Failed to save settings. Please check your connection and try again.',
    }),
  ],
};
