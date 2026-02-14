import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from '../pages/Login';

const queryClient = new QueryClient();

const meta = {
  title: 'Pages/Login',
  component: Login,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Box sx={{ width: '100vw', height: '100vh' }}>
            <Story />
          </Box>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof Login>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
