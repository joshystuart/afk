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
  useMediaQuery,
  Tabs,
  Tab,
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
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
import ApprovalModal from '../components/ApprovalModal';

const SessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { subscribeToSession, unsubscribeFromSession } = useWebSocket();
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [fullscreenTerminal, setFullscreenTerminal] = React.useState<
    'claude' | 'manual' | null
  >(null);
  const [activeTab, setActiveTab] = React.useState(0);

  const {
    isLoading,
    startSession,
    stopSession,
    restartSession,
    deleteSession,
    getSession,
    isStarting,
    isStopping,
    isRestarting,
    isDeleting,
  } = useSession();

  // Approval modal state
  const [approvalModal, setApprovalModal] = React.useState<{
    open: boolean;
    type: 'stop' | 'delete';
    sessionId: string;
    sessionName?: string;
  }>({
    open: false,
    type: 'stop',
    sessionId: '',
    sessionName: '',
  });

  // Get session data
  const sessionQuery = id ? getSession(id) : null;
  const session = sessionQuery?.data;

  // Health check for terminals
  const shouldCheckHealth =
    session?.status === SessionStatus.RUNNING && !!session?.terminalUrls;
  const healthCheck = useSessionHealth(id || null, shouldCheckHealth);

  // Modal handlers
  const handleStopSessionClick = () => {
    if (!session) return;
    setApprovalModal({
      open: true,
      type: 'stop',
      sessionId: session.id,
      sessionName: session.name || session.id.slice(0, 12),
    });
  };

  const handleDeleteSessionClick = () => {
    if (!session) return;
    setApprovalModal({
      open: true,
      type: 'delete',
      sessionId: session.id,
      sessionName: session.name || session.id.slice(0, 12),
    });
  };

  const handleModalClose = () => {
    setApprovalModal(prev => ({ ...prev, open: false }));
  };

  const handleModalConfirm = async () => {
    if (!session) return;
    
    try {
      if (approvalModal.type === 'stop') {
        await stopSession(session.id);
      } else {
        await deleteSession(session.id);
        navigate(ROUTES.DASHBOARD);
      }
      handleModalClose();
    } catch (error) {
      console.error(`Failed to ${approvalModal.type} session:`, error);
      // Keep modal open on error so user can try again
    }
  };

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
            <TerminalIcon
              sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }}
            />
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
  const canDelete =
    session &&
    (session.status === SessionStatus.STOPPED ||
      session.status === SessionStatus.ERROR);

  // If session is not running, show the start interface
  if (
    !session ||
    session.status !== SessionStatus.RUNNING ||
    !session.terminalUrls
  ) {
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
            {session?.name || session?.id.slice(0, 12)}
          </Typography>
        </Breadcrumbs>

        {/* Session Status Card */}
        <MainCard
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TerminalIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h3" sx={{ fontFamily: 'monospace' }}>
                {session?.name || session?.id.slice(0, 12)}
              </Typography>
            </Box>
          }
          secondary={
            <Chip
              label={session?.status}
              sx={{
                bgcolor:
                  session?.status === SessionStatus.ERROR
                    ? 'error.main'
                    : 'grey.500',
                color: 'white',
                fontWeight: 600,
              }}
            />
          }
        >
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <TerminalIcon
              sx={{ fontSize: 120, color: 'text.secondary', mb: 3 }}
            />
            <Typography variant="h4" sx={{ mb: 2 }}>
              Session {session?.status.toLowerCase()}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}
            >
              {canStart
                ? 'Your development environment is ready. Click the button below to start the session and access your terminals.'
                : session?.status === SessionStatus.ERROR
                  ? 'Session encountered an error. You can delete this session and create a new one.'
                  : 'Session is not ready yet. Please wait or try refreshing.'}
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              {canStart && (
                <AnimateButton>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PlayIcon />}
                    onClick={() => startSession(session!.id)}
                    disabled={isStarting}
                    color="success"
                    sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                  >
                    {isStarting ? 'Starting Session...' : 'Start Session'}
                  </Button>
                </AnimateButton>
              )}

              {canDelete && (
                <AnimateButton>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteSessionClick}
                    disabled={isDeleting}
                    color="error"
                    sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                  >
                    {isDeleting ? 'Deleting Session...' : 'Delete Session'}
                  </Button>
                </AnimateButton>
              )}
            </Stack>
          </Box>
        </MainCard>
      </Box>
    );
  }

  // Main terminal interface (full-width layout)
  return (
    <>
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        {/* Header Bar */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderBottom: `1px solid ${theme.palette.divider}`,
            px: isMobile ? 2 : 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 72,
            zIndex: 1,
          }}
        >
          {/* Left: Navigation & Session Info */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 1 : 3,
              flex: 1,
              minWidth: 0,
            }}
          >
            <AnimateButton>
              <Button
                component={Link}
                to={ROUTES.DASHBOARD}
                startIcon={<ArrowBackIcon />}
                variant="text"
                sx={{ color: 'text.secondary' }}
                size={isMobile ? 'small' : 'medium'}
              >
                {isMobile ? '' : 'Dashboard'}
              </Button>
            </AnimateButton>

            {!isMobile && <Divider orientation="vertical" flexItem />}

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flex: 1,
                minWidth: 0,
              }}
            >
              <TerminalIcon
                sx={{ color: 'primary.main', fontSize: isMobile ? 24 : 28 }}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant={isMobile ? 'h6' : 'h5'}
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {session.name || session.id.slice(0, 12)}
                </Typography>
                {session.repoUrl && !isMobile && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontFamily: 'monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                    }}
                  >
                    {session.repoUrl.split('/').pop()?.replace('.git', '')}
                  </Typography>
                )}
              </Box>
            </Box>

            <Chip
              label="RUNNING"
              size={isMobile ? 'small' : 'medium'}
              sx={{
                bgcolor: 'success.main',
                color: 'white',
                fontWeight: 600,
                animation: 'pulse 2s infinite',
                flexShrink: 0,
              }}
            />
          </Box>

          {/* Right: Actions */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            {!isMobile ? (
              <AnimateButton>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<StopIcon />}
                  onClick={handleStopSessionClick}
                  disabled={isStopping}
                  color="warning"
                >
                  {isStopping ? 'Stopping...' : 'Stop'}
                </Button>
              </AnimateButton>
            ) : (
              <AnimateButton>
                <IconButton
                  size="small"
                  onClick={handleStopSessionClick}
                  disabled={isStopping}
                  title={isStopping ? 'Stopping...' : 'Stop Session'}
                  color="warning"
                >
                  <StopIcon />
                </IconButton>
              </AnimateButton>
            )}

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

        {/* Terminal Access Bar - Hide on mobile when tabs are available */}
        {!(session.terminalMode === 'DUAL' && isMobile) && (
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderBottom: `1px solid ${theme.palette.divider}`,
              px: isMobile ? 2 : 3,
              py: 2,
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <AnimateButton>
              <Button
                variant="contained"
                size={isMobile ? 'small' : 'medium'}
                startIcon={<TerminalIcon />}
                href={session.terminalUrls.claude}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ fontWeight: 600 }}
              >
                {isMobile ? 'Claude' : 'Open Claude Terminal'}
              </Button>
            </AnimateButton>

            {session.terminalMode === 'DUAL' && (
              <AnimateButton>
                <Button
                  variant="outlined"
                  size={isMobile ? 'small' : 'medium'}
                  startIcon={<TerminalIcon />}
                  href={session.terminalUrls.manual}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {isMobile ? 'Manual' : 'Open Manual Terminal'}
                </Button>
              </AnimateButton>
            )}
          </Box>
        )}

        {/* Terminal Panels */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {session.terminalMode === 'DUAL' && isMobile ? (
            /* Mobile Tabbed Terminals */
            <>
              {/* Tab Navigation */}
              <Box
                sx={{
                  bgcolor: 'background.paper',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Tabs
                  value={activeTab}
                  onChange={(_, newValue) => setActiveTab(newValue)}
                  variant="fullWidth"
                  sx={{ minHeight: 48 }}
                >
                  <Tab
                    label={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <TerminalIcon fontSize="small" />
                        Claude
                      </Box>
                    }
                    sx={{ minHeight: 48 }}
                  />
                  <Tab
                    label={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <TerminalIcon fontSize="small" />
                        Manual
                      </Box>
                    }
                    sx={{ minHeight: 48 }}
                  />
                </Tabs>
              </Box>

              {/* Tab Content */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {activeTab === 0 ? (
                  /* Claude Terminal Tab */
                  <SubCard
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 0,
                      height: '100%',
                    }}
                    title={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                        }}
                      >
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <TerminalIcon
                            fontSize="small"
                            sx={{ color: 'primary.main' }}
                          />
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600 }}
                          >
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
                          bgcolor: '#1e293b',
                          width: '100%',
                        }}
                        title="Claude Terminal"
                      />
                    ) : (
                      <TerminalLoading
                        title="Claude Terminal"
                        message={
                          healthCheck.isLoading
                            ? 'Starting Claude terminal...'
                            : 'Waiting for container...'
                        }
                        isError={!!healthCheck.error}
                        onRetry={
                          healthCheck.error ? healthCheck.refetch : undefined
                        }
                      />
                    )}
                  </SubCard>
                ) : (
                  /* Manual Terminal Tab */
                  <SubCard
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 0,
                      height: '100%',
                    }}
                    title={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                        }}
                      >
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <TerminalIcon
                            fontSize="small"
                            sx={{ color: 'grey.500' }}
                          />
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600 }}
                          >
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
                          bgcolor: '#1e293b',
                          width: '100%',
                        }}
                        title="Manual Terminal"
                      />
                    ) : (
                      <TerminalLoading
                        title="Manual Terminal"
                        message={
                          healthCheck.isLoading
                            ? 'Starting manual terminal...'
                            : 'Waiting for container...'
                        }
                        isError={!!healthCheck.error}
                        onRetry={
                          healthCheck.error ? healthCheck.refetch : undefined
                        }
                      />
                    )}
                  </SubCard>
                )}
              </Box>
            </>
          ) : session.terminalMode === 'DUAL' ? (
            /* Desktop Side-by-Side Terminals */
            <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
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
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TerminalIcon
                        fontSize="small"
                        sx={{ color: 'primary.main' }}
                      />
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
                      bgcolor: '#1e293b',
                      width: '100%',
                    }}
                    title="Claude Terminal"
                  />
                ) : (
                  <TerminalLoading
                    title="Claude Terminal"
                    message={
                      healthCheck.isLoading
                        ? 'Starting Claude terminal...'
                        : 'Waiting for container...'
                    }
                    isError={!!healthCheck.error}
                    onRetry={
                      healthCheck.error ? healthCheck.refetch : undefined
                    }
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
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TerminalIcon
                        fontSize="small"
                        sx={{ color: 'grey.500' }}
                      />
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
                      bgcolor: '#1e293b',
                      width: '100%',
                    }}
                    title="Manual Terminal"
                  />
                ) : (
                  <TerminalLoading
                    title="Manual Terminal"
                    message={
                      healthCheck.isLoading
                        ? 'Starting manual terminal...'
                        : 'Waiting for container...'
                    }
                    isError={!!healthCheck.error}
                    onRetry={
                      healthCheck.error ? healthCheck.refetch : undefined
                    }
                  />
                )}
              </SubCard>
            </Box>
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
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TerminalIcon
                      fontSize="small"
                      sx={{ color: 'primary.main' }}
                    />
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
                  message={
                    healthCheck.isLoading
                      ? 'Starting Claude terminal...'
                      : 'Waiting for container...'
                  }
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
            bgcolor: '#1e293b',
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
            <Typography
              sx={{
                color: 'white',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <TerminalIcon fontSize="small" />
              {fullscreenTerminal === 'claude'
                ? 'Claude Terminal'
                : 'Manual Terminal'}{' '}
              - {session.name || session.id.slice(0, 12)}
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
            src={
              fullscreenTerminal === 'claude'
                ? session.terminalUrls.claude
                : session.terminalUrls.manual
            }
            sx={{
              width: '100%',
              flex: 1,
              border: 'none',
              bgcolor: '#1e293b',
            }}
            title={`${fullscreenTerminal === 'claude' ? 'Claude' : 'Manual'} Terminal Fullscreen`}
          />
        </Box>
      )}

      {/* Approval Modal */}
      <ApprovalModal
        open={approvalModal.open}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        type={approvalModal.type}
        sessionName={approvalModal.sessionName}
        isLoading={approvalModal.type === 'stop' ? isStopping : isDeleting}
      />
    </>
  );
};

export default SessionDetails;
