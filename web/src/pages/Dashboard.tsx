import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  ContentCopy as DuplicateIcon,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { useSessionStore } from '../stores/session.store';
import { SessionStatus } from '../api/types';
import { ROUTES } from '../utils/constants';
import { afkColors } from '../themes/afk';
import { ApprovalModal } from '../components/ApprovalModal';
import { BulkActionModal } from '../components/BulkActionModal';
import { TerminalCursor } from '../components/TerminalCursor';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    sessions,
    isLoading,
    error,
    startSession,
    stopSession,
    deleteSession,
    clearError,
    startingSessionId,
    stoppingSessionId,
    deletingSessionId,
  } = useSession();

  const { deleteProgress } = useSessionStore();

  const runningSessions = sessions.filter(
    (s) => s.status === SessionStatus.RUNNING,
  );
  const stoppedSessions = sessions.filter(
    (s) =>
      s.status === SessionStatus.STOPPED || s.status === SessionStatus.ERROR,
  );

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

  // Bulk action state
  const [bulkModal, setBulkModal] = React.useState<{
    open: boolean;
    type: 'stop-all' | 'delete-all';
  }>({ open: false, type: 'stop-all' });
  const [isBulkStarting, setIsBulkStarting] = React.useState(false);
  const [isBulkLoading, setIsBulkLoading] = React.useState(false);
  const [bulkProgress, setBulkProgress] = React.useState<{
    current: number;
    total: number;
  } | null>(null);

  const handleViewSession = (sessionId: string) => {
    navigate(ROUTES.getSessionDetails(sessionId));
  };

  const handleDuplicateSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
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

  const handleStopSessionClick = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    setApprovalModal({
      open: true,
      type: 'stop',
      sessionId,
      sessionName: session?.name || session?.id.slice(0, 12),
    });
  };

  const handleDeleteSessionClick = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    setApprovalModal({
      open: true,
      type: 'delete',
      sessionId,
      sessionName: session?.name || session?.id.slice(0, 12),
    });
  };

  const handleModalClose = () => {
    setApprovalModal((prev) => ({ ...prev, open: false }));
  };

  const handleModalConfirm = async () => {
    try {
      if (approvalModal.type === 'stop') {
        await stopSession(approvalModal.sessionId);
        handleModalClose();
      } else {
        await deleteSession(approvalModal.sessionId);
      }
    } catch (error) {
      console.error(`Failed to ${approvalModal.type} session:`, error);
      handleModalClose();
    }
  };

  React.useEffect(() => {
    if (!approvalModal.open || approvalModal.type !== 'delete') return;
    const session = sessions.find((s) => s.id === approvalModal.sessionId);
    if (!session) {
      handleModalClose();
    }
  }, [sessions, approvalModal]);

  const handleStartAll = async () => {
    const targets = sessions.filter((s) => s.status === SessionStatus.STOPPED);
    if (targets.length === 0) return;
    setIsBulkStarting(true);
    for (const session of targets) {
      try {
        await startSession(session.id);
      } catch {
        // continue with remaining sessions
      }
    }
    setIsBulkStarting(false);
  };

  const handleBulkModalClose = () => {
    setBulkModal((prev) => ({ ...prev, open: false }));
  };

  const handleBulkModalConfirm = async () => {
    setIsBulkLoading(true);
    try {
      if (bulkModal.type === 'stop-all') {
        const targets = [...runningSessions];
        setBulkProgress({ current: 0, total: targets.length });
        for (let i = 0; i < targets.length; i++) {
          setBulkProgress({ current: i + 1, total: targets.length });
          try {
            await stopSession(targets[i].id);
          } catch {
            // continue with remaining sessions
          }
        }
      } else {
        const targets = [...stoppedSessions];
        setBulkProgress({ current: 0, total: targets.length });
        for (let i = 0; i < targets.length; i++) {
          setBulkProgress({ current: i + 1, total: targets.length });
          try {
            await deleteSession(targets[i].id);
          } catch {
            // continue with remaining sessions
          }
        }
      }
    } finally {
      setIsBulkLoading(false);
      setBulkProgress(null);
      handleBulkModalClose();
    }
  };

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.RUNNING:
        return afkColors.accent;
      case SessionStatus.STOPPED:
        return afkColors.textTertiary;
      case SessionStatus.DELETING:
        return afkColors.warning;
      case SessionStatus.ERROR:
        return afkColors.danger;
      default:
        return afkColors.textTertiary;
    }
  };

  const getStatusText = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.RUNNING:
        return 'Running';
      case SessionStatus.STOPPED:
        return 'Stopped';
      case SessionStatus.DELETING:
        return 'Deleting';
      case SessionStatus.ERROR:
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  if (isLoading && sessions.length === 0) {
    return (
      <Box sx={{ p: 3, width: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Typography variant="h3">Sessions</Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={180}
              sx={{ borderRadius: '8px' }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Typography variant="h3">Sessions</Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          {sessions.length > 0 && (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PlayIcon sx={{ fontSize: '16px !important' }} />}
                onClick={handleStartAll}
                disabled={
                  stoppedSessions.length === 0 ||
                  isBulkStarting ||
                  isBulkLoading
                }
                sx={{ fontSize: '0.75rem' }}
              >
                {isBulkStarting ? 'Starting...' : 'Start All'}
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<StopIcon sx={{ fontSize: '16px !important' }} />}
                onClick={() => setBulkModal({ open: true, type: 'stop-all' })}
                disabled={
                  runningSessions.length === 0 ||
                  isBulkStarting ||
                  isBulkLoading
                }
                sx={{
                  fontSize: '0.75rem',
                  borderColor: afkColors.warning,
                  color: afkColors.warning,
                  '&:hover': {
                    borderColor: '#d97706',
                    bgcolor: afkColors.warningMuted,
                  },
                  '&.Mui-disabled': {
                    borderColor: afkColors.border,
                  },
                }}
              >
                Stop All
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  <DeleteSweepIcon sx={{ fontSize: '16px !important' }} />
                }
                onClick={() => setBulkModal({ open: true, type: 'delete-all' })}
                disabled={
                  stoppedSessions.length === 0 ||
                  isBulkStarting ||
                  isBulkLoading
                }
                sx={{
                  fontSize: '0.75rem',
                  borderColor: afkColors.danger,
                  color: afkColors.danger,
                  '&:hover': {
                    borderColor: '#dc2626',
                    bgcolor: afkColors.dangerMuted,
                  },
                  '&.Mui-disabled': {
                    borderColor: afkColors.border,
                  },
                }}
              >
                Delete All
              </Button>
            </>
          )}
          <Button
            component={Link}
            to={ROUTES.CREATE_SESSION}
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
          >
            New Session
          </Button>
        </Box>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {sessions.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '1.25rem',
              color: afkColors.textSecondary,
              fontWeight: 500,
            }}
          >
            No sessions yet
          </Typography>
          <TerminalCursor />
          <Button
            component={Link}
            to={ROUTES.CREATE_SESSION}
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ mt: 2 }}
          >
            Create Your First Session
          </Button>
        </Box>
      ) : (
        /* Session Card Grid */
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          <AnimatePresence mode="popLayout">
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                transition={{
                  layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                  filter: { duration: 0.2 },
                }}
              >
                <Box
                  sx={{
                    border: `1px solid ${afkColors.border}`,
                    borderRadius: '8px',
                    bgcolor: afkColors.surface,
                    p: 2.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    transition: 'border-color 150ms ease',
                    cursor: 'pointer',
                    height: '100%',
                    '&:hover': {
                      borderColor: afkColors.textTertiary,
                    },
                  }}
                  onClick={() => handleViewSession(session.id)}
                >
                  {/* Top: Name + Status */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: afkColors.textPrimary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {session.name || session.id.slice(0, 12)}
                      </Typography>
                      {session.repoUrl && (
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            color: afkColors.textTertiary,
                            mt: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {session.repoUrl
                            .split('/')
                            .pop()
                            ?.replace('.git', '')}
                        </Typography>
                      )}
                      {session.imageName && (
                        <Typography
                          sx={{
                            fontSize: '0.6875rem',
                            fontFamily: '"JetBrains Mono", monospace',
                            color: afkColors.textTertiary,
                            mt: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {session.imageName}
                        </Typography>
                      )}
                    </Box>

                    {/* Status dot + text */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        flexShrink: 0,
                        ml: 1,
                      }}
                    >
                      <DotIcon
                        sx={{
                          fontSize: 8,
                          color: getStatusColor(session.status),
                          ...((session.status === SessionStatus.RUNNING ||
                            session.status === SessionStatus.DELETING) && {
                            animation: 'pulse-dot 2s ease-in-out infinite',
                          }),
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: '0.6875rem',
                          fontFamily: '"JetBrains Mono", monospace',
                          fontWeight: 500,
                          color: getStatusColor(session.status),
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {getStatusText(session.status)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Actions row */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mt: 'auto',
                      pt: 1,
                      borderTop: `1px solid ${afkColors.border}`,
                    }}
                  >
                    {session.status === SessionStatus.STOPPED && (
                      <Button
                        variant="text"
                        size="small"
                        startIcon={
                          <PlayIcon sx={{ fontSize: '16px !important' }} />
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          startSession(session.id);
                        }}
                        disabled={startingSessionId === session.id}
                        sx={{
                          fontSize: '0.75rem',
                          color: afkColors.accent,
                          px: 1,
                          minWidth: 'auto',
                        }}
                      >
                        {startingSessionId === session.id
                          ? 'Starting...'
                          : 'Start'}
                      </Button>
                    )}

                    {session.status === SessionStatus.RUNNING && (
                      <Button
                        variant="text"
                        size="small"
                        startIcon={
                          <StopIcon sx={{ fontSize: '16px !important' }} />
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStopSessionClick(session.id);
                        }}
                        disabled={stoppingSessionId === session.id}
                        sx={{
                          fontSize: '0.75rem',
                          color: afkColors.warning,
                          px: 1,
                          minWidth: 'auto',
                        }}
                      >
                        {stoppingSessionId === session.id
                          ? 'Stopping...'
                          : 'Stop'}
                      </Button>
                    )}

                    <Box sx={{ flex: 1 }} />

                    {(session.status === SessionStatus.STOPPED ||
                      session.status === SessionStatus.ERROR) && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSessionClick(session.id);
                        }}
                        disabled={deletingSessionId === session.id}
                        title="Delete"
                        sx={{
                          color: afkColors.textTertiary,
                          '&:hover': { color: afkColors.danger },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}

                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateSession(session.id);
                      }}
                      title="Duplicate"
                      sx={{
                        color: afkColors.textTertiary,
                        '&:hover': { color: afkColors.textSecondary },
                      }}
                    >
                      <DuplicateIcon sx={{ fontSize: 16 }} />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewSession(session.id);
                      }}
                      title="View Details"
                      sx={{ color: afkColors.textTertiary }}
                    >
                      <ViewIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      )}

      {/* Approval Modal */}
      <ApprovalModal
        open={approvalModal.open}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        type={approvalModal.type}
        sessionName={approvalModal.sessionName}
        isLoading={
          approvalModal.type === 'stop'
            ? stoppingSessionId === approvalModal.sessionId
            : deletingSessionId === approvalModal.sessionId ||
              deleteProgress?.sessionId === approvalModal.sessionId
        }
        deleteProgressMessage={
          deleteProgress?.sessionId === approvalModal.sessionId
            ? deleteProgress.message
            : null
        }
      />

      {/* Bulk Action Modal */}
      <BulkActionModal
        open={bulkModal.open}
        onClose={handleBulkModalClose}
        onConfirm={handleBulkModalConfirm}
        type={bulkModal.type}
        count={
          bulkModal.type === 'stop-all'
            ? runningSessions.length
            : stoppedSessions.length
        }
        isLoading={isBulkLoading}
        progress={bulkProgress}
      />
    </Box>
  );
};

export { Dashboard };
