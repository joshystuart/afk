import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  LinearProgress,
  Stack,
} from '@mui/material';
import {
  Terminal as TerminalIcon,
  CloudQueue as CloudIcon,
} from '@mui/icons-material';

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
        bgcolor: '#1a1a1a',
        color: 'white',
        textAlign: 'center',
        p: 4,
      }}
    >
      <Stack spacing={3} alignItems="center" sx={{ maxWidth: 400 }}>
        {isError ? (
          <CloudIcon sx={{ fontSize: 80, color: 'error.main', opacity: 0.7 }} />
        ) : (
          <TerminalIcon
            sx={{ fontSize: 80, color: 'primary.main', opacity: 0.7 }}
          />
        )}

        <Typography
          variant="h5"
          sx={{ fontFamily: 'monospace', fontWeight: 600 }}
        >
          {title}
        </Typography>

        <Typography
          variant="body1"
          sx={{ color: 'text.secondary', textAlign: 'center' }}
        >
          {message}
        </Typography>

        {!isError && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress
              sx={{
                height: 4,
                backgroundColor: 'rgba(255,255,255,0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'primary.main',
                },
              }}
            />
          </Box>
        )}

        {!isError && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress
              size={16}
              thickness={6}
              sx={{ color: 'primary.main' }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Starting container and terminal sessions...
            </Typography>
          </Stack>
        )}

        {isError && onRetry && (
          <button
            onClick={onRetry}
            style={{
              background: 'transparent',
              border: '1px solid #555',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            Retry
          </button>
        )}
      </Stack>
    </Box>
  );
};

export default TerminalLoading;
