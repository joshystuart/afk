import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateSession } from '../pages/CreateSession';
import { useSettingsStore } from '../stores/settings.store';
import { useDockerImagesStore } from '../stores/docker-images.store';
import type { Settings, DockerImage } from '../api/types';

// ---------------------------------------------------------------------------
// Mock settings data
// ---------------------------------------------------------------------------

const now = new Date().toISOString();

const baseSettings: Settings = {
  hasSshPrivateKey: false,
  hasClaudeToken: false,
  hasGitHubToken: false,
  hasGithubClientSecret: false,
  dockerSocketPath: null,
  dockerStartPort: null,
  dockerEndPort: null,
  githubClientId: null,
  githubCallbackUrl: null,
  githubFrontendRedirectUrl: null,
  updatedAt: now,
};

const configuredSettings: Settings = {
  ...baseSettings,
  hasSshPrivateKey: true,
  hasClaudeToken: true,
  claudeToken: 'sk-a••••••••••••oken',
  gitUserName: 'dev-user',
  gitUserEmail: 'dev@example.com',
};

const missingAllSettings: Settings = {
  ...baseSettings,
};

const missingSshKeyOnly: Settings = {
  ...baseSettings,
  hasClaudeToken: true,
  claudeToken: 'sk-a••••••••••••oken',
  gitUserName: 'dev-user',
  gitUserEmail: 'dev@example.com',
};

const missingClaudeTokenOnly: Settings = {
  ...baseSettings,
  hasSshPrivateKey: true,
  gitUserName: 'dev-user',
  gitUserEmail: 'dev@example.com',
};

// ---------------------------------------------------------------------------
// Mock docker images
// ---------------------------------------------------------------------------

const mockDockerImages: DockerImage[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Node.js',
    image: 'afk-node:latest',
    isDefault: true,
    isBuiltIn: true,
    status: 'AVAILABLE',
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Python',
    image: 'afk-python:latest',
    isDefault: false,
    isBuiltIn: true,
    status: 'AVAILABLE',
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Go',
    image: 'afk-go:latest',
    isDefault: false,
    isBuiltIn: true,
    status: 'AVAILABLE',
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: '.NET',
    image: 'afk-dotnet:latest',
    isDefault: false,
    isBuiltIn: true,
    status: 'AVAILABLE',
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  },
];

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

    useDockerImagesStore.setState({
      images: mockDockerImages,
      loading: false,
      error: null,
      fetchImages: noop,
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
