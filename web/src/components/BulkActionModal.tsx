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

export interface BulkActionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'stop-all' | 'delete-all';
  count: number;
  isLoading?: boolean;
  progress?: { current: number; total: number } | null;
}

const BulkActionModal: React.FC<BulkActionModalProps> = ({
  open,
  onClose,
  onConfirm,
  type,
  count,
  isLoading = false,
  progress,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isStop = type === 'stop-all';

  const title = isStop
    ? isLoading
      ? 'Stopping sessions...'
      : 'Stop all running sessions?'
    : isLoading
      ? 'Deleting sessions...'
      : 'Delete all stopped/errored sessions?';

  const description = isStop
    ? `This will stop ${count} running session${count !== 1 ? 's' : ''}. All processes and terminal connections will be terminated.`
    : `This will permanently delete ${count} stopped/errored session${count !== 1 ? 's' : ''} and all their data.`;

  const confirmText = isStop
    ? `Stop ${count} Session${count !== 1 ? 's' : ''}`
    : `Delete ${count} Session${count !== 1 ? 's' : ''}`;

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

        {isLoading && progress ? (
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
              {isStop ? 'Stopping' : 'Deleting'} {progress.current} of{' '}
              {progress.total}...
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
              bgcolor: isStop ? afkColors.warning : afkColors.danger,
              color: isStop ? '#000' : '#fff',
              '&:hover': {
                bgcolor: isStop ? '#d97706' : '#dc2626',
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

export default BulkActionModal;
