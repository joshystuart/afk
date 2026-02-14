import React from 'react';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth, type LoginCredentials } from '../hooks/useAuth';
import { ROUTES } from '../utils/constants';
import { afkColors } from '../themes/afk';

const Login: React.FC = () => {
  const [error, setError] = React.useState<string | null>(null);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setError(null);
      await login(data);
      navigate(ROUTES.DASHBOARD);
    } catch {
      setError('Invalid credentials. Please try again.');
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

      {/* Login card */}
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
              fontSize: '0.75rem',
              color: afkColors.textTertiary,
              fontWeight: 400,
            }}
          >
            {'> containerized claude code sessions'}
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
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: afkColors.background,
                  },
                }}
              />
            )}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{
              py: 1.25,
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
