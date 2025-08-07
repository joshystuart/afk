import React from 'react';
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
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { TerminalMode, type CreateSessionRequest } from '../api/types';
import { ROUTES, DEFAULT_DOCKER_IMAGES, TERMINAL_MODE_LABELS } from '../utils/constants';

interface CreateSessionForm {
  image: string;
  mode: TerminalMode;
  workspacePath?: string;
}

const CreateSession: React.FC = () => {
  const navigate = useNavigate();
  const { createSession, isCreating, error, clearError } = useSession();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateSessionForm>({
    defaultValues: {
      image: DEFAULT_DOCKER_IMAGES[0].value,
      mode: TerminalMode.DUAL,
      workspacePath: '/workspace',
    },
  });

  const selectedImage = watch('image');
  const selectedImageInfo = DEFAULT_DOCKER_IMAGES.find(img => img.value === selectedImage);

  const onSubmit = async (data: CreateSessionForm) => {
    try {
      clearError();
      const request: CreateSessionRequest = {
        config: {
          image: data.image,
          mode: data.mode,
          workspacePath: data.workspacePath || undefined,
        },
      };
      
      await createSession(request);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      // Error is handled by the useSession hook
    }
  };

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
        <Typography variant="h4" component="h1">
          Create New Session
        </Typography>
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
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Typography variant="h6" gutterBottom>
                Session Configuration
              </Typography>

              <Controller
                name="image"
                control={control}
                rules={{ required: 'Docker image is required' }}
                render={({ field }) => (
                  <FormControl fullWidth margin="normal" error={!!errors.image}>
                    <InputLabel>Docker Image</InputLabel>
                    <Select {...field} label="Docker Image">
                      {DEFAULT_DOCKER_IMAGES.map((image) => (
                        <MenuItem key={image.value} value={image.value}>
                          {image.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.image && (
                      <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                        {errors.image.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              <Controller
                name="mode"
                control={control}
                rules={{ required: 'Terminal mode is required' }}
                render={({ field }) => (
                  <FormControl fullWidth margin="normal" error={!!errors.mode}>
                    <InputLabel>Terminal Mode</InputLabel>
                    <Select {...field} label="Terminal Mode">
                      {Object.entries(TERMINAL_MODE_LABELS).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.mode && (
                      <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                        {errors.mode.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              <Controller
                name="workspacePath"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Workspace Path (Optional)"
                    margin="normal"
                    helperText="Path inside the container where your code will be mounted"
                    error={!!errors.workspacePath}
                  />
                )}
              />

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isCreating}
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
                Image Information
              </Typography>
              {selectedImageInfo && (
                <Box>
                  <Typography variant="body1" fontWeight="medium" gutterBottom>
                    {selectedImageInfo.label}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {selectedImageInfo.description}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" fontFamily="monospace">
                    {selectedImageInfo.value}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
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