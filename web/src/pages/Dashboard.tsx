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
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a' }}>
        {/* Header */}
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

        {/* Loading Content */}
        <Box sx={{ flex: 1, p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Skeleton variant="rectangular" width={200} height={40} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
            <Skeleton variant="rectangular" width={120} height={40} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
          </Box>
          <Skeleton variant="rectangular" height="60vh" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a' }}>
      {/* Header */}
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

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto', backgroundColor: '#2d2d2d' }}>
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
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '60vh',
            color: '#a1a1aa'
          }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              No sessions yet
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
              Create your first development session to get started
            </Typography>
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
          </Box>
        ) : (
          <Box sx={{ p: 3 }}>
            {/* Sessions Table */}
            <Box sx={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid #404040'
            }}>
              {sessions.map((session, index) => (
                <Box
                  key={session.id}
                  sx={{
                    p: 3,
                    borderBottom: index < sessions.length - 1 ? '1px solid #404040' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.02)'
                    }
                  }}
                >
                  {/* Session Info */}
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {/* Name and Status */}
                    <Box sx={{ minWidth: 200 }}>
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
                    </Box>

                    {/* Repository */}
                    <Box sx={{ minWidth: 250 }}>
                      <Typography variant="body2" sx={{ color: '#a1a1aa', mb: 0.5 }}>
                        Repository
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'white', fontFamily: 'monospace' }}>
                        {session.repoUrl ? session.repoUrl.split('/').pop()?.replace('.git', '') : 'No repository'}
                      </Typography>
                    </Box>

                    {/* Terminal Access */}
                    {session.status === SessionStatus.RUNNING && session.terminalUrls && (
                      <Box sx={{ minWidth: 300, display: 'flex', gap: 1 }}>
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
                        {session.terminalMode === 'DUAL' && (
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
                        )}
                      </Box>
                    )}
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {session.status === SessionStatus.STOPPED && (
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
                    )}

                    {session.status === SessionStatus.RUNNING && (
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
                    )}

                    {session.status === SessionStatus.RUNNING && (
                      <IconButton
                        size="small"
                        onClick={() => restartSession(session.id)}
                        disabled={isRestarting}
                        sx={{ color: '#a1a1aa' }}
                        title="Restart"
                      >
                        <RestartIcon />
                      </IconButton>
                    )}

                    <IconButton
                      size="small"
                      onClick={() => refetchSessions()}
                      sx={{ color: '#a1a1aa' }}
                      title="Refresh"
                    >
                      <RefreshIcon />
                    </IconButton>

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
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;