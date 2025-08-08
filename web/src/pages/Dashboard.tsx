import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Alert,
  Skeleton,
  Grid,
  Container,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  RestartAlt as RestartIcon,
  Terminal as TerminalIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { SessionStatus } from '../api/types';
import { ROUTES } from '../utils/constants';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    sessions,
    isLoading,
    error,
    startSession,
    stopSession,
    restartSession,
    refetchSessions,
    clearError,
    isStarting,
    isStopping,
    isRestarting,
  } = useSession();

  const handleViewSession = (sessionId: string) => {
    navigate(ROUTES.getSessionDetails(sessionId));
  };

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.RUNNING: return '#10b981';
      case SessionStatus.STOPPED: return '#6b7280';
      case SessionStatus.ERROR: return '#ef4444';
      default: return '#6b7280';
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
      <Grid container direction="column" sx={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Remote Development Sessions
            </Typography>
            <Typography variant="body1">
              Welcome, Developer
            </Typography>
          </Box>
        </Grid>

        {/* Loading Content */}
        <Grid item xs sx={{ flex: 1 }}>
          <Container maxWidth={false} sx={{ p: 3 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item>
                <Skeleton variant="rectangular" width={200} height={40} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
              </Grid>
              <Grid item>
                <Skeleton variant="rectangular" width={120} height={40} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
              </Grid>
            </Grid>
            <Skeleton variant="rectangular" height="60vh" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
          </Container>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container direction="column" sx={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <Grid item xs={12}>
        <Box sx={{ 
          backgroundColor: '#3b82f6', 
          color: 'white', 
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Remote Development Sessions
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1">
              Welcome, Developer
            </Typography>
            <Button
              variant="outlined"
              sx={{ 
                color: 'white', 
                borderColor: 'white',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              LOGOUT
            </Button>
          </Box>
        </Box>
      </Grid>

      {/* Main Content */}
      <Grid item xs sx={{ flex: 1, overflow: 'auto', backgroundColor: '#2d2d2d' }}>
        <Container maxWidth={false}>
          {error && (
            <Alert
              severity="error"
              sx={{ 
                m: 3, 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
              onClose={clearError}
            >
              {error}
            </Alert>
          )}

          {sessions.length === 0 ? (
            <Grid container justifyContent="center" alignItems="center" sx={{ minHeight: '60vh' }}>
              <Grid item xs={12} sm={8} md={6} lg={4}>
                <Grid container direction="column" alignItems="center" spacing={2}>
                  <Grid item>
                    <Typography variant="h5" sx={{ mb: 2, color: '#a1a1aa', textAlign: 'center' }}>
                      No sessions yet
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body1" sx={{ mb: 4, color: '#a1a1aa', textAlign: 'center' }}>
                      Create your first development session to get started
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Button
                      component={Link}
                      to={ROUTES.CREATE_SESSION}
                      variant="contained"
                      size="large"
                      startIcon={<AddIcon />}
                      sx={{
                        backgroundColor: '#3b82f6',
                        '&:hover': { backgroundColor: '#2563eb' },
                        textTransform: 'none',
                        px: 4
                      }}
                    >
                      Create New Session
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          ) : (
            <Container maxWidth={false} sx={{ p: 3 }}>
              {/* Sessions Table */}
              <Grid container>
                <Grid item xs={12}>
                  <Box sx={{ 
                    backgroundColor: '#1a1a1a', 
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid #404040'
                  }}>
                    {sessions.map((session, index) => (
                      <Grid container key={session.id} sx={{
                        p: 3,
                        borderBottom: index < sessions.length - 1 ? '1px solid #404040' : 'none',
                        alignItems: 'center',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.02)'
                        }
                      }}>
                        {/* Session Info */}
                        <Grid item xs={12} md={8} lg={9}>
                          <Grid container spacing={4} alignItems="center">
                            {/* Name and Status */}
                            <Grid item xs={12} sm={6} md={4}>
                              <Typography variant="h6" sx={{ 
                                color: 'white',
                                fontFamily: 'monospace',
                                mb: 0.5
                              }}>
                                {session.name || session.id.slice(0, 12)}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  backgroundColor: getStatusColor(session.status),
                                  animation: session.status === SessionStatus.RUNNING ? 'pulse 2s infinite' : 'none'
                                }} />
                                <Typography variant="caption" sx={{ 
                                  color: getStatusColor(session.status),
                                  fontWeight: 600,
                                  letterSpacing: '0.5px'
                                }}>
                                  {getStatusText(session.status)}
                                </Typography>
                              </Box>
                            </Grid>

                            {/* Repository */}
                            <Grid item xs={12} sm={6} md={4}>
                              <Typography variant="body2" sx={{ color: '#a1a1aa', mb: 0.5 }}>
                                Repository
                              </Typography>
                              <Typography variant="body1" sx={{ color: 'white', fontFamily: 'monospace' }}>
                                {session.repoUrl ? session.repoUrl.split('/').pop()?.replace('.git', '') : 'No repository'}
                              </Typography>
                            </Grid>

                            {/* Terminal Access */}
                            {session.status === SessionStatus.RUNNING && session.terminalUrls && (
                              <Grid item xs={12} md={4}>
                                <Grid container spacing={1}>
                                  <Grid item>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      startIcon={<TerminalIcon />}
                                      href={session.terminalUrls.claude}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{
                                        backgroundColor: '#3b82f6',
                                        '&:hover': { backgroundColor: '#2563eb' },
                                        textTransform: 'none',
                                        fontWeight: 600
                                      }}
                                    >
                                      Open Claude Terminal
                                    </Button>
                                  </Grid>
                                  {session.terminalMode === 'DUAL' && (
                                    <Grid item>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<TerminalIcon />}
                                        href={session.terminalUrls.manual}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{
                                          borderColor: '#6b7280',
                                          color: '#a1a1aa',
                                          '&:hover': { 
                                            borderColor: '#9ca3af',
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                                          },
                                          textTransform: 'none'
                                        }}
                                      >
                                        Open Manual Terminal
                                      </Button>
                                    </Grid>
                                  )}
                                </Grid>
                              </Grid>
                            )}
                          </Grid>
                        </Grid>

                        {/* Actions */}
                        <Grid item xs={12} md={4} lg={3}>
                          <Grid container spacing={1} justifyContent="flex-end" alignItems="center">
                            {session.status === SessionStatus.STOPPED && (
                              <Grid item>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => startSession(session.id)}
                                  disabled={isStarting}
                                  sx={{
                                    backgroundColor: '#10b981',
                                    '&:hover': { backgroundColor: '#059669' },
                                    minWidth: 80,
                                    textTransform: 'none'
                                  }}
                                >
                                  {isStarting ? 'Starting...' : 'Start'}
                                </Button>
                              </Grid>
                            )}

                            {session.status === SessionStatus.RUNNING && (
                              <Grid>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => stopSession(session.id)}
                                  disabled={isStopping}
                                  sx={{
                                    backgroundColor: '#f59e0b',
                                    '&:hover': { backgroundColor: '#d97706' },
                                    minWidth: 80,
                                    textTransform: 'none'
                                  }}
                                >
                                  {isStopping ? 'Stopping...' : 'Stop'}
                                </Button>
                              </Grid>
                            )}

                            {session.status === SessionStatus.RUNNING && (
                              <Grid>
                                <IconButton
                                  size="small"
                                  onClick={() => restartSession(session.id)}
                                  disabled={isRestarting}
                                  sx={{ color: '#a1a1aa' }}
                                  title="Restart"
                                >
                                  <RestartIcon />
                                </IconButton>
                              </Grid>
                            )}

                            <Grid>
                              <IconButton
                                size="small"
                                onClick={() => refetchSessions()}
                                sx={{ color: '#a1a1aa' }}
                                title="Refresh"
                              >
                                <RefreshIcon />
                              </IconButton>
                            </Grid>

                            <Grid>
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => handleViewSession(session.id)}
                                sx={{
                                  color: '#60a5fa',
                                  '&:hover': { backgroundColor: 'rgba(96, 165, 250, 0.1)' },
                                  textTransform: 'none'
                                }}
                              >
                                View Details
                              </Button>
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Container>
          )}
        </Container>
      </Grid>
    </Grid>
  );
};

export default Dashboard;