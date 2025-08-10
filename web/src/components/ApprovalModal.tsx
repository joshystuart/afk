import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Stop as StopIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import AnimateButton from './ui-component/extended/AnimateButton';

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
  const title = `Are you sure you want to ${type} this session?`;
  const icon = isStopAction ? (
    <StopIcon sx={{ color: 'warning.main', fontSize: 48 }} />
  ) : (
    <DeleteIcon sx={{ color: 'error.main', fontSize: 48 }} />
  );

  const description = isStopAction
    ? 'Stopping the session will terminate all running processes and close terminal connections. Any unsaved work may be lost.'
    : 'Deleting the session will permanently remove the container and all its data. This action cannot be undone.';

  const confirmButtonColor = isStopAction ? 'warning' : 'error';
  const confirmButtonText = isStopAction 
    ? (isLoading ? 'Stopping...' : 'Yes, Stop Session')
    : (isLoading ? 'Deleting...' : 'Yes, Delete Session');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {icon}
          <Typography variant={isMobile ? 'h5' : 'h4'} component="div">
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        <Box sx={{ textAlign: 'center' }}>
          {sessionName && (
            <Typography 
              variant="body1" 
              sx={{ 
                fontFamily: 'monospace', 
                bgcolor: 'grey.100',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                px: 2,
                py: 1,
                mb: 2,
                display: 'inline-block',
                ...(theme.palette.mode === 'dark' && {
                  bgcolor: 'grey.900',
                }),
              }}
            >
              {sessionName}
            </Typography>
          )}
          <Typography variant="body1" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
        <AnimateButton>
          <Button
            onClick={onClose}
            variant="outlined"
            size="large"
            disabled={isLoading}
            sx={{ 
              flex: isMobile ? 1 : 'none',
              minWidth: isMobile ? 'auto' : 120,
            }}
          >
            No, Cancel
          </Button>
        </AnimateButton>
        <AnimateButton>
          <Button
            onClick={onConfirm}
            variant="contained"
            size="large"
            color={confirmButtonColor}
            disabled={isLoading}
            sx={{ 
              flex: isMobile ? 1 : 'none',
              minWidth: isMobile ? 'auto' : 160,
            }}
          >
            {confirmButtonText}
          </Button>
        </AnimateButton>
      </DialogActions>
    </Dialog>
  );
};

export default ApprovalModal;