import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Check as CheckIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  DeleteOutline as DeleteOutlineIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useSettingsStore } from '../../stores/settings.store';
import { useDockerImagesStore } from '../../stores/docker-images.store';
import type { UpdateSettingsRequest } from '../../api/types';
import { afkColors } from '../../themes/afk';

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Box
    sx={{
      borderLeft: `2px solid ${afkColors.accent}`,
      pl: 2,
      mb: 2.5,
    }}
  >
    <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
      {title}
    </Typography>
  </Box>
);

const DockerSettings: React.FC = () => {
  const { settings, error, updateSettings, clearError } = useSettingsStore();

  const {
    images,
    loading: imagesLoading,
    error: imagesError,
    fetchImages,
    addImage,
    installImage,
    removeImage,
    setDefault: setDefaultImage,
    retryPull,
    pollStatus,
    clearError: clearImagesError,
  } = useDockerImagesStore();

  const [formData, setFormData] = useState({
    dockerSocketPath: '',
    dockerStartPort: '',
    dockerEndPort: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newImageName, setNewImageName] = useState('');
  const [newImageRef, setNewImageRef] = useState('');
  const [addingImage, setAddingImage] = useState(false);
  const pollIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(
    new Map(),
  );

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    if (settings) {
      setFormData({
        dockerSocketPath: settings.dockerSocketPath || '',
        dockerStartPort: settings.dockerStartPort?.toString() || '',
        dockerEndPort: settings.dockerEndPort?.toString() || '',
      });
    }
  }, [settings]);

  const startPolling = useCallback(
    (imageId: string) => {
      if (pollIntervalsRef.current.has(imageId)) return;
      const interval = setInterval(async () => {
        await pollStatus(imageId);
        const img = useDockerImagesStore
          .getState()
          .images.find((i) => i.id === imageId);
        if (img && img.status !== 'PULLING') {
          clearInterval(interval);
          pollIntervalsRef.current.delete(imageId);
        }
      }, 3000);
      pollIntervalsRef.current.set(imageId, interval);
    },
    [pollStatus],
  );

  useEffect(() => {
    images
      .filter((img) => img.status === 'PULLING')
      .forEach((img) => startPolling(img.id));
  }, [images, startPolling]);

  useEffect(() => {
    return () => {
      pollIntervalsRef.current.forEach((interval) => clearInterval(interval));
      pollIntervalsRef.current.clear();
    };
  }, []);

  const handleAddImage = async () => {
    if (!newImageName.trim() || !newImageRef.trim()) return;
    setAddingImage(true);
    try {
      const created = await addImage({
        name: newImageName.trim(),
        image: newImageRef.trim(),
      });
      setNewImageName('');
      setNewImageRef('');
      setShowAddForm(false);
      startPolling(created.id);
    } catch {
      // Error handled by store
    } finally {
      setAddingImage(false);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await retryPull(id);
      startPolling(id);
    } catch {
      // Error handled by store
    }
  };

  const handleInstall = async (id: string) => {
    try {
      await installImage(id);
      startPolling(id);
    } catch {
      // Error handled by store
    }
  };

  const handleInputChange =
    (field: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
      if (successMessage) setSuccessMessage('');
      if (error) clearError();
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveLoading(true);
    setSuccessMessage('');

    try {
      const submitData: UpdateSettingsRequest = {
        dockerSocketPath: formData.dockerSocketPath || undefined,
        dockerStartPort: formData.dockerStartPort
          ? parseInt(formData.dockerStartPort, 10)
          : undefined,
        dockerEndPort: formData.dockerEndPort
          ? parseInt(formData.dockerEndPort, 10)
          : undefined,
      };
      await updateSettings(submitData);
      setSuccessMessage('Docker settings saved.');
    } catch {
      // Error handled by store
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <>
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert
          severity="success"
          icon={<CheckIcon fontSize="small" />}
          onClose={() => setSuccessMessage('')}
          sx={{ mb: 3 }}
        >
          {successMessage}
        </Alert>
      )}

      {/* Docker Connection Settings */}
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 4 }}>
          <SectionHeader title="Docker Connection" />
          <TextField
            fullWidth
            label="Socket Path"
            value={formData.dockerSocketPath}
            onChange={handleInputChange('dockerSocketPath')}
            placeholder="/var/run/docker.sock"
            helperText="Path to the Docker daemon socket."
            sx={{
              mb: 2,
              '& .MuiInputBase-input': {
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.8125rem',
              },
            }}
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <SectionHeader title="Port Range" />
          <Typography
            variant="caption"
            sx={{
              color: afkColors.textTertiary,
              mb: 2,
              display: 'block',
            }}
          >
            Range of host ports allocated to Docker containers.
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              label="Start Port"
              type="number"
              value={formData.dockerStartPort}
              onChange={handleInputChange('dockerStartPort')}
              placeholder="7681"
              helperText="First port in the range"
              inputProps={{ min: 1024, max: 65535 }}
            />
            <TextField
              fullWidth
              label="End Port"
              type="number"
              value={formData.dockerEndPort}
              onChange={handleInputChange('dockerEndPort')}
              placeholder="7780"
              helperText="Last port in the range"
              inputProps={{ min: 1024, max: 65535 }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={
              saveLoading ? (
                <CircularProgress size={16} sx={{ color: 'inherit' }} />
              ) : (
                <SaveIcon sx={{ fontSize: '18px !important' }} />
              )
            }
            disabled={saveLoading}
          >
            {saveLoading ? 'Saving...' : 'Save Docker Settings'}
          </Button>
        </Box>
      </form>

      {/* Docker Images */}
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2.5,
          }}
        >
          <SectionHeader title="Docker Images" />
          <Button
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => setShowAddForm(true)}
            sx={{ fontSize: '0.75rem', flexShrink: 0 }}
          >
            Add Image
          </Button>
        </Box>

        {imagesError && (
          <Alert severity="error" onClose={clearImagesError} sx={{ mb: 2 }}>
            {imagesError}
          </Alert>
        )}

        {showAddForm && (
          <Box
            sx={{
              p: 2,
              mb: 2,
              border: `1px solid ${afkColors.border}`,
              borderRadius: 1,
              bgcolor: afkColors.surfaceElevated,
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
                mb: 2,
              }}
            >
              <TextField
                fullWidth
                size="small"
                label="Display Name"
                value={newImageName}
                onChange={(e) => setNewImageName(e.target.value)}
                placeholder="e.g. My Custom Image"
              />
              <TextField
                fullWidth
                size="small"
                label="Image Reference"
                value={newImageRef}
                onChange={(e) => setNewImageRef(e.target.value)}
                placeholder="e.g. ubuntu:22.04"
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.8125rem',
                  },
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                size="small"
                onClick={() => {
                  setShowAddForm(false);
                  setNewImageName('');
                  setNewImageRef('');
                }}
                sx={{ fontSize: '0.75rem', color: afkColors.textSecondary }}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleAddImage}
                disabled={
                  addingImage || !newImageName.trim() || !newImageRef.trim()
                }
                startIcon={
                  addingImage ? (
                    <CircularProgress size={14} sx={{ color: 'inherit' }} />
                  ) : null
                }
                sx={{ fontSize: '0.75rem' }}
              >
                {addingImage ? 'Adding...' : 'Add'}
              </Button>
            </Box>
          </Box>
        )}

        {imagesLoading && images.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={20} />
          </Box>
        ) : (
          <>
            {/* Installed Images */}
            {images.filter((img) => img.status !== 'NOT_PULLED').length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: afkColors.textTertiary,
                    fontSize: '0.6875rem',
                    letterSpacing: '0.08em',
                    mb: 1,
                    display: 'block',
                  }}
                >
                  Installed
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {images
                    .filter((img) => img.status !== 'NOT_PULLED')
                    .map((img) => (
                      <Box
                        key={img.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          border: `1px solid ${img.isDefault ? afkColors.accent : afkColors.border}`,
                          borderRadius: 1,
                          bgcolor: afkColors.surfaceElevated,
                          transition: 'border-color 150ms ease',
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: afkColors.textPrimary,
                                fontWeight: 500,
                              }}
                            >
                              {img.name}
                            </Typography>
                            {img.isDefault && (
                              <Chip
                                label="Default"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.625rem',
                                  bgcolor: afkColors.accentMuted,
                                  color: afkColors.accent,
                                }}
                              />
                            )}
                            {img.isBuiltIn && (
                              <Chip
                                label="Built-in"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.625rem',
                                  bgcolor: 'rgba(255, 255, 255, 0.06)',
                                  color: afkColors.textTertiary,
                                }}
                              />
                            )}
                            <Chip
                              label={img.status}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.625rem',
                                bgcolor:
                                  img.status === 'AVAILABLE'
                                    ? afkColors.accentMuted
                                    : img.status === 'PULLING'
                                      ? afkColors.warningMuted
                                      : afkColors.dangerMuted,
                                color:
                                  img.status === 'AVAILABLE'
                                    ? afkColors.accent
                                    : img.status === 'PULLING'
                                      ? afkColors.warning
                                      : afkColors.danger,
                              }}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: afkColors.textTertiary,
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: '0.6875rem',
                            }}
                          >
                            {img.image}
                          </Typography>
                          {img.status === 'ERROR' && img.errorMessage && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: afkColors.danger,
                                display: 'block',
                                mt: 0.25,
                              }}
                            >
                              {img.errorMessage}
                            </Typography>
                          )}
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            flexShrink: 0,
                          }}
                        >
                          {img.status === 'PULLING' && (
                            <CircularProgress size={16} sx={{ mr: 0.5 }} />
                          )}
                          {img.status === 'ERROR' && (
                            <Tooltip title="Retry pull">
                              <IconButton
                                size="small"
                                onClick={() => handleRetry(img.id)}
                                sx={{ color: afkColors.warning }}
                              >
                                <RefreshIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {!img.isDefault && img.status === 'AVAILABLE' && (
                            <Tooltip title="Set as default">
                              <IconButton
                                size="small"
                                onClick={() => setDefaultImage(img.id)}
                                sx={{ color: afkColors.textTertiary }}
                              >
                                <StarBorderIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {img.isDefault && (
                            <Tooltip title="Default image">
                              <StarIcon
                                sx={{
                                  fontSize: 18,
                                  color: afkColors.accent,
                                  mx: 0.5,
                                }}
                              />
                            </Tooltip>
                          )}
                          {img.isBuiltIn && !img.isDefault && (
                            <Tooltip title="Uninstall">
                              <IconButton
                                size="small"
                                onClick={() => removeImage(img.id)}
                                sx={{
                                  color: afkColors.textTertiary,
                                  '&:hover': { color: afkColors.danger },
                                }}
                              >
                                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {!img.isBuiltIn && (
                            <Tooltip title="Remove image">
                              <IconButton
                                size="small"
                                onClick={() => removeImage(img.id)}
                                disabled={img.isDefault}
                                sx={{
                                  color: afkColors.textTertiary,
                                  '&:hover': { color: afkColors.danger },
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    ))}
                </Box>
              </Box>
            )}

            {/* Available to Install */}
            {images.filter((img) => img.status === 'NOT_PULLED').length > 0 && (
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    color: afkColors.textTertiary,
                    fontSize: '0.6875rem',
                    letterSpacing: '0.08em',
                    mb: 1,
                    display: 'block',
                  }}
                >
                  Available to Install
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {images
                    .filter((img) => img.status === 'NOT_PULLED')
                    .map((img) => (
                      <Box
                        key={img.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          border: `1px solid ${afkColors.border}`,
                          borderRadius: 1,
                          bgcolor: afkColors.surfaceElevated,
                          opacity: 0.75,
                          transition: 'opacity 150ms ease',
                          '&:hover': { opacity: 1 },
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: afkColors.textPrimary,
                                fontWeight: 500,
                              }}
                            >
                              {img.name}
                            </Typography>
                            {img.isBuiltIn && (
                              <Chip
                                label="Built-in"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.625rem',
                                  bgcolor: 'rgba(255, 255, 255, 0.06)',
                                  color: afkColors.textTertiary,
                                }}
                              />
                            )}
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: afkColors.textTertiary,
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: '0.6875rem',
                            }}
                          >
                            {img.image}
                          </Typography>
                        </Box>

                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                          onClick={() => handleInstall(img.id)}
                          sx={{
                            fontSize: '0.75rem',
                            flexShrink: 0,
                            borderColor: afkColors.border,
                            color: afkColors.textPrimary,
                            '&:hover': {
                              borderColor: afkColors.accent,
                              color: afkColors.accent,
                            },
                          }}
                        >
                          Install
                        </Button>
                      </Box>
                    ))}
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </>
  );
};

export { DockerSettings };
