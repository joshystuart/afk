import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CloudUpload as PushIcon } from '@mui/icons-material';
import { afkColors } from '../themes/afk';

interface CommitPushDialogProps {
  open: boolean;
  onClose: () => void;
  branch: string;
  changedFileCount: number;
  isCommitting: boolean;
  error: string | null;
  onCommitAndPush: (message: string) => Promise<void>;
}

const CommitPushDialog: React.FC<CommitPushDialogProps> = ({
  open,
  onClose,
  branch,
  changedFileCount,
  isCommitting,
  error,
  onCommitAndPush,
}) => {
  const [message, setMessage] = React.useState('');
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleClose = () => {
    if (isCommitting) return;
    setMessage('');
    setLocalError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setLocalError('Commit message is required');
      return;
    }
    setLocalError(null);
    try {
      await onCommitAndPush(message.trim());
      setMessage('');
      onClose();
    } catch {
      // Error is handled by the parent via the error prop
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const displayError = localError || error;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: afkColors.surface,
          border: `1px solid ${afkColors.border}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 1,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.9375rem',
          fontWeight: 600,
        }}
      >
        Commit & Push
        {branch && (
          <Chip
            label={branch}
            size="small"
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.6875rem',
              height: 22,
              bgcolor: afkColors.accentMuted,
              color: afkColors.accent,
              border: `1px solid rgba(16, 185, 129, 0.2)`,
            }}
          />
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: '8px !important' }}>
        <Typography
          variant="body2"
          sx={{
            color: afkColors.textSecondary,
            mb: 2,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.75rem',
          }}
        >
          {changedFileCount} file{changedFileCount !== 1 ? 's' : ''} changed
        </Typography>

        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          placeholder="Commit message..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (localError) setLocalError(null);
          }}
          onKeyDown={handleKeyDown}
          disabled={isCommitting}
          sx={{
            '& .MuiInputBase-input': {
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.875rem',
            },
          }}
        />

        {displayError && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {displayError}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={handleClose}
          disabled={isCommitting}
          sx={{ color: afkColors.textSecondary }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isCommitting || !message.trim()}
          startIcon={
            isCommitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <PushIcon sx={{ fontSize: '16px !important' }} />
            )
          }
        >
          {isCommitting ? 'Pushing...' : 'Commit & Push'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommitPushDialog;
