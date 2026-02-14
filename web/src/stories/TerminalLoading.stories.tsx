import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mui/material';
import TerminalLoading from '../components/TerminalLoading';

const meta = {
  title: 'Components/TerminalLoading',
  component: TerminalLoading,
  decorators: [
    (Story) => (
      <Box
        sx={{
          width: 500,
          height: 300,
          border: '1px solid #1c1c1f',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof TerminalLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    title: 'Claude Terminal',
    message: 'Starting Claude terminal...',
    isError: false,
  },
};

export const WaitingForContainer: Story = {
  args: {
    title: 'Manual Terminal',
    message: 'Waiting for container...',
    isError: false,
  },
};

export const Error: Story = {
  args: {
    title: 'Claude Terminal',
    message: 'Failed to connect to terminal',
    isError: true,
    onRetry: () => console.log('Retry clicked'),
  },
};
