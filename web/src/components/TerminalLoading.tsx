import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { afkColors } from '../themes/afk';
import { TerminalCursor } from './TerminalCursor';

interface TerminalLoadingProps {
  title: string;
  message?: string;
  isError?: boolean;
  onRetry?: () => void;
}

const TerminalLoading: React.FC<TerminalLoadingProps> = ({
  title,
  message = 'Loading terminal...',
  isError = false,
  onRetry,
}) => {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: afkColors.background,
        color: afkColors.textPrimary,
        textAlign: 'center',
        p: 4,
        gap: 2,
      }}
    >
      <Typography
        sx={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: afkColors.textSecondary,
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.75rem',
          color: isError ? afkColors.danger : afkColors.textTertiary,
        }}
      >
        {message}
        {!isError && (
          <Box component="span" sx={{ ml: 0.5 }}>
            <TerminalCursor size="sm" />
          </Box>
        )}
      </Typography>

      {!isError && (
        <Box sx={{ width: '100%', maxWidth: 200, mt: 1 }}>
          <LinearProgress
            sx={{
              height: 2,
              borderRadius: 1,
            }}
          />
        </Box>
      )}

      {isError && onRetry && (
        <Box
          component="button"
          onClick={onRetry}
          sx={{
            mt: 1,
            background: 'transparent',
            border: `1px solid ${afkColors.border}`,
            color: afkColors.textSecondary,
            padding: '6px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.75rem',
            transition: 'all 150ms ease',
            '&:hover': {
              borderColor: afkColors.textSecondary,
              color: afkColors.textPrimary,
            },
          }}
        >
          Retry
        </Box>
      )}
    </Box>
  );
};

export { TerminalLoading };
