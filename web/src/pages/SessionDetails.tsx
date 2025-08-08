import React from 'react';
import {
    Box,
    Button,
    Chip,
    IconButton,
    Skeleton,
    Typography,
    Container,
    Grid,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    PlayArrow as PlayIcon,
    Refresh as RefreshIcon,
    RestartAlt as RestartIcon,
    Terminal as TerminalIcon,
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import {Link, useParams} from 'react-router-dom';
import {useSession} from '../hooks/useSession';
import {useWebSocket} from '../hooks/useWebSocket';
import {SessionStatus} from '../api/types';
import {ROUTES} from '../utils/constants';

const SessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
      <Box sx={{ 
        height: '100vh', 
        backgroundColor: '#1e1e1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Skeleton variant="text" width={300} height={40} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
      </Box>
    );
  }

  if (!sessionQuery?.data && !sessionQuery?.isLoading) {
    return (
      <Box sx={{ 
        height: '100vh', 
        backgroundColor: '#1e1e1e',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2
      }}>
        <Typography variant="h5">Session not found</Typography>
        <Button
          component={Link}
          to={ROUTES.DASHBOARD}
          variant="contained"
          sx={{ backgroundColor: '#3b82f6' }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  if (!sessionQuery?.data) {
    return (
      <Box sx={{ 
        height: '100vh', 
        backgroundColor: '#1e1e1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Skeleton variant="text" width={300} height={40} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
      </Box>
    );
  }

  const session = sessionQuery.data;
  const canStart = session.status === SessionStatus.STOPPED;

  // If session is not running, show the start interface
  if (session.status !== SessionStatus.RUNNING || !session.terminalUrls) {
    return (
      <Grid container direction="column" sx={{ 
        height: '100vh', 
        backgroundColor: '#1e1e1e'
      }}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{
            backgroundColor: '#2d2d2d',
            borderBottom: '1px solid #404040',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              component={Link}
              to={ROUTES.DASHBOARD}
              startIcon={<ArrowBackIcon />}
              sx={{ color: '#a1a1aa', textTransform: 'none' }}
            >
              Dashboard
            </Button>
            <Typography variant="h6" sx={{ color: 'white', fontFamily: 'monospace' }}>
              {session.name || session.id.slice(0, 12)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={session.status}
              sx={{
                backgroundColor: session.status === SessionStatus.ERROR ? '#ef4444' : '#6b7280',
                color: 'white',
                textTransform: 'uppercase',
                fontSize: '0.75rem'
              }}
            />
          </Box>
          </Box>
        </Grid>

        {/* Main Content */}
        <Grid item xs sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Container maxWidth="sm">
            <Grid container direction="column" alignItems="center" spacing={4} sx={{ color: 'white' }}>
              <Grid item>
                <TerminalIcon sx={{ fontSize: 80, color: '#404040' }} />
              </Grid>
              <Grid item>
                <Typography variant="h4" sx={{ textAlign: 'center' }}>
                  Session {session.status.toLowerCase()}
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant="body1" sx={{ color: '#a1a1aa', textAlign: 'center' }}>
                  {canStart ? 'Start the session to access terminals' : 'Session is not ready'}
                </Typography>
              </Grid>
              
              {canStart && (
                <Grid item>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PlayIcon />}
                    onClick={() => startSession(session.id)}
                    disabled={isStarting}
                    sx={{
                      backgroundColor: '#10b981',
                      '&:hover': { backgroundColor: '#059669' },
                      textTransform: 'none',
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem'
                    }}
                  >
                    {isStarting ? 'Starting Session...' : 'Start Session'}
                  </Button>
                </Grid>
              )}
            </Grid>
          </Container>
        </Grid>
      </Grid>
    );
  }

  // Main terminal interface (like dash.png)
  return (
    <>
      <Grid container direction="column" sx={{
        height: '100vh', 
        backgroundColor: '#1e1e1e',
        overflow: 'hidden'
      }}>
        {/* Top Header Bar */}
        <Grid item xs={12}>
          <Box sx={{
            backgroundColor: '#2d2d2d',
            borderBottom: '1px solid #404040',
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 60
          }}>
          {/* Left side - Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              component={Link}
              to={ROUTES.DASHBOARD}
              startIcon={<ArrowBackIcon />}
              sx={{ 
                color: '#a1a1aa',
                textTransform: 'none',
                '&:hover': { color: 'white' }
              }}
            >
              Dashboard
            </Button>
            <Typography variant="h6" sx={{ color: 'white', fontFamily: 'monospace' }}>
              {session.name || session.id.slice(0, 12)}
            </Typography>
            <Chip
              label="RUNNING"
              sx={{
                backgroundColor: '#10b981',
                color: 'white',
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                height: 24,
                animation: 'pulse 2s infinite'
              }}
            />
            <Typography variant="body2" sx={{ color: '#a1a1aa', fontFamily: 'monospace' }}>
              {session.repoUrl ? session.repoUrl.split('/').pop()?.replace('.git', '') : ''}
            </Typography>
          </Box>

          {/* Right side - Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => stopSession(session.id)}
              disabled={isStopping}
              sx={{
                backgroundColor: '#f59e0b',
                '&:hover': { backgroundColor: '#d97706' },
                textTransform: 'none',
                minWidth: 80
              }}
            >
              {isStopping ? 'Stopping...' : 'Stop'}
            </Button>
            
            <IconButton
              size="small"
              onClick={() => restartSession(session.id)}
              disabled={isRestarting}
              sx={{ color: '#a1a1aa' }}
              title="Restart"
            >
              <RestartIcon />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => sessionQuery?.refetch()}
              sx={{ color: '#a1a1aa' }}
              title="Refresh"
            >
              <RefreshIcon />
            </IconButton>
          </Box>
          </Box>
        </Grid>

        {/* Terminal Access Buttons */}
        <Grid item xs={12}>
          <Box sx={{
            backgroundColor: '#2d2d2d',
            borderBottom: '1px solid #404040',
            px: 3,
            py: 2,
            display: 'flex',
            gap: 2
          }}>
          <Button
            variant="contained"
            startIcon={<TerminalIcon />}
            href={session.terminalUrls.claude}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Open Claude Terminal
          </Button>
          {session.terminalMode === 'DUAL' && (
            <Button
              variant="outlined"
              startIcon={<TerminalIcon />}
              href={session.terminalUrls.manual}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                borderColor: '#6b7280',
                color: '#a1a1aa',
                '&:hover': { 
                  borderColor: '#9ca3af',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)'
                },
                textTransform: 'none'
              }}
            >
              Open Manual Terminal
            </Button>
          )}
          </Box>
        </Grid>

        {/* Terminal Panels */}
        <Grid item xs sx={{ minHeight: 0 }}>
          <Grid container sx={{ height: '100%' }}>
            {session.terminalMode === 'DUAL' ? (
              <>
                {/* Claude Terminal */}
                <Grid item xs={12} md={6} sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRight: { md: '1px solid #404040' },
                  borderBottom: { xs: '1px solid #404040', md: 'none' },
                  height: { xs: '50vh', md: '100%' }
                }}>
                <Box sx={{
                  backgroundColor: '#2d2d2d',
                  p: 2,
                  borderBottom: '1px solid #404040',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TerminalIcon fontSize="small" sx={{ color: '#3b82f6' }} />
                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                      Claude Terminal
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setIsFullscreen(true);
                      setFullscreenTerminal('claude');
                    }}
                    sx={{ color: '#a1a1aa' }}
                  >
                    <FullscreenIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box
                  component="iframe"
                  src={session.terminalUrls.claude}
                  sx={{
                    flex: 1,
                    border: 'none',
                    backgroundColor: '#000'
                  }}
                  title="Claude Terminal"
                  />
                </Grid>

                {/* Manual Terminal */}
                <Grid item xs={12} md={6} sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: { xs: '50vh', md: '100%' }
                }}>
                <Box sx={{
                  backgroundColor: '#2d2d2d',
                  p: 2,
                  borderBottom: '1px solid #404040',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TerminalIcon fontSize="small" sx={{ color: '#6b7280' }} />
                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                      Manual Terminal
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setIsFullscreen(true);
                      setFullscreenTerminal('manual');
                    }}
                    sx={{ color: '#a1a1aa' }}
                  >
                    <FullscreenIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box
                  component="iframe"
                  src={session.terminalUrls.manual}
                  sx={{
                    flex: 1,
                    border: 'none',
                    backgroundColor: '#000'
                  }}
                  title="Manual Terminal"
                  />
                </Grid>
              </>
            ) : (
              /* Single Terminal */
              <Grid item xs={12} sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%'
              }}>
              <Box sx={{
                backgroundColor: '#2d2d2d',
                p: 2,
                borderBottom: '1px solid #404040',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TerminalIcon fontSize="small" sx={{ color: '#3b82f6' }} />
                  <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
                    Claude Terminal
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => {
                    setIsFullscreen(true);
                    setFullscreenTerminal('claude');
                  }}
                  sx={{ color: '#a1a1aa' }}
                >
                  <FullscreenIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box
                component="iframe"
                src={session.terminalUrls.claude}
                sx={{
                  flex: 1,
                  border: 'none',
                  backgroundColor: '#000'
                }}
                title="Claude Terminal"
                />
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>

      {/* Fullscreen Terminal Modal */}
      {isFullscreen && fullscreenTerminal && session.terminalUrls && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Fullscreen Header */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Typography sx={{ 
              color: 'white', 
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <TerminalIcon fontSize="small" />
              {fullscreenTerminal === 'claude' ? 'Claude Terminal' : 'Manual Terminal'} - {session.name || session.id.slice(0, 12)}
            </Typography>
            <IconButton
              onClick={() => {
                setIsFullscreen(false);
                setFullscreenTerminal(null);
              }}
              sx={{ color: 'white' }}
            >
              <FullscreenExitIcon />
            </IconButton>
          </Box>

          {/* Fullscreen Terminal */}
          <Box
            component="iframe"
            src={fullscreenTerminal === 'claude' ? session.terminalUrls.claude : session.terminalUrls.manual}
            sx={{
              width: '100%',
              flex: 1,
              border: 'none',
              backgroundColor: '#000'
            }}
            title={`${fullscreenTerminal === 'claude' ? 'Claude' : 'Manual'} Terminal Fullscreen`}
          />
        </Box>
      )}
    </>
  );
};

export default SessionDetails;