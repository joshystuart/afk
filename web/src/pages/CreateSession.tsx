import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { TerminalMode, type CreateSessionRequest } from '../api/types';
import { ROUTES, TERMINAL_MODE_LABELS } from '../utils/constants';
import { useSettingsStore } from '../stores/settings.store';

interface CreateSessionForm {
  name: string;
  repoUrl?: string;
  branch?: string;
  terminalMode: TerminalMode;
}

const CreateSession: React.FC = () => {
  const navigate = useNavigate();
  const { createSession, isCreating, createError, clearError } = useSession();
  const { settings, fetchSettings } = useSettingsStore();

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Check if required settings are missing
  const missingSettings = !settings?.sshPrivateKey || !settings?.claudeToken;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSessionForm>({
    defaultValues: {
      name: '',
      repoUrl: '',
      branch: 'main',
      terminalMode: TerminalMode.DUAL,
    },
  });

  const onSubmit = async (data: CreateSessionForm) => {
    try {
      clearError();
      const request: CreateSessionRequest = {
        name: data.name,
        repoUrl: data.repoUrl || undefined,
        branch: data.branch || undefined,
        terminalMode: data.terminalMode,
      };

      await createSession(request);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      // Error will be displayed via the error state from useSession
      console.error('Failed to create session:', err);
    }
  };

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          to={ROUTES.DASHBOARD}
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" component="h1">
          Create New Session
        </Typography>
      </Box>

      {createError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {createError.message || 'Failed to create session. Please try again.'}
        </Alert>
      )}

      {missingSettings && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Please configure your SSH Private Key and Claude Token in{' '}
            <Button
              component={Link}
              to={ROUTES.SETTINGS}
              variant="text"
              size="small"
              sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
            >
              Settings
            </Button>{' '}
            before creating a session.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Typography variant="h6" gutterBottom>
                Session Configuration
              </Typography>

              <Controller
                name="name"
                control={control}
                rules={{
                  required: 'Session name is required',
                  minLength: {
                    value: 3,
                    message: 'Name must be at least 3 characters',
                  },
                  maxLength: {
                    value: 50,
                    message: 'Name must be at most 50 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Session Name"
                    margin="normal"
                    helperText="A descriptive name for your session"
                    error={!!errors.name}
                  />
                )}
              />
              {errors.name && (
                <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                  {errors.name.message}
                </Typography>
              )}

              <Controller
                name="repoUrl"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Git Repository URL (Optional)"
                    margin="normal"
                    helperText="URL of the git repository to clone"
                    error={!!errors.repoUrl}
                  />
                )}
              />

              <Controller
                name="branch"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Git Branch (Optional)"
                    margin="normal"
                    helperText="Branch to checkout (defaults to main)"
                    error={!!errors.branch}
                  />
                )}
              />

              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Terminal Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                SSH keys and Claude tokens are now managed in{' '}
                <Link to={ROUTES.SETTINGS} style={{ textDecoration: 'none' }}>
                  Settings
                </Link>{' '}
                and will be automatically used for all sessions.
              </Typography>

              <Controller
                name="terminalMode"
                control={control}
                rules={{ required: 'Terminal mode is required' }}
                render={({ field }) => (
                  <FormControl
                    fullWidth
                    margin="normal"
                    error={!!errors.terminalMode}
                  >
                    <InputLabel>Terminal Mode</InputLabel>
                    <Select {...field} label="Terminal Mode">
                      {Object.entries(TERMINAL_MODE_LABELS).map(
                        ([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        ),
                      )}
                    </Select>
                    {errors.terminalMode && (
                      <Typography
                        variant="body2"
                        color="error"
                        sx={{ mt: 0.5 }}
                      >
                        {errors.terminalMode.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isCreating || missingSettings}
                  sx={{ minWidth: 120 }}
                >
                  {isCreating ? 'Creating...' : 'Create Session'}
                </Button>
                <Button
                  variant="outlined"
                  component={Link}
                  to={ROUTES.DASHBOARD}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Terminal Modes
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Claude Only
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Only Claude Code has access to the terminal
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Manual Only
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Only manual web terminal access
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Dual Terminal
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Both Claude Code and manual access available
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreateSession;
