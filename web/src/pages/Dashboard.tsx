import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  RestartAlt as RestartIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { SessionStatus, type Session } from '../api/types';
import { ROUTES, SESSION_STATUS_COLORS, SESSION_STATUS_LABELS, TERMINAL_MODE_LABELS } from '../utils/constants';

const Dashboard: React.FC = () => {
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

  const getStatusChip = (status: SessionStatus) => (
    <Chip
      label={SESSION_STATUS_LABELS[status]}
      size="small"
      sx={{
        backgroundColor: SESSION_STATUS_COLORS[status],
        color: 'white',
        fontWeight: 'medium',
      }}
    />
  );

  const getActionButtons = (session: Session) => {
    const canStart = session.status === SessionStatus.STOPPED;
    const canStop = session.status === SessionStatus.RUNNING;
    const canRestart = session.status === SessionStatus.RUNNING;
    const canDelete = (
      session.status === SessionStatus.STOPPED || 
      session.status === SessionStatus.ERROR
    );

    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <IconButton
          size="small"
          onClick={() => handleViewSession(session.id)}
          color="primary"
        >
          <ViewIcon />
        </IconButton>
        
        {canStart && (
          <IconButton
            size="small"
            onClick={() => startSession(session.id)}
            disabled={isStarting}
            color="success"
          >
            <PlayIcon />
          </IconButton>
        )}
        
        {canStop && (
          <IconButton
            size="small"
            onClick={() => stopSession(session.id)}
            disabled={isStopping}
            color="warning"
          >
            <StopIcon />
          </IconButton>
        )}
        
        {canRestart && (
          <IconButton
            size="small"
            onClick={() => restartSession(session.id)}
            disabled={isRestarting}
            color="info"
          >
            <RestartIcon />
          </IconButton>
        )}
        
        {canDelete && (
          <IconButton
            size="small"
            onClick={() => deleteSession(session.id)}
            disabled={isDeleting}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </Box>
    );
  };

  if (isLoading && sessions.length === 0) {
    return (
      <Box>
        <Skeleton variant="text" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Development Sessions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetchSessions()}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to={ROUTES.CREATE_SESSION}
          >
            Create Session
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={clearError}
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={12}>
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Session Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Repository</TableCell>
                    <TableCell>Mode</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="textSecondary">
                          No sessions found. Create your first session to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {session.name || session.id.slice(0, 8)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(session.status)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {session.repoUrl ? session.repoUrl.split('/').pop()?.replace('.git', '') : 'No repo'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {TERMINAL_MODE_LABELS[session.terminalMode]}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(session.createdAt).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getActionButtons(session)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;