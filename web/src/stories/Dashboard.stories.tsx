import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../pages/Dashboard';
import { useSessionStore } from '../stores/session.store';
import { SessionStatus, TerminalMode } from '../api/types';
import type { Session } from '../api/types';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const now = new Date().toISOString();
const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
const dayAgo = new Date(Date.now() - 86_400_000).toISOString();

const mockSessions = {
  runningDual: {
    id: 'abc123def456abc1',
    name: 'frontend-refactor',
    status: SessionStatus.RUNNING,
    repoUrl: 'https://github.com/acme/webapp.git',
    branch: 'main',
    terminalMode: TerminalMode.DUAL,
    ports: { claude: 7681, manual: 7682 },
    terminalUrls: {
      claude: 'http://localhost:7681',
      manual: 'http://localhost:7682',
    },
    createdAt: hourAgo,
    updatedAt: now,
  },
  runningSimple: {
    id: '789ghi012jkl7891',
    name: 'api-migration',
    status: SessionStatus.RUNNING,
    repoUrl: 'https://github.com/acme/api-service.git',
    branch: 'feature/v2',
    terminalMode: TerminalMode.SIMPLE,
    ports: { claude: 7683, manual: 7684 },
    terminalUrls: {
      claude: 'http://localhost:7683',
      manual: 'http://localhost:7684',
    },
    createdAt: dayAgo,
    updatedAt: now,
  },
  stopped: {
    id: 'mno345pqr678mno3',
    name: 'data-pipeline',
    status: SessionStatus.STOPPED,
    repoUrl: 'https://github.com/acme/etl-jobs.git',
    branch: 'main',
    terminalMode: TerminalMode.SIMPLE,
    createdAt: dayAgo,
    updatedAt: hourAgo,
  },
  error: {
    id: 'stu901vwx234stu9',
    name: 'broken-build',
    status: SessionStatus.ERROR,
    repoUrl: 'https://github.com/acme/legacy-app.git',
    branch: 'hotfix/auth',
    terminalMode: TerminalMode.DUAL,
    createdAt: dayAgo,
    updatedAt: hourAgo,
  },
  noRepo: {
    id: 'nrp456abc789nrp4',
    name: 'scratch-session',
    status: SessionStatus.RUNNING,
    branch: 'main',
    terminalMode: TerminalMode.SIMPLE,
    ports: { claude: 7685, manual: 7686 },
    terminalUrls: {
      claude: 'http://localhost:7685',
      manual: 'http://localhost:7686',
    },
    createdAt: hourAgo,
    updatedAt: now,
  },
} satisfies Record<string, Session>;

const allSessions = Object.values(mockSessions);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a QueryClient pre-loaded with session data that will never refetch. */
const createStoryQueryClient = (sessions: Session[]) => {
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
  qc.setQueryData(['sessions'], sessions);
  return qc;
};

interface StoryConfig {
  sessions?: Session[];
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Creates a Storybook decorator that provides all the context the Dashboard
 * needs: a MemoryRouter, a pre-populated QueryClient, and a zustand store
 * initialised with the given config.
 */
const withDashboardContext = (config: StoryConfig = {}) => {
  const sessions = config.sessions ?? [];
  const queryClient = createStoryQueryClient(sessions);

  return (Story: () => React.JSX.Element) => {
    useSessionStore.setState({
      sessions,
      currentSession: null,
      isLoading: config.isLoading ?? false,
      error: config.error ?? null,
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
  title: 'Pages/Dashboard',
  component: Dashboard,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Dashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Skeleton loading state shown on initial load. */
export const Loading: Story = {
  decorators: [withDashboardContext({ isLoading: true })],
};

/** Empty state when the user has no sessions yet. */
export const Empty: Story = {
  decorators: [withDashboardContext({})],
};

/** A mix of running, stopped, and error sessions. */
export const WithSessions: Story = {
  decorators: [withDashboardContext({ sessions: allSessions })],
};

/** Only running sessions – shows terminal access icons. */
export const RunningSessions: Story = {
  decorators: [
    withDashboardContext({
      sessions: [mockSessions.runningDual, mockSessions.runningSimple],
    }),
  ],
};

/** A single running session with dual terminal mode. */
export const SingleDualSession: Story = {
  decorators: [withDashboardContext({ sessions: [mockSessions.runningDual] })],
};

/** Only stopped sessions – shows the Start and Delete actions. */
export const StoppedSessions: Story = {
  decorators: [withDashboardContext({ sessions: [mockSessions.stopped] })],
};

/** Only sessions in error state – shows the Delete action. */
export const ErrorSessions: Story = {
  decorators: [withDashboardContext({ sessions: [mockSessions.error] })],
};

/** Dashboard with an error banner displayed above the session grid. */
export const WithErrorBanner: Story = {
  decorators: [
    withDashboardContext({
      sessions: allSessions,
      error:
        'Failed to connect to the server. Please check your connection and try again.',
    }),
  ],
};

/** A session without a repository URL. */
export const SessionWithoutRepo: Story = {
  decorators: [withDashboardContext({ sessions: [mockSessions.noRepo] })],
};
