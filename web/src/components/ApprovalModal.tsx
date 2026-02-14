import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { afkColors } from '../themes/afk';

export interface ApprovalModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'stop' | 'delete';
  sessionName?: string;
  isLoading?: boolean;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({
  open,
  onClose,
  onConfirm,
  type,
  sessionName,
  isLoading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isStopAction = type === 'stop';
  const title = isStopAction ? 'Stop session?' : 'Delete session?';

  const description = isStopAction
    ? 'This will terminate all running processes and close terminal connections.'
    : 'This will permanently remove the container and all its data.';

  const confirmButtonText = isStopAction
    ? isLoading
      ? 'Stopping...'
      : 'Stop Session'
    : isLoading
      ? 'Deleting...'
      : 'Delete Session';

  return (
    <Dialog
      open={open}
      onClose={onClose}
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

        {sessionName && (
          <Box
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.8125rem',
              color: afkColors.accent,
              bgcolor: afkColors.accentMuted,
              borderRadius: '4px',
              px: 1.5,
              py: 0.75,
              mb: 2,
              display: 'inline-block',
            }}
          >
            {sessionName}
          </Box>
        )}

        <Typography variant="body2" sx={{ color: afkColors.textSecondary }}>
          {description}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          size="small"
          disabled={isLoading}
          sx={{ flex: isMobile ? 1 : 'none' }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          size="small"
          disabled={isLoading}
          sx={{
            flex: isMobile ? 1 : 'none',
            bgcolor: isStopAction ? afkColors.warning : afkColors.danger,
            color: isStopAction ? '#000' : '#fff',
            '&:hover': {
              bgcolor: isStopAction ? '#d97706' : '#dc2626',
            },
          }}
        >
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApprovalModal;
