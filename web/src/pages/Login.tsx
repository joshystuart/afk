import React from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
} from '@mui/material';
import { Terminal as TerminalIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth, type LoginCredentials } from '../hooks/useAuth';
import { ROUTES } from '../utils/constants';

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
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 3,
                justifyContent: 'center',
              }}
            >
              <TerminalIcon
                sx={{ fontSize: 40, mr: 2, color: 'primary.main' }}
              />
              <Typography variant="h4" component="h1" color="primary">
                AFK Server
              </Typography>
            </Box>

            <Typography variant="h6" align="center" gutterBottom>
              Sign in to your account
            </Typography>

            <Typography
              variant="body2"
              align="center"
              color="textSecondary"
              sx={{ mb: 3 }}
            >
              Access your remote development sessions
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ mt: 2 }}
            >
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
                    label="Username"
                    type="text"
                    margin="normal"
                    error={!!errors.username}
                    helperText={errors.username?.message}
                    disabled={isLoading}
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
                    label="Password"
                    type="password"
                    margin="normal"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    disabled={isLoading}
                  />
                )}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Login;
