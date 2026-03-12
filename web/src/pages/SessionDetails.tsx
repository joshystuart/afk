import React from 'react';
import {
  Box,
  Badge,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Skeleton,
  Snackbar,
  Alert,
  Typography,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Terminal as TerminalIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
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
import ApprovalModal from '../components/ApprovalModal';
import CommitPushDialog from '../components/CommitPushDialog';
import { ChatPanel } from '../components/chat/ChatPanel';

const SessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { subscribeToSession, unsubscribeFromSession } = useWebSocket();

  const {
    isLoading,
    startSession,
    stopSession,
    deleteSession,
    updateSession,
    getSession,
    isStarting,
    isStopping,
    isDeleting,
    isUpdating,
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

  const shouldCheckHealth = session?.status === SessionStatus.RUNNING;
  const healthCheck = useSessionHealth(id || null, shouldCheckHealth);

  const isRunning = session?.status === SessionStatus.RUNNING;
  const gitStatus = useGitStatus(id || null, isRunning ?? false);

  const [commitDialogOpen, setCommitDialogOpen] = React.useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [renameInput, setRenameInput] = React.useState('');
  const [renameError, setRenameError] = React.useState<string | null>(null);
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

  const handleRenameOpen = () => {
    if (!session) return;
    setRenameInput(session.name || '');
    setRenameError(null);
    setRenameDialogOpen(true);
  };

  const handleRenameClose = () => {
    if (isUpdating) return;
    setRenameDialogOpen(false);
    setRenameError(null);
  };

  const handleRenameSubmit = async () => {
    if (!session) return;
    const trimmedName = renameInput.trim();

    if (!trimmedName) {
      setRenameError('Session name is required');
      return;
    }
    if (trimmedName.length < 3) {
      setRenameError('Session name must be at least 3 characters');
      return;
    }
    if (trimmedName.length > 50) {
      setRenameError('Session name must be 50 characters or less');
      return;
    }
    if (trimmedName === session.name) {
      handleRenameClose();
      return;
    }

    setRenameError(null);
    try {
      await updateSession({
        sessionId: session.id,
        request: { name: trimmedName },
      });
      setRenameDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Session renamed successfully',
        severity: 'success',
      });
    } catch (error) {
      setRenameError((error as Error).message || 'Failed to rename session');
    }
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

  const renameDialog = (
    <Dialog
      open={renameDialogOpen}
      onClose={handleRenameClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: afkColors.surface,
          border: `1px solid ${afkColors.border}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.9375rem',
          fontWeight: 600,
          pb: 1,
        }}
      >
        Rename Session
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <TextField
          autoFocus
          fullWidth
          label="Session Name"
          placeholder="Enter session name"
          value={renameInput}
          onChange={(e) => {
            setRenameInput(e.target.value);
            if (renameError) setRenameError(null);
          }}
          disabled={isUpdating}
          error={!!renameError}
          helperText={renameError || '3-50 characters'}
          inputProps={{ minLength: 3, maxLength: 50 }}
          sx={{
            '& .MuiInputBase-input': {
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.875rem',
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={handleRenameClose}
          disabled={isUpdating}
          sx={{ color: afkColors.textSecondary }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleRenameSubmit}
          disabled={isUpdating || !renameInput.trim()}
          startIcon={<EditIcon sx={{ fontSize: '16px !important' }} />}
        >
          {isUpdating ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (!session || session.status !== SessionStatus.RUNNING) {
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
              <Tooltip title="Rename session">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleRenameOpen}
                    disabled={isUpdating}
                    sx={{
                      p: 0.25,
                      color: afkColors.textTertiary,
                      '&:hover': { color: afkColors.textSecondary },
                    }}
                  >
                    <EditIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </span>
              </Tooltip>
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
                ? 'Start the session to begin chatting with Claude.'
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
        {renameDialog}
      </>
    );
  }

  const handleOpenTerminal = () => {
    if (!session?.terminalUrl) return;
    window.open(session.terminalUrl, '_blank', 'popup,width=960,height=640');
  };

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
        {/* Status bar */}
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
            <Tooltip title="Rename session">
              <span>
                <IconButton
                  size="small"
                  onClick={handleRenameOpen}
                  disabled={isUpdating}
                  sx={{
                    p: 0.25,
                    color: afkColors.textTertiary,
                    '&:hover': { color: afkColors.textSecondary },
                  }}
                >
                  <EditIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </span>
            </Tooltip>
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
            <Tooltip title="Open terminal in popup">
              <span>
                <IconButton
                  size="small"
                  onClick={handleOpenTerminal}
                  disabled={!healthCheck.terminalReady || isStopping}
                  sx={{
                    p: 0.5,
                    color: afkColors.textTertiary,
                    '&:hover': { color: afkColors.textSecondary },
                  }}
                >
                  <TerminalIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </span>
            </Tooltip>

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
                  onClick={() => {
                    gitStatus.refetchStatus();
                    setCommitDialogOpen(true);
                  }}
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

        {/* Chat area */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ChatPanel sessionId={session.id} />
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

      {renameDialog}

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

export default SessionDetails;
