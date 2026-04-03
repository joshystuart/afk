import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { afkColors } from '../themes/afk';

export interface DataClearConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'sessions' | 'jobs' | 'prepare-uninstall';
  isLoading?: boolean;
}

const DataClearConfirmDialog: React.FC<DataClearConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  type,
  isLoading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const dialogCopy = {
    sessions: {
      loadingTitle: 'Clearing sessions...',
      title: 'Clear all sessions?',
      description:
        'This will stop all running sessions and permanently delete every session, including Docker containers, volumes, and chat history. This action cannot be undone.',
      confirmText: 'Clear All Sessions',
      loadingDescription: 'Stopping and deleting all sessions...',
    },
    jobs: {
      loadingTitle: 'Clearing scheduled jobs...',
      title: 'Clear all scheduled jobs?',
      description:
        'This will permanently delete all scheduled jobs, their run history, scheduler registrations, and launchd plists. This action cannot be undone.',
      confirmText: 'Clear All Jobs',
      loadingDescription: 'Deleting all scheduled jobs...',
    },
    'prepare-uninstall': {
      loadingTitle: 'Preparing for uninstall...',
      title: 'Prepare AFK for uninstall?',
      description:
        'This will disable all scheduled jobs and remove AFK launchd LaunchAgents so AFK does not relaunch itself after you remove the app from /Applications.',
      confirmText: 'Prepare for Uninstall',
      loadingDescription:
        'Disabling scheduled jobs and removing LaunchAgents...',
    },
  } as const;
  const copy = dialogCopy[type];
  const title = isLoading ? copy.loadingTitle : copy.title;

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '12px',
          p: 1,
        },
      }}
    >
      <DialogContent sx={{ pb: 1 }}>
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '1rem',
            fontWeight: 600,
            color: afkColors.textPrimary,
            mb: 1.5,
          }}
        >
          {title}
        </Typography>

        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mt: 1,
            }}
          >
            <CircularProgress
              size={16}
              sx={{ color: afkColors.textTertiary }}
            />
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.75rem',
                color: afkColors.textSecondary,
              }}
            >
              {copy.loadingDescription}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: afkColors.textSecondary }}>
            {copy.description}
          </Typography>
        )}
      </DialogContent>

      {!isLoading && (
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            size="small"
            sx={{ flex: isMobile ? 1 : 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="contained"
            size="small"
            sx={{
              flex: isMobile ? 1 : 'none',
              bgcolor: afkColors.danger,
              color: '#fff',
              '&:hover': {
                bgcolor: '#dc2626',
              },
            }}
          >
            {copy.confirmText}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export { DataClearConfirmDialog };
