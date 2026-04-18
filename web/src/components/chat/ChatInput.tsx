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
  AGENT_MODES,
  DEFAULT_AGENT_MODE,
  getAgentModeLabel,
  getNextAgentMode,
  type AgentModeId,
} from '../../utils/agent-modes';
import { SkillAutocomplete } from './SkillAutocomplete';
import { FileAutocomplete } from './FileAutocomplete';
import type { SkillInfo } from '../../api/types';

export const DEFAULT_MODEL = DEFAULT_CLAUDE_MODEL;
export type ModelId = ClaudeModelId;
export { DEFAULT_AGENT_MODE };
export type { AgentModeId };

interface ChatInputProps {
  onSend: (
    content: string,
    continueConversation: boolean,
    model?: string,
  ) => void;
  onCancel: () => void;
  isProcessing: boolean;
  disabled?: boolean;
  selectedModel: ClaudeModelId;
  onModelChange: (model: ClaudeModelId) => void;
  selectedAgentMode: AgentModeId;
  onAgentModeChange: (mode: AgentModeId) => void;
  skills?: SkillInfo[];
  sessionId?: string;
  fileIndex?: string[];
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onCancel,
  isProcessing,
  disabled = false,
  selectedModel,
  onModelChange,
  selectedAgentMode,
  onAgentModeChange,
  skills = [],
  fileIndex = [],
}) => {
  const [value, setValue] = React.useState('');
  const [continueConversation, setContinueConversation] = React.useState(true);
  const [modelAnchorEl, setModelAnchorEl] = React.useState<null | HTMLElement>(
    null,
  );
  const [agentModeAnchorEl, setAgentModeAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const [showAutocomplete, setShowAutocomplete] = React.useState(false);
  const [autocompleteFilter, setAutocompleteFilter] = React.useState('');
  const [showFileAutocomplete, setShowFileAutocomplete] = React.useState(false);
  const [fileAutocompleteFilter, setFileAutocompleteFilter] =
    React.useState('');
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = React.useRef<HTMLDivElement>(null);

  const selectedModelLabel = getClaudeModelLabel(selectedModel);
  const selectedAgentModeLabel = getAgentModeLabel(selectedAgentMode);

  useHotkeys(
    'shift+tab',
    (e) => {
      e.preventDefault();
      if (!isProcessing) {
        onAgentModeChange(getNextAgentMode(selectedAgentMode));
      }
    },
    { enableOnFormTags: ['TEXTAREA', 'INPUT'] },
    [selectedAgentMode, isProcessing, onAgentModeChange],
  );

  const findSlashToken = (text: string, cursorPos: number) => {
    const before = text.slice(0, cursorPos);
    const match = before.match(/(^|\s)\/([\w-]*)$/);
    if (!match) return null;
    return {
      filter: match[2],
      start: before.lastIndexOf('/'),
    };
  };

  const findAtToken = (text: string, cursorPos: number) => {
    const before = text.slice(0, cursorPos);
    const match = before.match(/(^|\s)@([\w./-]*)$/);
    if (!match) return null;
    return {
      filter: match[2],
      start: before.lastIndexOf('@'),
    };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    const cursorPos =
      (e.target as HTMLInputElement).selectionStart ?? newValue.length;
    const token = findSlashToken(newValue, cursorPos);
    const slashActive = !!token && skills.length > 0;

    if (slashActive && token) {
      setShowAutocomplete(true);
      setAutocompleteFilter(token.filter);
    } else {
      setShowAutocomplete(false);
    }

    const atToken = slashActive ? null : findAtToken(newValue, cursorPos);
    if (atToken && fileIndex.length > 0) {
      setShowFileAutocomplete(true);
      setFileAutocompleteFilter(atToken.filter);
    } else {
      setShowFileAutocomplete(false);
    }
  };

  const handleSkillSelect = (skillName: string) => {
    const cursorPos = inputRef.current?.selectionStart ?? value.length;
    const token = findSlashToken(value, cursorPos);
    if (token) {
      const before = value.slice(0, token.start);
      const after = value.slice(cursorPos);
      const newValue = `${before}/${skillName} ${after}`;
      setValue(newValue);
    }
    setShowAutocomplete(false);
    inputRef.current?.focus();
  };

  const handleFileSelect = (filePath: string) => {
    const cursorPos = inputRef.current?.selectionStart ?? value.length;
    const atToken = findAtToken(value, cursorPos);
    if (atToken) {
      const before = value.slice(0, atToken.start);
      const after = value.slice(cursorPos);
      const newValue = `${before}@${filePath} ${after}`;
      setValue(newValue);
    }
    setShowFileAutocomplete(false);
    inputRef.current?.focus();
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isProcessing || disabled) return;
    onSend(trimmed, continueConversation, selectedModel);
    setValue('');
    setShowAutocomplete(false);
    setShowFileAutocomplete(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showAutocomplete || showFileAutocomplete) return;
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
      <Box
        ref={inputContainerRef}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          position: 'relative',
        }}
      >
        {showAutocomplete && (
          <SkillAutocomplete
            skills={skills}
            filter={autocompleteFilter}
            onSelect={handleSkillSelect}
            onClose={() => setShowAutocomplete(false)}
            anchorEl={inputRef.current}
          />
        )}
        {showFileAutocomplete && (
          <FileAutocomplete
            files={fileIndex}
            filter={fileAutocompleteFilter}
            onSelect={handleFileSelect}
            onClose={() => setShowFileAutocomplete(false)}
            anchorEl={inputRef.current}
          />
        )}
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={6}
          placeholder={
            isProcessing
              ? 'Claude is working...'
              : 'Send a message to Claude... (type / for skills, @ for files)'
          }
          value={value}
          onChange={handleChange}
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

      {/* Bottom toolbar: model selector (left) + continue toggle (right) */}
      <Box
        sx={{
          mt: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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

          <Tooltip title="Shift+Tab to cycle">
            <Button
              size="small"
              onClick={(e) => setAgentModeAnchorEl(e.currentTarget)}
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
              {selectedAgentModeLabel}
            </Button>
          </Tooltip>

          <Menu
            anchorEl={agentModeAnchorEl}
            open={Boolean(agentModeAnchorEl)}
            onClose={() => setAgentModeAnchorEl(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            slotProps={{
              paper: {
                sx: {
                  bgcolor: afkColors.surface,
                  border: `1px solid ${afkColors.border}`,
                  minWidth: 120,
                },
              },
            }}
          >
            {AGENT_MODES.map((mode) => (
              <MenuItem
                key={mode.id}
                selected={mode.id === selectedAgentMode}
                onClick={() => {
                  onAgentModeChange(mode.id);
                  setAgentModeAnchorEl(null);
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
