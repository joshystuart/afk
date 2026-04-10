import React from 'react';
import { Box, TextField, Typography, Alert } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';
import { useIsElectronMac } from '../hooks/useElectron';
import { ROUTES } from '../utils/constants';
import { afkColors } from '../themes/afk';
import { PrimaryCtaButton } from '../components/PrimaryCtaButton';

interface SetupFormData {
  username: string;
  password: string;
  confirmPassword: string;
}

const Setup: React.FC = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();
  const isElectronMac = useIsElectronMac();
  const loginStore = useAuthStore((s) => s.login);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SetupFormData>({
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: SetupFormData) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await authApi.setup({
        username: data.username,
        password: data.password,
      });
      loginStore(response.token, {
        id: response.user.userId,
        name: response.user.username,
        email: `${response.user.username}@afk.local`,
      });
      navigate(ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.message || 'Failed to create admin account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: afkColors.background,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Electron Mac drag region */}
      {isElectronMac && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 38,
            WebkitAppRegion: 'drag',
            zIndex: 2,
          }}
        />
      )}

      {/* Dot grid background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle, ${afkColors.border} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          opacity: 0.5,
          animation: 'grid-fade 8s ease-in-out infinite',
        }}
      />

      {/* Setup card */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 380,
          mx: 2,
          border: `1px solid ${afkColors.border}`,
          borderRadius: '12px',
          bgcolor: afkColors.surface,
          p: 4,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Logo */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 700,
              fontSize: '2rem',
              color: afkColors.textPrimary,
              letterSpacing: '-0.03em',
              mb: 1,
            }}
          >
            AFK
          </Typography>
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.875rem',
              color: afkColors.textSecondary,
              fontWeight: 500,
              mb: 0.5,
            }}
          >
            Getting Started
          </Typography>
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.75rem',
              color: afkColors.textTertiary,
              fontWeight: 400,
            }}
          >
            Create your admin account
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="username"
            control={control}
            rules={{
              required: 'Username is required',
              minLength: {
                value: 3,
                message: 'Username must be at least 3 characters',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                placeholder="Username"
                type="text"
                error={!!errors.username}
                helperText={errors.username?.message}
                disabled={isLoading}
                sx={{
                  mb: 1.5,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: afkColors.background,
                  },
                }}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            rules={{
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                placeholder="Password"
                type="password"
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isLoading}
                sx={{
                  mb: 1.5,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: afkColors.background,
                  },
                }}
              />
            )}
          />

          <Controller
            name="confirmPassword"
            control={control}
            rules={{
              required: 'Please confirm your password',
              validate: (value) =>
                value === password || 'Passwords do not match',
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                placeholder="Confirm Password"
                type="password"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                disabled={isLoading}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: afkColors.background,
                  },
                }}
              />
            )}
          />

          <PrimaryCtaButton
            type="submit"
            fullWidth
            disabled={isLoading}
            sx={{
              py: 1.25,
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </PrimaryCtaButton>
        </Box>
      </Box>
    </Box>
  );
};

export { Setup };
