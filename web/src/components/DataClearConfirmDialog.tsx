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
  type: 'sessions' | 'jobs';
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

  const isSessions = type === 'sessions';

  const title = isLoading
    ? isSessions
      ? 'Clearing sessions...'
      : 'Clearing scheduled jobs...'
    : isSessions
      ? 'Clear all sessions?'
      : 'Clear all scheduled jobs?';

  const description = isSessions
    ? 'This will stop all running sessions and permanently delete every session, including Docker containers, volumes, and chat history. This action cannot be undone.'
    : 'This will permanently delete all scheduled jobs, their run history, scheduler registrations, and launchd plists. This action cannot be undone.';

  const confirmText = isSessions ? 'Clear All Sessions' : 'Clear All Jobs';

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
              {isSessions
                ? 'Stopping and deleting all sessions...'
                : 'Deleting all scheduled jobs...'}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: afkColors.textSecondary }}>
            {description}
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
            {confirmText}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export { DataClearConfirmDialog };
