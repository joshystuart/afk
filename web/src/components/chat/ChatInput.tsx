import React from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Switch,
  Typography,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Send as SendIcon,
  Stop as StopIcon,
  KeyboardArrowDown as ChevronDownIcon,
} from '@mui/icons-material';
import { useHotkeys } from 'react-hotkeys-hook';
import { afkColors } from '../../themes/afk';
import {
  CLAUDE_MODELS,
  DEFAULT_CLAUDE_MODEL,
  getClaudeModelLabel,
  type ClaudeModelId,
} from '../../utils/claude-models';
import {
  CLAUDE_MODES,
  DEFAULT_CLAUDE_MODE,
  getClaudeModeLabel,
  type ClaudeModeId,
} from '../../utils/claude-modes';

export const DEFAULT_MODEL = DEFAULT_CLAUDE_MODEL;
export type ModelId = ClaudeModelId;
export const DEFAULT_MODE = DEFAULT_CLAUDE_MODE;
export type ModeId = ClaudeModeId;

interface ChatInputProps {
  onSend: (
    content: string,
    continueConversation: boolean,
    model?: string,
    permissionMode?: string,
  ) => void;
  onCancel: () => void;
  isProcessing: boolean;
  disabled?: boolean;
  selectedModel: ClaudeModelId;
  onModelChange: (model: ClaudeModelId) => void;
  selectedMode: ClaudeModeId;
  onModeChange: (mode: ClaudeModeId) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onCancel,
  isProcessing,
  disabled = false,
  selectedModel,
  onModelChange,
  selectedMode,
  onModeChange,
}) => {
  const [value, setValue] = React.useState('');
  const [continueConversation, setContinueConversation] = React.useState(true);
  const [modelAnchorEl, setModelAnchorEl] = React.useState<null | HTMLElement>(
    null,
  );
  const [modeAnchorEl, setModeAnchorEl] = React.useState<null | HTMLElement>(
    null,
  );
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const selectedModelLabel = getClaudeModelLabel(selectedModel);
  const selectedModeLabel = getClaudeModeLabel(selectedMode);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isProcessing || disabled) return;
    onSend(trimmed, continueConversation, selectedModel, selectedMode);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Cycle Agent / Plan with Shift+Tab while the message box is focused (document-level; scoped via ignoreEventWhen).
  // Returned ref is intentionally unused so the listener stays on document (avoids focus-guard side effects).
  void useHotkeys(
    'shift+tab',
    () => {
      const idx = CLAUDE_MODES.findIndex((m) => m.id === selectedMode);
      const safeIdx = idx === -1 ? 0 : idx;
      const nextIdx = (safeIdx - 1 + CLAUDE_MODES.length) % CLAUDE_MODES.length;
      onModeChange(CLAUDE_MODES[nextIdx].id);
    },
    {
      enabled: !isProcessing && !disabled,
      enableOnFormTags: ['textarea'],
      preventDefault: true,
      ignoreEventWhen: (e) => e.target !== inputRef.current,
    },
    [selectedMode, isProcessing, disabled, onModeChange],
  );

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                alignSelf: 'stretch',
                borderRadius: '6px',
                width: 42,
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
            <span style={{ alignSelf: 'stretch', display: 'flex' }}>
              <IconButton
                onClick={handleSend}
                disabled={!value.trim() || disabled}
                sx={{
                  bgcolor: value.trim()
                    ? afkColors.accent
                    : afkColors.surfaceElevated,
                  color: value.trim() ? '#fff' : afkColors.textTertiary,
                  alignSelf: 'stretch',
                  borderRadius: '6px',
                  width: 42,
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

      {/* Bottom toolbar: model + mode (left) + continue toggle (right) */}
      <Box
        sx={{
          mt: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            onClick={(e) => setModelAnchorEl(e.currentTarget)}
            disabled={isProcessing}
            endIcon={<ChevronDownIcon sx={{ fontSize: '14px !important' }} />}
            sx={{
              color: afkColors.textSecondary,
              fontSize: '0.7rem',
              fontFamily: '"JetBrains Mono", monospace',
              textTransform: 'none',
              px: 1,
              py: 0.25,
              minWidth: 'auto',
              borderRadius: '4px',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.04)',
                color: afkColors.textPrimary,
              },
            }}
          >
            {selectedModelLabel}
          </Button>

          <Menu
            anchorEl={modelAnchorEl}
            open={Boolean(modelAnchorEl)}
            onClose={() => setModelAnchorEl(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            slotProps={{
              paper: {
                sx: {
                  bgcolor: afkColors.surface,
                  border: `1px solid ${afkColors.border}`,
                  minWidth: 160,
                },
              },
            }}
          >
            {CLAUDE_MODELS.map((model) => (
              <MenuItem
                key={model.id}
                selected={model.id === selectedModel}
                onClick={() => {
                  onModelChange(model.id);
                  setModelAnchorEl(null);
                }}
                sx={{
                  fontSize: '0.8rem',
                  fontFamily: '"JetBrains Mono", monospace',
                  py: 0.75,
                }}
              >
                {model.label}
              </MenuItem>
            ))}
          </Menu>

          <Tooltip title="Mode (Shift+Tab in message box)">
            <Button
              size="small"
              onClick={(e) => setModeAnchorEl(e.currentTarget)}
              disabled={isProcessing}
              endIcon={<ChevronDownIcon sx={{ fontSize: '14px !important' }} />}
              sx={{
                color: afkColors.textSecondary,
                fontSize: '0.7rem',
                fontFamily: '"JetBrains Mono", monospace',
                textTransform: 'none',
                px: 1,
                py: 0.25,
                minWidth: 'auto',
                borderRadius: '4px',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.04)',
                  color: afkColors.textPrimary,
                },
              }}
            >
              {selectedModeLabel}
            </Button>
          </Tooltip>

          <Menu
            anchorEl={modeAnchorEl}
            open={Boolean(modeAnchorEl)}
            onClose={() => setModeAnchorEl(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            slotProps={{
              paper: {
                sx: {
                  bgcolor: afkColors.surface,
                  border: `1px solid ${afkColors.border}`,
                  minWidth: 160,
                },
              },
            }}
          >
            {CLAUDE_MODES.map((mode) => (
              <MenuItem
                key={mode.id}
                selected={mode.id === selectedMode}
                onClick={() => {
                  onModeChange(mode.id);
                  setModeAnchorEl(null);
                }}
                sx={{
                  fontSize: '0.8rem',
                  fontFamily: '"JetBrains Mono", monospace',
                  py: 0.75,
                }}
              >
                {mode.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: afkColors.textSecondary,
              fontSize: '0.7rem',
              userSelect: 'none',
              cursor: 'pointer',
            }}
            onClick={() => !isProcessing && setContinueConversation((v) => !v)}
          >
            Continue
          </Typography>
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
        </Box>
      </Box>
    </Box>
  );
};
