import React from 'react';
import {
  Box,
  Badge,
  Button,
  Chip,
  IconButton,
  Skeleton,
  Snackbar,
  Alert,
  Typography,
  Tooltip,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Terminal as TerminalIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Delete as DeleteIcon,
  FiberManualRecord as DotIcon,
  CloudUpload as PushIcon,
} from '@mui/icons-material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSessionHealth } from '../hooks/useSessionHealth';
import { useGitStatus } from '../hooks/useGitStatus';
import { SessionStatus } from '../api/types';
import { ROUTES } from '../utils/constants';
import { afkColors } from '../themes/afk';
import TerminalLoading from '../components/TerminalLoading';
import ApprovalModal from '../components/ApprovalModal';
import CommitPushDialog from '../components/CommitPushDialog';

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
    deleteSession,
    getSession,
    isStarting,
    isStopping,
    isDeleting,
  } = useSession();

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

  const sessionQuery = id ? getSession(id) : null;
  const session = sessionQuery?.data;

  const shouldCheckHealth =
    session?.status === SessionStatus.RUNNING && !!session?.terminalUrls;
  const healthCheck = useSessionHealth(id || null, shouldCheckHealth);

  const isRunning = session?.status === SessionStatus.RUNNING;
  const gitStatus = useGitStatus(id || null, isRunning ?? false);

  const [commitDialogOpen, setCommitDialogOpen] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const handleCommitAndPush = async (message: string) => {
    const result = await gitStatus.commitAndPush(message);
    if (result && !result.success) {
      throw new Error(result.message);
    }
    setCommitDialogOpen(false);
    setSnackbar({
      open: true,
      message: 'Changes committed and pushed successfully',
      severity: 'success',
    });
  };

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
    setApprovalModal((prev) => ({ ...prev, open: false }));
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

  // Loading state
  if (isLoading || sessionQuery?.isLoading) {
    return (
      <Box
        sx={{
          height: isMobile ? 'calc(100vh - 48px)' : '100vh',
          display: 'flex',
          flexDirection: 'column',
          p: 3,
        }}
      >
        <Skeleton
          variant="rectangular"
          height={40}
          sx={{ mb: 2, borderRadius: '6px' }}
        />
        <Skeleton variant="rectangular" sx={{ flex: 1, borderRadius: '6px' }} />
      </Box>
    );
  }

  // Not found
  if (!sessionQuery?.data && !sessionQuery?.isLoading) {
    return (
      <Box
        sx={{
          height: isMobile ? 'calc(100vh - 48px)' : '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '1rem',
              color: afkColors.textSecondary,
              mb: 2,
            }}
          >
            Session not found
          </Typography>
          <Button
            component={Link}
            to={ROUTES.DASHBOARD}
            variant="outlined"
            size="small"
          >
            Back to Dashboard
          </Button>
        </Box>
      </Box>
    );
  }

  if (!sessionQuery?.data) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton
          variant="rectangular"
          height={400}
          sx={{ borderRadius: '6px' }}
        />
      </Box>
    );
  }

  const canStart = session && session.status === SessionStatus.STOPPED;
  const canDelete =
    session &&
    (session.status === SessionStatus.STOPPED ||
      session.status === SessionStatus.ERROR);

  // Session not running - show start interface
  if (
    !session ||
    session.status !== SessionStatus.RUNNING ||
    !session.terminalUrls
  ) {
    return (
      <>
        <Box
          sx={{
            height: isMobile ? 'calc(100vh - 48px)' : '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ textAlign: 'center', maxWidth: 400, px: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mb: 1,
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: afkColors.textPrimary,
                }}
              >
                {session?.name || session?.id.slice(0, 12)}
              </Typography>
              <DotIcon
                sx={{
                  fontSize: 8,
                  color:
                    session?.status === SessionStatus.ERROR
                      ? afkColors.danger
                      : afkColors.textTertiary,
                }}
              />
              <Typography
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  color:
                    session?.status === SessionStatus.ERROR
                      ? afkColors.danger
                      : afkColors.textTertiary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {session?.status.toLowerCase()}
              </Typography>
            </Box>

            <Typography
              variant="body2"
              sx={{ color: afkColors.textSecondary, mb: 3 }}
            >
              {canStart
                ? 'Start the session to access your terminals.'
                : session?.status === SessionStatus.ERROR
                  ? 'Session encountered an error.'
                  : 'Session is not ready yet.'}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
              {canStart && (
                <Button
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={() => startSession(session!.id)}
                  disabled={isStarting}
                >
                  {isStarting ? 'Starting...' : 'Start Session'}
                </Button>
              )}

              {canDelete && (
                <Button
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteSessionClick}
                  disabled={isDeleting}
                  sx={{
                    borderColor: afkColors.danger,
                    color: afkColors.danger,
                    '&:hover': {
                      borderColor: afkColors.danger,
                      bgcolor: afkColors.dangerMuted,
                    },
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              )}
            </Box>
          </Box>
        </Box>

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
  }

  // Running terminal interface
  return (
    <>
      <Box
        sx={{
          height: isMobile ? 'calc(100vh - 48px)' : '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: afkColors.background,
        }}
      >
        {/* Thin status bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 0.75,
            borderBottom: `1px solid ${afkColors.border}`,
            bgcolor: afkColors.surface,
            minHeight: 40,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: afkColors.textPrimary,
              }}
            >
              {session.name || session.id.slice(0, 8)}
            </Typography>
            <DotIcon
              sx={{
                fontSize: 8,
                color: afkColors.accent,
                animation: 'pulse-dot 2s ease-in-out infinite',
              }}
            />
            {gitStatus.branch && (
              <Chip
                label={gitStatus.branch}
                size="small"
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.625rem',
                  height: 20,
                  bgcolor: afkColors.accentMuted,
                  color: afkColors.accent,
                  border: `1px solid rgba(16, 185, 129, 0.2)`,
                }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip
              title={
                gitStatus.hasChanges
                  ? `${gitStatus.changedFileCount} file${gitStatus.changedFileCount !== 1 ? 's' : ''} changed`
                  : 'No changes'
              }
            >
              <span>
                <IconButton
                  size="small"
                  onClick={() => setCommitDialogOpen(true)}
                  disabled={!gitStatus.hasChanges}
                  sx={{
                    p: 0.5,
                    color: gitStatus.hasChanges
                      ? afkColors.accent
                      : afkColors.textTertiary,
                    '&:hover': {
                      color: gitStatus.hasChanges
                        ? afkColors.accentLight
                        : afkColors.textSecondary,
                    },
                  }}
                >
                  <Badge
                    variant="dot"
                    invisible={!gitStatus.hasChanges}
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: afkColors.accent,
                        width: 6,
                        height: 6,
                        minWidth: 6,
                      },
                    }}
                  >
                    <PushIcon sx={{ fontSize: 16 }} />
                  </Badge>
                </IconButton>
              </span>
            </Tooltip>

            <Button
              size="small"
              startIcon={<StopIcon sx={{ fontSize: '14px !important' }} />}
              onClick={handleStopSessionClick}
              disabled={isStopping}
              sx={{
                fontSize: '0.75rem',
                color: afkColors.warning,
                minWidth: 'auto',
                px: 1,
              }}
            >
              {isStopping ? 'Stopping...' : 'Stop'}
            </Button>
          </Box>
        </Box>

        {/* Terminal area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {session.terminalMode === 'DUAL' && isMobile ? (
            /* Mobile Tabs */
            <>
              <Box
                sx={{
                  borderBottom: `1px solid ${afkColors.border}`,
                  bgcolor: afkColors.surface,
                }}
              >
                <Tabs
                  value={activeTab}
                  onChange={(_, v) => setActiveTab(v)}
                  variant="fullWidth"
                  sx={{ minHeight: 36 }}
                >
                  <Tab
                    label="Claude"
                    sx={{
                      minHeight: 36,
                      fontSize: '0.75rem',
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  />
                  <Tab
                    label="Manual"
                    sx={{
                      minHeight: 36,
                      fontSize: '0.75rem',
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  />
                </Tabs>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                }}
              >
                {activeTab === 0 ? (
                  <TerminalPanel
                    label="Claude"
                    ready={healthCheck.claudeTerminalReady}
                    url={session.terminalUrls.claude}
                    isLoading={healthCheck.isLoading}
                    isError={!!healthCheck.error}
                    onRetry={
                      healthCheck.error ? healthCheck.refetch : undefined
                    }
                    onFullscreen={() => {
                      setIsFullscreen(true);
                      setFullscreenTerminal('claude');
                    }}
                  />
                ) : (
                  <TerminalPanel
                    label="Manual"
                    ready={healthCheck.manualTerminalReady}
                    url={session.terminalUrls.manual}
                    isLoading={healthCheck.isLoading}
                    isError={!!healthCheck.error}
                    onRetry={
                      healthCheck.error ? healthCheck.refetch : undefined
                    }
                    onFullscreen={() => {
                      setIsFullscreen(true);
                      setFullscreenTerminal('manual');
                    }}
                  />
                )}
              </Box>
            </>
          ) : session.terminalMode === 'DUAL' ? (
            /* Desktop Side-by-Side */
            <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRight: `1px solid ${afkColors.borderSubtle}`,
                }}
              >
                <TerminalPanel
                  label="Claude"
                  ready={healthCheck.claudeTerminalReady}
                  url={session.terminalUrls.claude}
                  isLoading={healthCheck.isLoading}
                  isError={!!healthCheck.error}
                  onRetry={healthCheck.error ? healthCheck.refetch : undefined}
                  onFullscreen={() => {
                    setIsFullscreen(true);
                    setFullscreenTerminal('claude');
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <TerminalPanel
                  label="Manual"
                  ready={healthCheck.manualTerminalReady}
                  url={session.terminalUrls.manual}
                  isLoading={healthCheck.isLoading}
                  isError={!!healthCheck.error}
                  onRetry={healthCheck.error ? healthCheck.refetch : undefined}
                  onFullscreen={() => {
                    setIsFullscreen(true);
                    setFullscreenTerminal('manual');
                  }}
                />
              </Box>
            </Box>
          ) : (
            /* Single Terminal */
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TerminalPanel
                label="Claude"
                ready={healthCheck.claudeTerminalReady}
                url={session.terminalUrls.claude}
                isLoading={healthCheck.isLoading}
                isError={!!healthCheck.error}
                onRetry={healthCheck.error ? healthCheck.refetch : undefined}
                onFullscreen={() => {
                  setIsFullscreen(true);
                  setFullscreenTerminal('claude');
                }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Fullscreen overlay */}
      {isFullscreen && fullscreenTerminal && session.terminalUrls && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            bgcolor: afkColors.background,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
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
              bgcolor: afkColors.background,
            }}
            title={`${fullscreenTerminal} Terminal Fullscreen`}
          />
          {/* Tiny exit button overlay */}
          <IconButton
            onClick={() => {
              setIsFullscreen(false);
              setFullscreenTerminal(null);
            }}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: afkColors.textTertiary,
              bgcolor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.8)',
                color: afkColors.textPrimary,
              },
            }}
            size="small"
          >
            <FullscreenExitIcon fontSize="small" />
          </IconButton>
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

      {/* Commit & Push Dialog */}
      <CommitPushDialog
        open={commitDialogOpen}
        onClose={() => {
          setCommitDialogOpen(false);
          gitStatus.resetCommitState();
        }}
        branch={gitStatus.branch}
        changedFileCount={gitStatus.changedFileCount}
        isCommitting={gitStatus.isCommitting}
        error={
          gitStatus.commitError
            ? (gitStatus.commitError as Error).message
            : null
        }
        onCommitAndPush={handleCommitAndPush}
      />

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

// Internal terminal panel component
interface TerminalPanelProps {
  label: string;
  ready: boolean;
  url: string;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  onFullscreen: () => void;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({
  label,
  ready,
  url,
  isLoading: loading,
  isError,
  onRetry,
  onFullscreen,
}) => {
  return (
    <>
      {/* Terminal header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 0.5,
          borderBottom: `1px solid ${afkColors.borderSubtle}`,
          bgcolor: afkColors.surface,
          minHeight: 32,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TerminalIcon sx={{ fontSize: 14, color: afkColors.textTertiary }} />
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.6875rem',
              fontWeight: 500,
              color: afkColors.textSecondary,
            }}
          >
            {label}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onFullscreen}
          sx={{
            p: 0.5,
            color: afkColors.textTertiary,
            '&:hover': { color: afkColors.textSecondary },
          }}
        >
          <FullscreenIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      {/* Terminal content */}
      {ready ? (
        <Box
          component="iframe"
          src={url}
          sx={{
            flex: 1,
            border: 'none',
            bgcolor: afkColors.background,
            width: '100%',
          }}
          title={`${label} Terminal`}
        />
      ) : (
        <TerminalLoading
          title={`${label} Terminal`}
          message={
            loading
              ? `Starting ${label.toLowerCase()} terminal...`
              : 'Waiting for container...'
          }
          isError={isError}
          onRetry={onRetry}
        />
      )}
    </>
  );
};

export default SessionDetails;
