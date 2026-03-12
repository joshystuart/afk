import React from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Typography,
} from '@mui/material';
import {
  Send as SendIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { afkColors } from '../../themes/afk';

interface ChatInputProps {
  onSend: (content: string, continueConversation: boolean) => void;
  onCancel: () => void;
  isProcessing: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onCancel,
  isProcessing,
  disabled = false,
}) => {
  const [value, setValue] = React.useState('');
  const [continueConversation, setContinueConversation] = React.useState(true);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isProcessing || disabled) return;
    onSend(trimmed, continueConversation);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  React.useEffect(() => {
    if (!isProcessing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isProcessing]);

  return (
    <Box
      sx={{
        p: 2,
        borderTop: `1px solid ${afkColors.border}`,
        bgcolor: afkColors.surface,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={6}
          placeholder={
            isProcessing
              ? 'Claude is working...'
              : 'Send a message to Claude...'
          }
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing || disabled}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: afkColors.surfaceElevated,
              fontSize: '0.875rem',
            },
          }}
        />
        {isProcessing ? (
          <Tooltip title="Cancel execution">
            <IconButton
              onClick={onCancel}
              sx={{
                bgcolor: afkColors.dangerMuted,
                color: afkColors.danger,
                '&:hover': {
                  bgcolor: 'rgba(239, 68, 68, 0.2)',
                },
              }}
            >
              <StopIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Send (Enter)">
            <span>
              <IconButton
                onClick={handleSend}
                disabled={!value.trim() || disabled}
                sx={{
                  bgcolor: value.trim()
                    ? afkColors.accent
                    : afkColors.surfaceElevated,
                  color: value.trim()
                    ? '#fff'
                    : afkColors.textTertiary,
                  '&:hover': {
                    bgcolor: value.trim()
                      ? afkColors.accentDark
                      : afkColors.surfaceElevated,
                  },
                  '&.Mui-disabled': {
                    bgcolor: afkColors.surfaceElevated,
                    color: afkColors.textTertiary,
                  },
                }}
              >
                <SendIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={continueConversation}
              onChange={(e) => setContinueConversation(e.target.checked)}
              disabled={isProcessing}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: afkColors.accent,
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  bgcolor: afkColors.accentMuted,
                },
              }}
            />
          }
          label={
            <Typography
              variant="caption"
              sx={{ color: afkColors.textSecondary, fontSize: '0.7rem' }}
            >
              Continue conversation
            </Typography>
          }
        />
      </Box>
    </Box>
  );
};
