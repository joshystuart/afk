import type { Meta, StoryObj } from '@storybook/react-vite';
import ApprovalModal from '../components/ApprovalModal';

const meta = {
  title: 'Components/ApprovalModal',
  component: ApprovalModal,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    type: {
      control: 'radio',
      options: ['stop', 'delete'],
    },
  },
} satisfies Meta<typeof ApprovalModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Stop: Story = {
  args: {
    open: true,
    type: 'stop',
    sessionName: 'my-dev-session',
    isLoading: false,
    onClose: () => {},
    onConfirm: () => {},
  },
};

export const Delete: Story = {
  args: {
    open: true,
    type: 'delete',
    sessionName: 'old-experiment',
    isLoading: false,
    onClose: () => {},
    onConfirm: () => {},
  },
};

export const StopLoading: Story = {
  args: {
    open: true,
    type: 'stop',
    sessionName: 'my-dev-session',
    isLoading: true,
    onClose: () => {},
    onConfirm: () => {},
  },
};

export const DeleteLoading: Story = {
  args: {
    open: true,
    type: 'delete',
    sessionName: 'old-experiment',
    isLoading: true,
    onClose: () => {},
    onConfirm: () => {},
  },
};
