import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { TerminalMode, type CreateSessionRequest } from '../api/types';
import { ROUTES, TERMINAL_MODE_LABELS } from '../utils/constants';
import { useSettingsStore } from '../stores/settings.store';
import { afkColors } from '../themes/afk';

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

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const missingSettings = !settings?.hasSshPrivateKey || !settings?.claudeToken;

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
      console.error('Failed to create session:', err);
    }
  };

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: 640 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          to={ROUTES.DASHBOARD}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ mb: 2, color: afkColors.textSecondary }}
        >
          Back
        </Button>
        <Typography variant="h3">New Session</Typography>
      </Box>

      {createError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {createError.message || 'Failed to create session. Please try again.'}
        </Alert>
      )}

      {missingSettings && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Configure your SSH Key and Claude Token in{' '}
            <Link to={ROUTES.SETTINGS}>Settings</Link> before creating a
            session.
          </Typography>
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        {/* Repository section */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              borderLeft: `2px solid ${afkColors.accent}`,
              pl: 2,
              mb: 2.5,
            }}
          >
            <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
              Session Details
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                  helperText={
                    errors.name?.message ||
                    'A descriptive name for your session'
                  }
                  error={!!errors.name}
                />
              )}
            />

            <Controller
              name="repoUrl"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Git Repository URL"
                  helperText="Optional. SSH URL of the git repository to clone"
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
                  label="Branch"
                  helperText="Defaults to main"
                  error={!!errors.branch}
                />
              )}
            />
          </Box>
        </Box>

        {/* Terminal section */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              borderLeft: `2px solid ${afkColors.accent}`,
              pl: 2,
              mb: 2.5,
            }}
          >
            <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
              Terminal Configuration
            </Typography>
          </Box>

          <Controller
            name="terminalMode"
            control={control}
            rules={{ required: 'Terminal mode is required' }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.terminalMode}>
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
              </FormControl>
            )}
          />

          {/* Inline help instead of sidebar card */}
          <Box sx={{ mt: 1.5 }}>
            <Typography
              variant="body2"
              sx={{ color: afkColors.textTertiary, fontSize: '0.75rem' }}
            >
              <strong>Simple</strong> &mdash; Claude Code terminal only.{' '}
              <strong>Dual</strong> &mdash; Claude Code + manual web terminal.
            </Typography>
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isCreating || missingSettings}
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
    </Box>
  );
};

export default CreateSession;
