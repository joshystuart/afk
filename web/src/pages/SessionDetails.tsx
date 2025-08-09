import React from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Skeleton,
  Typography,
  useTheme,
  Breadcrumbs,
  Stack,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  RestartAlt as RestartIcon,
  Terminal as TerminalIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { Link, useParams } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSessionHealth } from '../hooks/useSessionHealth';
import { SessionStatus } from '../api/types';
import { ROUTES } from '../utils/constants';

// Berry Components
import MainCard from '../components/ui-component/cards/MainCard';
import SubCard from '../components/ui-component/cards/SubCard';
import AnimateButton from '../components/ui-component/extended/AnimateButton';
import TerminalLoading from '../components/TerminalLoading';

const SessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const { subscribeToSession, unsubscribeFromSession } = useWebSocket();
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [fullscreenTerminal, setFullscreenTerminal] = React.useState<'claude' | 'manual' | null>(null);
  
  const {
    isLoading,
    startSession,
    stopSession,
    restartSession,
    getSession,
    isStarting,
    isStopping,
    isRestarting,
  } = useSession();

  // Get session data
  const sessionQuery = id ? getSession(id) : null;
  const session = sessionQuery?.data;
  
  // Health check for terminals
  const shouldCheckHealth = session?.status === SessionStatus.RUNNING && session.terminalUrls;
  const healthCheck = useSessionHealth(id || null, shouldCheckHealth);

  React.useEffect(() => {
    if (id) {
      subscribeToSession(id);
    }
    return () => {
      if (id) {
        unsubscribeFromSession(id);
      }
    };
  }, [id, subscribeToSession, unsubscribeFromSession]);

  if (isLoading || sessionQuery?.isLoading) {
    return (
      <Box sx={{ p: 3, width: '100%' }}>
        <MainCard>
          <Stack spacing={3}>
            <Skeleton variant="rectangular" height={40} />
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="rectangular" height={400} />
          </Stack>
        </MainCard>
      </Box>
    );
  }

  if (!sessionQuery?.data && !sessionQuery?.isLoading) {
    return (
      <Box sx={{ p: 3, width: '100%' }}>
        <MainCard>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <TerminalIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h4" sx={{ mb: 2 }}>
              Session not found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              The session you're looking for doesn't exist or has been removed.
            </Typography>
            <AnimateButton>
              <Button
                component={Link}
                to={ROUTES.DASHBOARD}
                variant="contained"
                startIcon={<ArrowBackIcon />}
              >
                Back to Dashboard
              </Button>
            </AnimateButton>
          </Box>
        </MainCard>
      </Box>
    );
  }

  if (!sessionQuery?.data) {
    return (
      <Box sx={{ p: 3, width: '100%' }}>
        <MainCard>
          <Stack spacing={3}>
            <Skeleton variant="rectangular" height={40} />
            <Skeleton variant="rectangular" height={400} />
          </Stack>
        </MainCard>
      </Box>
    );
  }

  const canStart = session && session.status === SessionStatus.STOPPED;

  // If session is not running, show the start interface
  if (!session || session.status !== SessionStatus.RUNNING || !session.terminalUrls) {
    return (
      <Box sx={{ p: 3, width: '100%' }}>
        {/* Breadcrumbs */}
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          sx={{ mb: 3 }}
        >
          <Button
            component={Link}
            to={ROUTES.DASHBOARD}
            startIcon={<ArrowBackIcon />}
            variant="text"
            color="inherit"
            size="small"
          >
            Dashboard
          </Button>
          <Typography color="text.primary" sx={{ fontFamily: 'monospace' }}>
            {session.name || session.id.slice(0, 12)}
          </Typography>
        </Breadcrumbs>

        {/* Session Status Card */}
        <MainCard
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TerminalIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h3" sx={{ fontFamily: 'monospace' }}>
                {session.name || session.id.slice(0, 12)}
              </Typography>
            </Box>
          }
          secondary={
            <Chip
              label={session.status}
              sx={{
                bgcolor: session.status === SessionStatus.ERROR ? 'error.main' : 'grey.500',
                color: 'white',
                fontWeight: 600,
              }}
            />
          }
        >
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <TerminalIcon sx={{ fontSize: 120, color: 'text.secondary', mb: 3 }} />
            <Typography variant="h4" sx={{ mb: 2 }}>
              Session {session.status.toLowerCase()}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              {canStart 
                ? 'Your development environment is ready. Click the button below to start the session and access your terminals.'
                : 'Session is not ready yet. Please wait or try refreshing.'
              }
            </Typography>
            
            {canStart && (
              <AnimateButton>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayIcon />}
                  onClick={() => startSession(session.id)}
                  disabled={isStarting}
                  color="success"
                  sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                >
                  {isStarting ? 'Starting Session...' : 'Start Session'}
                </Button>
              </AnimateButton>
            )}
          </Box>
        </MainCard>
      </Box>
    );
  }

  // Main terminal interface (full-width layout)
  return (
    <>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        {/* Header Bar */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderBottom: `1px solid ${theme.palette.divider}`,
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 72,
            zIndex: 1,
          }}
        >
          {/* Left: Navigation & Session Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <AnimateButton>
              <Button
                component={Link}
                to={ROUTES.DASHBOARD}
                startIcon={<ArrowBackIcon />}
                variant="text"
                sx={{ color: 'text.secondary' }}
              >
                Dashboard
              </Button>
            </AnimateButton>
            
            <Divider orientation="vertical" flexItem />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TerminalIcon sx={{ color: 'primary.main', fontSize: 28 }} />
              <Box>
                <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {session.name || session.id.slice(0, 12)}
                </Typography>
                {session.repoUrl && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    {session.repoUrl.split('/').pop()?.replace('.git', '')}
                  </Typography>
                )}
              </Box>
            </Box>

            <Chip
              label="RUNNING"
              sx={{
                bgcolor: 'success.main',
                color: 'white',
                fontWeight: 600,
                animation: 'pulse 2s infinite',
              }}
            />
          </Box>

          {/* Right: Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AnimateButton>
              <Button
                variant="outlined"
                size="small"
                startIcon={<StopIcon />}
                onClick={() => stopSession(session.id)}
                disabled={isStopping}
                color="warning"
              >
                {isStopping ? 'Stopping...' : 'Stop'}
              </Button>
            </AnimateButton>
            
            <AnimateButton>
              <IconButton
                size="small"
                onClick={() => restartSession(session.id)}
                disabled={isRestarting}
                title="Restart Session"
              >
                <RestartIcon />
              </IconButton>
            </AnimateButton>

            <AnimateButton>
              <IconButton
                size="small"
                onClick={() => sessionQuery?.refetch()}
                title="Refresh"
              >
                <RefreshIcon />
              </IconButton>
            </AnimateButton>
          </Box>
        </Box>

        {/* Terminal Access Bar */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderBottom: `1px solid ${theme.palette.divider}`,
            px: 3,
            py: 2,
            display: 'flex',
            gap: 2,
          }}
        >
          <AnimateButton>
            <Button
              variant="contained"
              startIcon={<TerminalIcon />}
              href={session.terminalUrls.claude}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ fontWeight: 600 }}
            >
              Open Claude Terminal
            </Button>
          </AnimateButton>
          
          {session.terminalMode === 'DUAL' && (
            <AnimateButton>
              <Button
                variant="outlined"
                startIcon={<TerminalIcon />}
                href={session.terminalUrls.manual}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Manual Terminal
              </Button>
            </AnimateButton>
          )}
        </Box>

        {/* Terminal Panels */}
        <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {session.terminalMode === 'DUAL' ? (
            <>
              {/* Claude Terminal */}
              <SubCard
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 0,
                  borderRight: `1px solid ${theme.palette.divider}`,
                  height: '100%',
                }}
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TerminalIcon fontSize="small" sx={{ color: 'primary.main' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Claude Terminal
                      </Typography>
                    </Box>
                    <AnimateButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setIsFullscreen(true);
                          setFullscreenTerminal('claude');
                        }}
                      >
                        <FullscreenIcon fontSize="small" />
                      </IconButton>
                    </AnimateButton>
                  </Box>
                }
                content={false}
              >
                {healthCheck.claudeTerminalReady ? (
                  <Box
                    component="iframe"
                    src={session.terminalUrls.claude}
                    sx={{
                      flex: 1,
                      border: 'none',
                      bgcolor: '#000',
                      width: '100%',
                    }}
                    title="Claude Terminal"
                  />
                ) : (
                  <TerminalLoading
                    title="Claude Terminal"
                    message={healthCheck.isLoading ? "Starting Claude terminal..." : "Waiting for container..."}
                    isError={!!healthCheck.error}
                    onRetry={healthCheck.error ? healthCheck.refetch : undefined}
                  />
                )}
              </SubCard>

              {/* Manual Terminal */}
              <SubCard
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 0,
                  height: '100%',
                }}
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TerminalIcon fontSize="small" sx={{ color: 'grey.500' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Manual Terminal
                      </Typography>
                    </Box>
                    <AnimateButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setIsFullscreen(true);
                          setFullscreenTerminal('manual');
                        }}
                      >
                        <FullscreenIcon fontSize="small" />
                      </IconButton>
                    </AnimateButton>
                  </Box>
                }
                content={false}
              >
                {healthCheck.manualTerminalReady ? (
                  <Box
                    component="iframe"
                    src={session.terminalUrls.manual}
                    sx={{
                      flex: 1,
                      border: 'none',
                      bgcolor: '#000',
                      width: '100%',
                    }}
                    title="Manual Terminal"
                  />
                ) : (
                  <TerminalLoading
                    title="Manual Terminal"
                    message={healthCheck.isLoading ? "Starting manual terminal..." : "Waiting for container..."}
                    isError={!!healthCheck.error}
                    onRetry={healthCheck.error ? healthCheck.refetch : undefined}
                  />
                )}
              </SubCard>
            </>
          ) : (
            /* Single Terminal */
            <SubCard
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 0,
                height: '100%',
              }}
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TerminalIcon fontSize="small" sx={{ color: 'primary.main' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Claude Terminal
                    </Typography>
                  </Box>
                  <AnimateButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setIsFullscreen(true);
                        setFullscreenTerminal('claude');
                      }}
                    >
                      <FullscreenIcon fontSize="small" />
                    </IconButton>
                  </AnimateButton>
                </Box>
              }
              content={false}
            >
              {healthCheck.claudeTerminalReady ? (
                <Box
                  component="iframe"
                  src={session.terminalUrls.claude}
                  sx={{
                    flex: 1,
                    border: 'none',
                    bgcolor: '#000',
                    width: '100%',
                  }}
                  title="Claude Terminal"
                />
              ) : (
                <TerminalLoading
                  title="Claude Terminal"
                  message={healthCheck.isLoading ? "Starting Claude terminal..." : "Waiting for container..."}
                  isError={!!healthCheck.error}
                  onRetry={healthCheck.error ? healthCheck.refetch : undefined}
                />
              )}
            </SubCard>
          )}
        </Box>
      </Box>

      {/* Fullscreen Terminal Modal */}
      {isFullscreen && fullscreenTerminal && session.terminalUrls && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            bgcolor: '#000',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Fullscreen Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1,
              bgcolor: 'rgba(0, 0, 0, 0.8)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Typography sx={{ color: 'white', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 1 }}>
              <TerminalIcon fontSize="small" />
              {fullscreenTerminal === 'claude' ? 'Claude Terminal' : 'Manual Terminal'} - {session.name || session.id.slice(0, 12)}
            </Typography>
            <AnimateButton>
              <IconButton
                onClick={() => {
                  setIsFullscreen(false);
                  setFullscreenTerminal(null);
                }}
                sx={{ color: 'white' }}
              >
                <FullscreenExitIcon />
              </IconButton>
            </AnimateButton>
          </Box>

          {/* Fullscreen Terminal */}
          <Box
            component="iframe"
            src={fullscreenTerminal === 'claude' ? session.terminalUrls.claude : session.terminalUrls.manual}
            sx={{
              width: '100%',
              flex: 1,
              border: 'none',
              bgcolor: '#000',
            }}
            title={`${fullscreenTerminal === 'claude' ? 'Claude' : 'Manual'} Terminal Fullscreen`}
          />
        </Box>
      )}
    </>
  );
};

export default SessionDetails;