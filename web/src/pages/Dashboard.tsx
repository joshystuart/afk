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
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  RestartAlt as RestartIcon,
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

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    sessions,
    isLoading,
    error,
    startSession,
    stopSession,
    restartSession,
    deleteSession,
    refetchSessions,
    clearError,
    isStarting,
    isStopping,
    isRestarting,
    isDeleting,
  } = useSession();

  const handleViewSession = (sessionId: string) => {
    navigate(ROUTES.getSessionDetails(sessionId));
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.RUNNING: return theme.palette.success.main;
      case SessionStatus.STOPPED: return theme.palette.grey[500];
      case SessionStatus.ERROR: return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusText = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.RUNNING: return 'RUNNING';
      case SessionStatus.STOPPED: return 'STOPPED';
      case SessionStatus.ERROR: return 'ERROR';
      default: return 'UNKNOWN';
    }
  };

  if (isLoading && sessions.length === 0) {
    return (
      <Box sx={{ p: 3, width: '100%' }}>
        <MainCard
          title="Remote Development Sessions"
          secondary={
            <AnimateButton>
              <Button
                component={Link}
                to={ROUTES.CREATE_SESSION}
                variant="contained"
                startIcon={<AddIcon />}
                disabled
              >
                Create Session
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
    <Box sx={{ p: 3, width: '100%' }}>
      {/* Header Card */}
      <MainCard
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TerminalIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h3">Remote Development Sessions</Typography>
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <AnimateButton>
              <IconButton onClick={() => refetchSessions()} size="small">
                <RefreshIcon />
              </IconButton>
            </AnimateButton>
            <AnimateButton>
              <Button
                component={Link}
                to={ROUTES.CREATE_SESSION}
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ minWidth: 140 }}
              >
                Create Session
              </Button>
            </AnimateButton>
          </Box>
        }
        sx={{ mb: 3 }}
      >
        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            onClose={clearError}
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

        {/* Empty State */}
        {sessions.length === 0 ? (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3
            }}
          >
            <TerminalIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
            <Box>
              <Typography variant="h4" sx={{ mb: 1 }}>
                No sessions yet
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Create your first development session to get started
              </Typography>
            </Box>
            <AnimateButton>
              <Button
                component={Link}
                to={ROUTES.CREATE_SESSION}
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                sx={{ px: 4 }}
              >
                Create Your First Session
              </Button>
            </AnimateButton>
          </Box>
        ) : (
          /* Sessions Table */
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Session</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Repository</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Terminal Access</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow 
                    key={session.id}
                    sx={{
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.02)'
                      }
                    }}
                  >
                    {/* Session Name */}
                    <TableCell>
                      <Box>
                        <Typography variant="h6" sx={{ fontFamily: 'monospace', mb: 0.5 }}>
                          {session.name || session.id.slice(0, 12)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {session.id}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Repository */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {session.repoUrl ? 
                          session.repoUrl.split('/').pop()?.replace('.git', '') : 
                          'No repository'
                        }
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
                            animation: 'pulse 2s infinite'
                          })
                        }}
                      />
                    </TableCell>

                    {/* Terminal Access */}
                    <TableCell>
                      {session.status === SessionStatus.RUNNING && session.terminalUrls ? (
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
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
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
                        {session.status === SessionStatus.STOPPED && (
                          <AnimateButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteSession(session.id)}
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
                              onClick={() => stopSession(session.id)}
                              disabled={isStopping}
                              color="warning"
                              sx={{ minWidth: 80 }}
                            >
                              {isStopping ? 'Stopping...' : 'Stop'}
                            </Button>
                          </AnimateButton>
                        )}

                        {/* Restart Button */}
                        {session.status === SessionStatus.RUNNING && (
                          <AnimateButton>
                            <IconButton
                              size="small"
                              onClick={() => restartSession(session.id)}
                              disabled={isRestarting}
                              title="Restart"
                            >
                              <RestartIcon />
                            </IconButton>
                          </AnimateButton>
                        )}

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
    </Box>
  );
};

export default Dashboard;