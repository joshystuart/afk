import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateSession from '../pages/CreateSession';
import { useSettingsStore } from '../stores/settings.store';
import type { Settings } from '../api/types';

// ---------------------------------------------------------------------------
// Mock settings data
// ---------------------------------------------------------------------------

const now = new Date().toISOString();

const configuredSettings: Settings = {
  hasSshPrivateKey: true,
  hasGitHubToken: false,
  claudeToken: 'sk-ant-mock-token',
  gitUserName: 'dev-user',
  gitUserEmail: 'dev@example.com',
  updatedAt: now,
};

const missingAllSettings: Settings = {
  hasSshPrivateKey: false,
  hasGitHubToken: false,
  claudeToken: undefined,
  updatedAt: now,
};

const missingSshKeyOnly: Settings = {
  hasSshPrivateKey: false,
  hasGitHubToken: false,
  claudeToken: 'sk-ant-mock-token',
  gitUserName: 'dev-user',
  gitUserEmail: 'dev@example.com',
  updatedAt: now,
};

const missingClaudeTokenOnly: Settings = {
  hasSshPrivateKey: true,
  hasGitHubToken: false,
  claudeToken: undefined,
  gitUserName: 'dev-user',
  gitUserEmail: 'dev@example.com',
  updatedAt: now,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a QueryClient that won't attempt real API requests. */
const createStoryQueryClient = () => {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      },
    },
  });
  qc.setQueryData(['sessions'], []);
  return qc;
};

// Stable no-op to avoid unnecessary re-renders from useEffect
const noop = async () => {};

interface StoryConfig {
  settings?: Settings | null;
}

/**
 * Creates a Storybook decorator that provides all the context the
 * CreateSession page needs: a MemoryRouter, a pre-populated QueryClient,
 * and a settings store initialised with the given config.
 */
const withCreateSessionContext = (config: StoryConfig = {}) => {
  const queryClient = createStoryQueryClient();

  return (Story: () => React.JSX.Element) => {
    useSettingsStore.setState({
      settings: config.settings ?? configuredSettings,
      loading: false,
      error: null,
      fetchSettings: noop,
    });

    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Box sx={{ width: '100%', minHeight: '100vh' }}>
            <Story />
          </Box>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: 'Pages/CreateSession',
  component: CreateSession,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof CreateSession>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Default state with all settings configured. Form is ready to use. */
export const Default: Story = {
  decorators: [withCreateSessionContext()],
};

/** Warning banner when both SSH key and Claude token are missing. Create button is disabled. */
export const MissingSettings: Story = {
  decorators: [withCreateSessionContext({ settings: missingAllSettings })],
};

/** Warning when only the SSH key is missing. */
export const MissingSshKey: Story = {
  decorators: [withCreateSessionContext({ settings: missingSshKeyOnly })],
};

/** Warning when only the Claude token is missing. */
export const MissingClaudeToken: Story = {
  decorators: [withCreateSessionContext({ settings: missingClaudeTokenOnly })],
};

/** Settings have not loaded yet – treated the same as missing settings. */
export const SettingsNotLoaded: Story = {
  decorators: [withCreateSessionContext({ settings: null })],
};
