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
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Terminal as TerminalIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as DuplicateIcon,
  FiberManualRecord as DotIcon,
  CloudUpload as PushIcon,
  ChatBubbleOutline as ChatIcon,
} from '@mui/icons-material';
import { useHotkeys } from 'react-hotkeys-hook';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { DockerLogsExpander } from '../components/DockerLogsExpander';
import { PrimaryCtaButton } from '../components/PrimaryCtaButton';
import { useSession } from '../hooks/useSession';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSessionHealth } from '../hooks/useSessionHealth';
import { useGitStatus } from '../hooks/useGitStatus';
import { SessionStatus } from '../api/types';
import { useSessionStore } from '../stores/session.store';
import { ROUTES } from '../utils/constants';
import { afkColors } from '../themes/afk';
import { ApprovalModal } from '../components/ApprovalModal';
import { TerminalCursor } from '../components/TerminalCursor';
import { CommitPushDialog } from '../components/CommitPushDialog';
import { ChatPanel } from '../components/chat/ChatPanel';
import { useSessionTabs } from '../hooks/useSessionTabs';
import type { SessionTab } from '../hooks/useSessionTabs';
import { SessionTabBar } from '../components/session/SessionTabBar';
import { SessionTabPanel } from '../components/session/SessionTabPanel';
import { TerminalView } from '../components/session/TerminalView';

const CONTENT_HEIGHT = 'calc(100vh - 48px)';

const SessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { socket, subscribeToSession, unsubscribeFromSession, connected } =
    useWebSocket();

  const {
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

  const isStartingOrRunning =
    session?.status === SessionStatus.RUNNING ||
    session?.status === SessionStatus.STARTING;
  const healthCheck = useSessionHealth(id || null, isStartingOrRunning);

  const isRunning = session?.status === SessionStatus.RUNNING;
  const isReady = isRunning && healthCheck.allReady;
  const hasGitRepo = Boolean(session?.repoUrl);
  const gitStatus = useGitStatus(id || null, isReady && hasGitRepo);

  const { deleteProgress } = useSessionStore();

  const { activeTab, switchTab } = useSessionTabs(id || '');

  const [terminalUnread, setTerminalUnread] = React.useState(false);
  const [chatUnread, setChatUnread] = React.useState(false);

  React.useEffect(() => {
    if (activeTab === 'terminal') setTerminalUnread(false);
    if (activeTab === 'chat') setChatUnread(false);
  }, [activeTab]);

  React.useEffect(() => {
    if (!socket || !id) return;
    const onTerminalData = (payload: { sessionId: string }) => {
      if (payload.sessionId !== id) return;
      if (activeTab !== 'terminal') {
        setTerminalUnread(true);
      }
    };
    socket.on('terminal.data', onTerminalData);
    return () => {
      socket.off('terminal.data', onTerminalData);
    };
  }, [socket, id, activeTab]);

  React.useEffect(() => {
    if (!socket || !id) return;
    const onChatStream = (payload: { sessionId: string }) => {
      if (payload.sessionId !== id) return;
      if (activeTab !== 'chat') {
        setChatUnread(true);
      }
    };
    socket.on('chat.stream', onChatStream);
    return () => {
      socket.off('chat.stream', onChatStream);
    };
  }, [socket, id, activeTab]);

  const sessionTabs: SessionTab[] = React.useMemo(
    () => [
      {
        id: 'chat',
        label: 'Chat',
        icon: <ChatIcon sx={{ fontSize: 18 }} />,
        badge: chatUnread,
      },
      {
        id: 'terminal',
        label: 'Terminal',
        icon: <TerminalIcon sx={{ fontSize: 18 }} />,
        badge: terminalUnread,
        disabled: !healthCheck.terminalReady,
      },
    ],
    [chatUnread, terminalUnread, healthCheck.terminalReady],
  );

  useHotkeys(
    'ctrl+`',
    (e) => {
      e.preventDefault();
      switchTab(activeTab === 'chat' ? 'terminal' : 'chat');
    },
    { enableOnFormTags: true, enableOnContentEditable: true },
  );

  useHotkeys(
    'meta+`',
    (e) => {
      e.preventDefault();
      switchTab(activeTab === 'chat' ? 'terminal' : 'chat');
    },
    { enableOnFormTags: true, enableOnContentEditable: true },
  );

  const [commitDialogOpen, setCommitDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!hasGitRepo) {
      setCommitDialogOpen(false);
    }
  }, [hasGitRepo]);
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

  const handleDuplicateSession = () => {
    if (!session) return;
    navigate(ROUTES.CREATE_SESSION, {
      state: {
        duplicateFrom: {
          name: session.name,
          imageId: session.imageId,
          repoUrl: session.repoUrl,
          branch: session.branch,
          hostMountPath: session.hostMountPath,
        },
      },
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
        handleModalClose();
      } else {
        handleModalClose();
        navigate(ROUTES.DASHBOARD);
        deleteSession(session.id).catch((err) =>
          console.error('Failed to delete session:', err),
        );
      }
    } catch (error) {
      console.error(`Failed to ${approvalModal.type} session:`, error);
      handleModalClose();
    }
  };

  React.useEffect(() => {
    if (id && connected) {
      subscribeToSession(id);
    }
    return () => {
      if (id) {
        unsubscribeFromSession(id);
      }
    };
  }, [id, connected, subscribeToSession, unsubscribeFromSession]);

  React.useEffect(() => {
    if (!session) return;
    const name = session.name || session.id.slice(0, 8);
    const image = session.imageName;
    document.title = image ? `${name} (${image}) - AFK` : `${name} - AFK`;
    return () => {
      document.title = 'AFK';
    };
  }, [session?.name, session?.imageName, session?.id]);

  // Loading state
  if (sessionQuery?.isLoading) {
    return (
      <Box
        sx={{
          height: CONTENT_HEIGHT,
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
          height: CONTENT_HEIGHT,
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
        <PrimaryCtaButton
          onClick={handleRenameSubmit}
          disabled={isUpdating || !renameInput.trim()}
          startIcon={<EditIcon sx={{ fontSize: '16px !important' }} />}
        >
          {isUpdating ? 'Saving...' : 'Save'}
        </PrimaryCtaButton>
      </DialogActions>
    </Dialog>
  );

  if (session?.status === SessionStatus.DELETING) {
    const progressMsg =
      deleteProgress?.sessionId === session.id
        ? deleteProgress.message
        : 'Preparing to delete...';

    return (
      <Box
        sx={{
          height: CONTENT_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center', maxWidth: 400, px: 3 }}>
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '1rem',
              fontWeight: 600,
              color: afkColors.textPrimary,
              mb: 1,
            }}
          >
            {session.name || session.id.slice(0, 12)}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mb: 3,
            }}
          >
            <DotIcon
              sx={{
                fontSize: 8,
                color: afkColors.warning,
                animation: 'pulse-dot 2s ease-in-out infinite',
              }}
            />
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: afkColors.warning,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Deleting
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                border: `2px solid ${afkColors.textTertiary}`,
                borderTopColor: afkColors.warning,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            />
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.75rem',
                color: afkColors.textSecondary,
              }}
            >
              {progressMsg}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  if (
    !session ||
    (session.status !== SessionStatus.RUNNING &&
      session.status !== SessionStatus.STARTING)
  ) {
    return (
      <>
        <Box
          sx={{
            height: CONTENT_HEIGHT,
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

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              {canStart && (
                <PrimaryCtaButton
                  size="small"
                  startIcon={<PlayIcon sx={{ fontSize: '16px !important' }} />}
                  onClick={() => startSession(session!.id)}
                  disabled={isStarting}
                  sx={{ fontSize: '0.8125rem' }}
                >
                  {isStarting ? 'Starting...' : 'Start'}
                </PrimaryCtaButton>
              )}

              <Button
                variant="outlined"
                size="small"
                startIcon={
                  <DuplicateIcon sx={{ fontSize: '16px !important' }} />
                }
                onClick={handleDuplicateSession}
                sx={{ fontSize: '0.8125rem' }}
              >
                Duplicate
              </Button>

              {canDelete && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={
                    <DeleteIcon sx={{ fontSize: '16px !important' }} />
                  }
                  onClick={handleDeleteSessionClick}
                  disabled={isDeleting}
                  sx={{
                    fontSize: '0.8125rem',
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
          isLoading={
            approvalModal.type === 'stop'
              ? isStopping
              : isDeleting ||
                deleteProgress?.sessionId === approvalModal.sessionId
          }
          deleteProgressMessage={
            deleteProgress?.sessionId === approvalModal.sessionId
              ? deleteProgress.message
              : null
          }
        />
        {renameDialog}
      </>
    );
  }

  if (isStartingOrRunning && !healthCheck.allReady) {
    return (
      <>
        <Box
          sx={{
            height: CONTENT_HEIGHT,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: afkColors.background,
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 0,
            }}
          >
            <Box sx={{ textAlign: 'center', px: 3 }}>
              <Typography
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: afkColors.textPrimary,
                  mb: 3,
                }}
              >
                {session.name || session.id.slice(0, 12)}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <TerminalCursor size="lg" />
              </Box>

              <Typography
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: afkColors.textPrimary,
                  mb: 1,
                }}
              >
                Initializing session...
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: afkColors.textTertiary, mb: 4 }}
              >
                Setting up environment
              </Typography>

              <Button
                size="small"
                startIcon={<StopIcon sx={{ fontSize: '14px !important' }} />}
                onClick={handleStopSessionClick}
                disabled={isStopping}
                sx={{
                  fontSize: '0.75rem',
                  color: afkColors.warning,
                }}
              >
                {isStopping ? 'Stopping...' : 'Stop'}
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              flexShrink: 0,
              px: 3,
              pb: 3,
              mx: 'auto',
              width: '100%',
              maxWidth: 600,
            }}
          >
            <DockerLogsExpander sessionId={session.id} />
          </Box>
        </Box>

        <ApprovalModal
          open={approvalModal.open}
          onClose={handleModalClose}
          onConfirm={handleModalConfirm}
          type={approvalModal.type}
          sessionName={approvalModal.sessionName}
          isLoading={
            approvalModal.type === 'stop'
              ? isStopping
              : isDeleting ||
                deleteProgress?.sessionId === approvalModal.sessionId
          }
          deleteProgressMessage={
            deleteProgress?.sessionId === approvalModal.sessionId
              ? deleteProgress.message
              : null
          }
        />
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
          height: CONTENT_HEIGHT,
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
            {hasGitRepo && gitStatus.branch && (
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
            <Tooltip title="Duplicate session">
              <span>
                <IconButton
                  size="small"
                  onClick={handleDuplicateSession}
                  sx={{
                    p: 0.5,
                    color: afkColors.textTertiary,
                    '&:hover': { color: afkColors.textSecondary },
                  }}
                >
                  <DuplicateIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </span>
            </Tooltip>

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

            {hasGitRepo && (
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
            )}

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

        {/* Tab bar — between status bar and content */}
        <SessionTabBar
          tabs={sessionTabs}
          activeTab={activeTab}
          onTabChange={switchTab}
        />

        {/* Tab panels — both mounted, visibility toggled */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <SessionTabPanel active={activeTab === 'chat'}>
            <ChatPanel sessionId={session.id} />
          </SessionTabPanel>
          <SessionTabPanel active={activeTab === 'terminal'}>
            <TerminalView
              sessionId={session.id}
              visible={activeTab === 'terminal'}
            />
          </SessionTabPanel>
        </Box>
      </Box>

      <ApprovalModal
        open={approvalModal.open}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        type={approvalModal.type}
        sessionName={approvalModal.sessionName}
        isLoading={
          approvalModal.type === 'stop'
            ? isStopping
            : isDeleting ||
              deleteProgress?.sessionId === approvalModal.sessionId
        }
        deleteProgressMessage={
          deleteProgress?.sessionId === approvalModal.sessionId
            ? deleteProgress.message
            : null
        }
      />

      {hasGitRepo && (
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
      )}

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

export { SessionDetails };
