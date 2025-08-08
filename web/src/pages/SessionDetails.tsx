import React from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    IconButton,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Delete as DeleteIcon,
    OpenInNew as OpenInNewIcon,
    PlayArrow as PlayIcon,
    Refresh as RefreshIcon,
    RestartAlt as RestartIcon,
    Stop as StopIcon,
    Terminal as TerminalIcon,
} from '@mui/icons-material';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {useSession} from '../hooks/useSession';
import {useWebSocket} from '../hooks/useWebSocket';
import {SessionStatus} from '../api/types';
import {ROUTES, SESSION_STATUS_COLORS, SESSION_STATUS_LABELS, TERMINAL_MODE_LABELS} from '../utils/constants';

const SessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { subscribeToSession, unsubscribeFromSession } = useWebSocket();
  
  const {
    isLoading,
    error,
    startSession,
    stopSession,
    restartSession,
    deleteSession,
    getSession,
    clearError,
    isStarting,
    isStopping,
    isRestarting,
    isDeleting,
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

  if (!sessionQuery?.data && !sessionQuery?.isLoading) {
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

  if (!sessionQuery?.data) {
    return (
      <Box>
        <Skeleton variant="text" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  const session = sessionQuery.data;
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

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        <Box sx={{ flex: { lg: 1 } }}>
          <Paper sx={{ p: 2 }}>
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
            <Paper sx={{ p: 2, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Terminal Access
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Live Terminals
                </Typography>
                
                {session.terminalMode === 'DUAL' ? (
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Claude Terminal
                      </Typography>
                      <Box
                        component="iframe"
                        src={session.terminalUrls.claude}
                        sx={{
                          width: '100%',
                          height: '600px',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          backgroundColor: 'background.paper',
                        }}
                        title="Claude Terminal"
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Manual Terminal
                      </Typography>
                      <Box
                        component="iframe"
                        src={session.terminalUrls.manual}
                        sx={{
                          width: '100%',
                          height: '600px',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          backgroundColor: 'background.paper',
                        }}
                        title="Manual Terminal"
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Claude Terminal
                    </Typography>
                    <Box
                      component="iframe"
                      src={session.terminalUrls.claude}
                      sx={{
                        width: '100%',
                        height: '700px',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: 'background.paper',
                      }}
                      title="Claude Terminal"
                    />
                  </Box>
                )}
              </Box>
            </Paper>
          )}
        </Box>

        <Box sx={{ flex: { lg: 2 } }}>
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
        </Box>
      </Box>
    </Box>
  );
};

export default SessionDetails;