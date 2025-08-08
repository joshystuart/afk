import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  RestartAlt as RestartIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  Terminal as TerminalIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { useWebSocket } from '../hooks/useWebSocket';
import { SessionStatus } from '../api/types';
import { ROUTES, SESSION_STATUS_COLORS, SESSION_STATUS_LABELS, TERMINAL_MODE_LABELS } from '../utils/constants';

const SessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { subscribeToSession, unsubscribeFromSession } = useWebSocket();
  
  const {
    currentSession,
    isLoading,
    error,
    startSession,
    stopSession,
    restartSession,
    deleteSession,
    getSession,
    setCurrentSession,
    clearError,
    isStarting,
    isStopping,
    isRestarting,
    isDeleting,
  } = useSession();

  // Get session data
  const sessionQuery = id ? getSession(id) : null;

  React.useEffect(() => {
    if (id && sessionQuery?.data) {
      setCurrentSession(sessionQuery.data);
      subscribeToSession(id);
    }

    return () => {
      if (id) {
        unsubscribeFromSession(id);
      }
    };
  }, [id, sessionQuery?.data, setCurrentSession, subscribeToSession, unsubscribeFromSession]);

  const handleDelete = async () => {
    if (id && window.confirm('Are you sure you want to delete this session?')) {
      await deleteSession(id);
      navigate(ROUTES.DASHBOARD);
    }
  };

  const getStatusChip = (status: SessionStatus) => (
    <Chip
      label={SESSION_STATUS_LABELS[status]}
      sx={{
        backgroundColor: SESSION_STATUS_COLORS[status],
        color: 'white',
        fontWeight: 'medium',
      }}
    />
  );

  if (isLoading || sessionQuery?.isLoading) {
    return (
      <Box>
        <Skeleton variant="text" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (!currentSession && !sessionQuery?.isLoading) {
    return (
      <Box>
        <Button
          component={Link}
          to={ROUTES.DASHBOARD}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
        <Alert severity="error">
          Session not found or failed to load.
        </Alert>
      </Box>
    );
  }

  if (!currentSession) {
    return (
      <Box>
        <Skeleton variant="text" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  const session = currentSession;
  const canStart = session.status === SessionStatus.STOPPED;
  const canStop = session.status === SessionStatus.RUNNING;
  const canRestart = session.status === SessionStatus.RUNNING;
  const canDelete = (
    session.status === SessionStatus.STOPPED || 
    session.status === SessionStatus.ERROR
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          to={ROUTES.DASHBOARD}
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Session Details
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={() => sessionQuery?.refetch()}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
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
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Session Information
              </Typography>
              {getStatusChip(session.status)}
            </Box>

            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                      Session Name
                    </TableCell>
                    <TableCell>{session.name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                      Session ID
                    </TableCell>
                    <TableCell>
                      <Typography fontFamily="monospace">
                        {session.id}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                      Repository
                    </TableCell>
                    <TableCell>{session.repoUrl || 'No repository'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                      Branch
                    </TableCell>
                    <TableCell>{session.branch}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                      Terminal Mode
                    </TableCell>
                    <TableCell>{TERMINAL_MODE_LABELS[session.terminalMode]}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                      Claude Port
                    </TableCell>
                    <TableCell>
                      {session.ports?.claude || 'Not assigned'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                      Manual Port
                    </TableCell>
                    <TableCell>
                      {session.ports?.manual || 'Not assigned'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                      Created
                    </TableCell>
                    <TableCell>{new Date(session.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                      Last Updated
                    </TableCell>
                    <TableCell>{new Date(session.updatedAt).toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {session.terminalUrls && session.status === SessionStatus.RUNNING && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Terminal Access
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<TerminalIcon />}
                  endIcon={<OpenInNewIcon />}
                  href={session.terminalUrls.claude}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Claude Terminal
                </Button>
                {session.terminalMode === 'DUAL' && (
                  <Button
                    variant="outlined"
                    startIcon={<TerminalIcon />}
                    endIcon={<OpenInNewIcon />}
                    href={session.terminalUrls.manual}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Manual Terminal
                  </Button>
                )}
              </Box>
            </Paper>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {canStart && (
                  <Button
                    variant="contained"
                    startIcon={<PlayIcon />}
                    onClick={() => startSession(session.id)}
                    disabled={isStarting}
                    color="success"
                  >
                    {isStarting ? 'Starting...' : 'Start Session'}
                  </Button>
                )}
                
                {canStop && (
                  <Button
                    variant="contained"
                    startIcon={<StopIcon />}
                    onClick={() => stopSession(session.id)}
                    disabled={isStopping}
                    color="warning"
                  >
                    {isStopping ? 'Stopping...' : 'Stop Session'}
                  </Button>
                )}
                
                {canRestart && (
                  <Button
                    variant="outlined"
                    startIcon={<RestartIcon />}
                    onClick={() => restartSession(session.id)}
                    disabled={isRestarting}
                    color="info"
                  >
                    {isRestarting ? 'Restarting...' : 'Restart Session'}
                  </Button>
                )}
                
                {canDelete && (
                  <Button
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    onClick={handleDelete}
                    disabled={isDeleting}
                    color="error"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Session'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SessionDetails;