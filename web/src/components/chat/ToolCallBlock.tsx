import React from 'react';
import { Box, Typography, Collapse, IconButton, Chip } from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Build as ToolIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { afkColors } from '../../themes/afk';

interface ToolCallBlockProps {
  toolName: string;
  input?: any;
  result?: any;
  isError?: boolean;
}

export const ToolCallBlock: React.FC<ToolCallBlockProps> = ({
  toolName,
  input,
  result,
  isError = false,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const inputSummary = React.useMemo(() => {
    if (!input) return '';
    if (typeof input === 'string') return input;
    if (input.command) return input.command;
    if (input.file_path || input.path) return input.file_path || input.path;
    if (input.query) return input.query;
    return JSON.stringify(input).slice(0, 120);
  }, [input]);

  return (
    <Box
      sx={{
        border: `1px solid ${afkColors.borderSubtle}`,
        borderRadius: 1,
        overflow: 'hidden',
        minWidth: 0,
        my: 0.5,
      }}
    >
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.75,
          cursor: 'pointer',
          bgcolor: 'rgba(255,255,255,0.02)',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <ToolIcon sx={{ fontSize: 14, color: afkColors.textTertiary }} />
        <Chip
          label={toolName}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.7rem',
            fontFamily: '"JetBrains Mono", monospace',
            bgcolor: afkColors.accentMuted,
            color: afkColors.accent,
          }}
        />
        {inputSummary && (
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: afkColors.textSecondary,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.7rem',
              flex: 1,
              minWidth: 0,
            }}
          >
            {inputSummary}
          </Typography>
        )}
        {result !== undefined &&
          (isError ? (
            <ErrorIcon sx={{ fontSize: 14, color: afkColors.danger }} />
          ) : (
            <SuccessIcon sx={{ fontSize: 14, color: afkColors.accent }} />
          ))}
        <IconButton size="small" sx={{ p: 0, color: afkColors.textTertiary }}>
          {expanded ? (
            <CollapseIcon fontSize="small" />
          ) : (
            <ExpandIcon fontSize="small" />
          )}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ px: 1.5, pb: 1.5 }}>
          {input && (
            <Box sx={{ mb: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: afkColors.textTertiary,
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Input
              </Typography>
              <Box
                component="pre"
                sx={{
                  mt: 0.5,
                  p: 1,
                  bgcolor: afkColors.background,
                  borderRadius: 0.5,
                  overflow: 'auto',
                  maxHeight: 200,
                  fontSize: '0.7rem',
                  fontFamily: '"JetBrains Mono", monospace',
                  color: afkColors.textSecondary,
                  m: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {typeof input === 'string'
                  ? input
                  : JSON.stringify(input, null, 2)}
              </Box>
            </Box>
          )}
          {result !== undefined && (
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: afkColors.textTertiary,
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Result
              </Typography>
              <Box
                component="pre"
                sx={{
                  mt: 0.5,
                  p: 1,
                  bgcolor: afkColors.background,
                  borderRadius: 0.5,
                  overflow: 'auto',
                  maxHeight: 200,
                  fontSize: '0.7rem',
                  fontFamily: '"JetBrains Mono", monospace',
                  color: isError ? afkColors.danger : afkColors.textSecondary,
                  m: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {typeof result === 'string'
                  ? result
                  : JSON.stringify(result, null, 2)}
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};
