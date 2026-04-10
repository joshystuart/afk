import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { afkColors } from '../themes/afk';
import { useUpdateState } from '../hooks/useUpdateState';

class UpdateOverlayErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('UpdateOverlay crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const UpdateOverlayInner: React.FC = () => {
  const state = useUpdateState();

  if (state.status !== 'restarting') {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        bgcolor: afkColors.background,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        WebkitAppRegion: 'drag',
        userSelect: 'none',
      }}
    >
      <Typography
        sx={{
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 700,
          fontSize: '2.5rem',
          letterSpacing: '0.3em',
          color: afkColors.textPrimary,
          mb: 6,
        }}
      >
        AFK
      </Typography>

      <CircularProgress
        size={24}
        thickness={4}
        sx={{ color: afkColors.accent, mb: 3 }}
      />

      <Typography
        variant="body1"
        sx={{
          color: afkColors.textPrimary,
          fontWeight: 500,
          mb: 1,
        }}
      >
        Installing update{state.version ? ` v${state.version}` : ''}...
      </Typography>

      <Typography variant="body2" sx={{ color: afkColors.textTertiary }}>
        Please do not close the application.
      </Typography>
    </Box>
  );
};

const UpdateOverlay: React.FC = () => (
  <UpdateOverlayErrorBoundary>
    <UpdateOverlayInner />
  </UpdateOverlayErrorBoundary>
);

export { UpdateOverlay };
