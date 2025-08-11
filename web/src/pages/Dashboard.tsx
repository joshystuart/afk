import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Alert,
  Skeleton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Terminal as TerminalIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { SessionStatus } from '../api/types';
import { ROUTES } from '../utils/constants';

// Berry Components
import MainCard from '../components/ui-component/cards/MainCard';
import AnimateButton from '../components/ui-component/extended/AnimateButton';
import ApprovalModal from '../components/ApprovalModal';

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const {
    sessions,
    isLoading,
    error,
    startSession,
    stopSession,
    deleteSession,
    refetchSessions,
    clearError,
    isStarting,
    isStopping,
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

  const handleViewSession = (sessionId: string) => {
    navigate(ROUTES.getSessionDetails(sessionId));
  };

  // Modal handlers
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
      } else {
        await deleteSession(approvalModal.sessionId);
      }
      handleModalClose();
    } catch (error) {
      console.error(`Failed to ${approvalModal.type} session:`, error);
      // Keep modal open on error so user can try again
    }
  };

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.RUNNING:
        return theme.palette.success.main;
      case SessionStatus.STOPPED:
        return theme.palette.grey[500];
      case SessionStatus.ERROR:
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusText = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.RUNNING:
        return 'RUNNING';
      case SessionStatus.STOPPED:
        return 'STOPPED';
      case SessionStatus.ERROR:
        return 'ERROR';
      default:
        return 'UNKNOWN';
    }
  };

  if (isLoading && sessions.length === 0) {
    return (
      <Box sx={{ p: isMobile ? 2 : 3, width: '100%' }}>
        <MainCard
          title={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 1 : 2,
                flex: 1,
                minWidth: 0,
              }}
            >
              <TerminalIcon
                sx={{
                  color: 'primary.main',
                  fontSize: isMobile ? 24 : 28,
                }}
              />
              <Typography
                variant={isMobile ? 'h5' : 'h3'}
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: isMobile ? 'nowrap' : 'normal',
                  lineHeight: isMobile ? 1.2 : 'normal',
                }}
              >
                {isMobile ? 'Sessions' : 'Remote Development Sessions'}
              </Typography>
            </Box>
          }
          secondary={
            <AnimateButton>
              <Button
                component={Link}
                to={ROUTES.CREATE_SESSION}
                variant="contained"
                startIcon={<AddIcon />}
                size={isMobile ? 'small' : 'medium'}
                disabled
              >
                {isMobile ? 'Create' : 'Create Session'}
              </Button>
            </AnimateButton>
          }
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="rectangular" height={60} />
          </Box>
        </MainCard>
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3, width: '100%' }}>
      {/* Header Card */}
      <MainCard
        title={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 1 : 2,
              flex: 1,
              minWidth: 0,
            }}
          >
            <TerminalIcon
              sx={{
                color: 'primary.main',
                fontSize: isMobile ? 24 : 28,
              }}
            />
            <Typography
              variant={isMobile ? 'h5' : 'h3'}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: isMobile ? 'nowrap' : 'normal',
                lineHeight: isMobile ? 1.2 : 'normal',
              }}
            >
              {isMobile ? 'Sessions' : 'Remote Development Sessions'}
            </Typography>
          </Box>
        }
        secondary={
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexShrink: 0,
              alignItems: 'center',
            }}
          >
            <AnimateButton>
              <IconButton onClick={() => refetchSessions()} size="small">
                <RefreshIcon />
              </IconButton>
            </AnimateButton>
            <AnimateButton>
              <IconButton
                component={Link}
                to={ROUTES.CREATE_SESSION}
                size="small"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
              >
                <AddIcon />
              </IconButton>
            </AnimateButton>
          </Box>
        }
        sx={{ mb: 3 }}
      >
        {/* Error Alert */}
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
              py: isMobile ? 4 : 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isMobile ? 2 : 3,
            }}
          >
            <TerminalIcon
              sx={{ fontSize: isMobile ? 60 : 80, color: 'text.secondary' }}
            />
            <Box>
              <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ mb: 1 }}>
                No sessions yet
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ px: isMobile ? 2 : 0 }}
              >
                Create your first development session to get started
              </Typography>
            </Box>
            <AnimateButton>
              <Button
                component={Link}
                to={ROUTES.CREATE_SESSION}
                variant="contained"
                size={isMobile ? 'medium' : 'large'}
                startIcon={<AddIcon />}
                sx={{
                  px: isMobile ? 3 : 4,
                  width: isMobile ? '90%' : 'auto',
                  maxWidth: isMobile ? 300 : 'none',
                }}
              >
                {isMobile ? 'Create Session' : 'Create Your First Session'}
              </Button>
            </AnimateButton>
          </Box>
        ) : isMobile ? (
          /* Mobile Session Cards */
          <Stack spacing={2}>
            {sessions.map((session) => (
              <Card
                key={session.id}
                variant="outlined"
                sx={{
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Session Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: 'monospace',
                          mb: 0.5,
                          wordBreak: 'break-all',
                        }}
                      >
                        {session.name || session.id.slice(0, 12)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ wordBreak: 'break-all' }}
                      >
                        {session.id}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={getStatusText(session.status)}
                      sx={{
                        bgcolor: getStatusColor(session.status),
                        color: 'white',
                        fontWeight: 600,
                        ml: 1,
                        ...(session.status === SessionStatus.RUNNING && {
                          animation: 'pulse 2s infinite',
                        }),
                      }}
                    />
                  </Box>

                  {/* Repository */}
                  {session.repoUrl && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Repository
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                      >
                        {session.repoUrl.split('/').pop()?.replace('.git', '')}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Terminal Access */}
                  {session.status === SessionStatus.RUNNING &&
                  session.terminalUrls ? (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Terminal Access
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<TerminalIcon />}
                          href={session.terminalUrls.claude}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ fontWeight: 600 }}
                        >
                          Claude
                        </Button>
                        {session.terminalMode === 'DUAL' && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<TerminalIcon />}
                            href={session.terminalUrls.manual}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Manual
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  ) : (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Terminal access not available
                      </Typography>
                    </Box>
                  )}

                  {/* Actions */}
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    {/* Start Button */}
                    {session.status === SessionStatus.STOPPED && (
                      <AnimateButton>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PlayIcon />}
                          onClick={() => startSession(session.id)}
                          disabled={isStarting}
                          color="success"
                        >
                          {isStarting ? 'Starting...' : 'Start'}
                        </Button>
                      </AnimateButton>
                    )}

                    {/* Stop Button */}
                    {session.status === SessionStatus.RUNNING && (
                      <AnimateButton>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<StopIcon />}
                          onClick={() => handleStopSessionClick(session.id)}
                          disabled={isStopping}
                          color="warning"
                        >
                          {isStopping ? 'Stopping...' : 'Stop'}
                        </Button>
                      </AnimateButton>
                    )}

                    <Box sx={{ flex: 1 }} />

                    {/* Icon Actions */}
                    {(session.status === SessionStatus.STOPPED ||
                      session.status === SessionStatus.ERROR) && (
                      <AnimateButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteSessionClick(session.id)}
                          disabled={isDeleting}
                          title="Delete Session"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </AnimateButton>
                    )}

                    <AnimateButton>
                      <IconButton
                        size="small"
                        onClick={() => handleViewSession(session.id)}
                        title="View Details"
                        color="primary"
                      >
                        <ViewIcon />
                      </IconButton>
                    </AnimateButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          /* Desktop Sessions Table */
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Session</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Repository</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    Terminal Access
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow
                    key={session.id}
                    sx={{
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.02)',
                      },
                    }}
                  >
                    {/* Session Name */}
                    <TableCell>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ fontFamily: 'monospace', mb: 0.5 }}
                        >
                          {session.name || session.id.slice(0, 12)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {session.id}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Repository */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {session.repoUrl
                          ? session.repoUrl
                              .split('/')
                              .pop()
                              ?.replace('.git', '')
                          : 'No repository'}
                      </Typography>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Chip
                        size="small"
                        label={getStatusText(session.status)}
                        sx={{
                          bgcolor: getStatusColor(session.status),
                          color: 'white',
                          fontWeight: 600,
                          minWidth: 80,
                          ...(session.status === SessionStatus.RUNNING && {
                            animation: 'pulse 2s infinite',
                          }),
                        }}
                      />
                    </TableCell>

                    {/* Terminal Access */}
                    <TableCell>
                      {session.status === SessionStatus.RUNNING &&
                      session.terminalUrls ? (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<TerminalIcon />}
                            href={session.terminalUrls.claude}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ fontWeight: 600 }}
                          >
                            Claude
                          </Button>
                          {session.terminalMode === 'DUAL' && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<TerminalIcon />}
                              href={session.terminalUrls.manual}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Manual
                            </Button>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not available
                        </Typography>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 0.5,
                          justifyContent: 'flex-end',
                        }}
                      >
                        {/* Start Button */}
                        {session.status === SessionStatus.STOPPED && (
                          <AnimateButton>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<PlayIcon />}
                              onClick={() => startSession(session.id)}
                              disabled={isStarting}
                              color="success"
                              sx={{ minWidth: 80 }}
                            >
                              {isStarting ? 'Starting...' : 'Start'}
                            </Button>
                          </AnimateButton>
                        )}

                        {/* Delete Button */}
                        {(session.status === SessionStatus.STOPPED ||
                          session.status === SessionStatus.ERROR) && (
                          <AnimateButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleDeleteSessionClick(session.id)
                              }
                              disabled={isDeleting}
                              title="Delete Session"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </AnimateButton>
                        )}

                        {/* Stop Button */}
                        {session.status === SessionStatus.RUNNING && (
                          <AnimateButton>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<StopIcon />}
                              onClick={() => handleStopSessionClick(session.id)}
                              disabled={isStopping}
                              color="warning"
                              sx={{ minWidth: 80 }}
                            >
                              {isStopping ? 'Stopping...' : 'Stop'}
                            </Button>
                          </AnimateButton>
                        )}

                        {/* Restart Button */}
                        {/* View Details Button */}
                        <AnimateButton>
                          <IconButton
                            size="small"
                            onClick={() => handleViewSession(session.id)}
                            title="View Details"
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </AnimateButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </MainCard>

      {/* Approval Modal */}
      <ApprovalModal
        open={approvalModal.open}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        type={approvalModal.type}
        sessionName={approvalModal.sessionName}
        isLoading={approvalModal.type === 'stop' ? isStopping : isDeleting}
      />
    </Box>
  );
};

export default Dashboard;
