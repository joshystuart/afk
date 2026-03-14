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
  Tabs,
  Tab,
} from '@mui/material';
import {
  Save as SaveIcon,
  Check as CheckIcon,
  Lock as LockIcon,
  GitHub as GitHubIcon,
  LinkOff as LinkOffIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  DeleteOutline as DeleteOutlineIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useSettingsStore } from '../stores/settings.store';
import { useDockerImagesStore } from '../stores/docker-images.store';
import { useGitHub } from '../hooks/useGitHub';
import type { UpdateSettingsRequest } from '../api/types';
import { afkColors } from '../themes/afk';
import { useSearchParams } from 'react-router-dom';

const Settings: React.FC = () => {
  const {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    clearError,
  } = useSettingsStore();

  const { isConnected, username, authUrl, disconnect, isDisconnecting } =
    useGitHub();

  const [searchParams, setSearchParams] = useSearchParams();

  const [formData, setFormData] = useState<UpdateSettingsRequest>({
    sshPrivateKey: '',
    claudeToken: '',
    gitUserName: '',
    gitUserEmail: '',
    defaultMountDirectory: '',
  });

  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditingSshKey, setIsEditingSshKey] = useState(false);
  const [sshKeyModified, setSshKeyModified] = useState(false);
  const [isEditingClaudeToken, setIsEditingClaudeToken] = useState(false);
  const [claudeTokenModified, setClaudeTokenModified] = useState(false);

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

  const [showAddForm, setShowAddForm] = useState(false);
  const [newImageName, setNewImageName] = useState('');
  const [newImageRef, setNewImageRef] = useState('');
  const [addingImage, setAddingImage] = useState(false);
  const pollIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(
    new Map(),
  );

  useEffect(() => {
    fetchSettings();
    fetchImages();
  }, [fetchSettings, fetchImages]);

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

  // Handle GitHub OAuth redirect
  useEffect(() => {
    const githubParam = searchParams.get('github');
    if (githubParam === 'connected') {
      setSuccessMessage('GitHub connected successfully!');
      fetchSettings();
      // Clean up URL params
      searchParams.delete('github');
      setSearchParams(searchParams, { replace: true });
    } else if (githubParam === 'error') {
      clearError();
      setSuccessMessage('');
      // We'll show this as an error through the existing error mechanism
      searchParams.delete('github');
      searchParams.delete('reason');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, fetchSettings, clearError]);

  useEffect(() => {
    if (settings) {
      setFormData({
        sshPrivateKey: '',
        claudeToken: '',
        gitUserName: settings.gitUserName || '',
        gitUserEmail: settings.gitUserEmail || '',
        defaultMountDirectory: settings.defaultMountDirectory || '',
      });
      setIsEditingSshKey(false);
      setSshKeyModified(false);
      setIsEditingClaudeToken(false);
      setClaudeTokenModified(false);
    }
  }, [settings]);

  const handleInputChange =
    (field: keyof UpdateSettingsRequest) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
      if (successMessage) setSuccessMessage('');
      if (error) clearError();
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveLoading(true);
    setSuccessMessage('');

    try {
      const submitData: UpdateSettingsRequest = { ...formData };
      // Only include sshPrivateKey if the user actually entered a new one
      if (!sshKeyModified) {
        delete submitData.sshPrivateKey;
      }
      // Only include claudeToken if the user actually entered a new one
      if (!claudeTokenModified) {
        delete submitData.claudeToken;
      }
      await updateSettings(submitData);
      setSuccessMessage('Settings saved successfully!');
    } catch {
      // Error is handled by the store
    } finally {
      setSaveLoading(false);
    }
  };

  const handleClear = (field: keyof UpdateSettingsRequest) => {
    setFormData((prev) => ({
      ...prev,
      [field]: '',
    }));
  };

  if (loading && !settings) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  const activeTab = searchParams.get('tab') === 'images' ? 1 : 0;
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    const next = new URLSearchParams(searchParams);
    if (newValue === 1) {
      next.set('tab', 'images');
    } else {
      next.delete('tab');
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: 640 }}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="h3">Settings</Typography>
        <Typography
          variant="body2"
          sx={{ color: afkColors.textSecondary, mt: 1 }}
        >
          Global settings used for all new sessions.
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          mb: 3,
          borderBottom: `1px solid ${afkColors.border}`,
          minHeight: 36,
          '& .MuiTab-root': { minHeight: 36, py: 1 },
        }}
      >
        <Tab label="General" />
        <Tab label="Docker Images" />
      </Tabs>

      {activeTab === 0 && (
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

          <form onSubmit={handleSubmit}>
            {/* Workspace */}
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  borderLeft: `2px solid ${afkColors.accent}`,
                  pl: 2,
                  mb: 2.5,
                }}
              >
                <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
                  Workspace
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Default Mount Directory"
                value={formData.defaultMountDirectory}
                onChange={handleInputChange('defaultMountDirectory')}
                placeholder="/Users/josh/afk-workspaces"
                helperText="Base directory on the host for mounting session workspaces. When set, sessions can bind-mount their workspace to this directory."
              />
            </Box>

            {/* Git Configuration */}
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  borderLeft: `2px solid ${afkColors.accent}`,
                  pl: 2,
                  mb: 2.5,
                }}
              >
                <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
                  Git Configuration
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Git User Name"
                    value={formData.gitUserName}
                    onChange={handleInputChange('gitUserName')}
                    placeholder="Your Name"
                    helperText="Default git user name for commits"
                  />
                  <TextField
                    fullWidth
                    label="Git User Email"
                    type="email"
                    value={formData.gitUserEmail}
                    onChange={handleInputChange('gitUserEmail')}
                    placeholder="your.email@example.com"
                    helperText="Default git user email for commits"
                  />
                </Box>
              </Box>
            </Box>

            {/* GitHub Connection */}
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  borderLeft: `2px solid ${afkColors.accent}`,
                  pl: 2,
                  mb: 2.5,
                }}
              >
                <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
                  GitHub Connection
                </Typography>
              </Box>

              {isConnected ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 2,
                    border: `1px solid ${afkColors.border}`,
                    borderRadius: 1,
                    bgcolor: afkColors.surfaceElevated,
                  }}
                >
                  <GitHubIcon
                    sx={{ fontSize: 20, color: afkColors.textPrimary }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: afkColors.textPrimary, fontWeight: 500 }}
                      >
                        {username}
                      </Typography>
                      <Chip
                        label="Connected"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.6875rem',
                          bgcolor: afkColors.accentMuted,
                          color: afkColors.accent,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ color: afkColors.textTertiary }}
                    >
                      You can browse and select repositories when creating
                      sessions
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={
                      isDisconnecting ? (
                        <CircularProgress size={14} sx={{ color: 'inherit' }} />
                      ) : (
                        <LinkOffIcon sx={{ fontSize: 16 }} />
                      )
                    }
                    onClick={() => disconnect()}
                    disabled={isDisconnecting}
                    sx={{
                      fontSize: '0.75rem',
                      color: afkColors.danger,
                      '&:hover': { bgcolor: afkColors.dangerMuted },
                    }}
                  >
                    Disconnect
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<GitHubIcon />}
                    href={authUrl}
                    sx={{
                      borderColor: afkColors.border,
                      color: afkColors.textPrimary,
                      '&:hover': {
                        borderColor: afkColors.textSecondary,
                        bgcolor: 'rgba(255, 255, 255, 0.04)',
                      },
                    }}
                  >
                    Connect GitHub
                  </Button>
                  <Typography
                    variant="caption"
                    sx={{
                      color: afkColors.textTertiary,
                      mt: 1,
                      display: 'block',
                      ml: 0.5,
                    }}
                  >
                    Connect your GitHub account to browse and select
                    repositories when creating sessions
                  </Typography>
                </Box>
              )}
            </Box>

            {/* SSH Configuration */}
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  borderLeft: `2px solid ${afkColors.accent}`,
                  pl: 2,
                  mb: 2.5,
                }}
              >
                <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
                  SSH Configuration
                </Typography>
              </Box>

              {settings?.hasSshPrivateKey && !isEditingSshKey ? (
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 2,
                      border: `1px solid ${afkColors.border}`,
                      borderRadius: 1,
                      bgcolor: afkColors.surfaceElevated,
                    }}
                  >
                    <LockIcon sx={{ fontSize: 18, color: afkColors.accent }} />
                    <Typography
                      variant="body2"
                      sx={{ color: afkColors.textSecondary, flex: 1 }}
                    >
                      SSH private key is configured
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setIsEditingSshKey(true)}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Replace
                    </Button>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: afkColors.textTertiary,
                      mt: 0.5,
                      ml: 1.75,
                      display: 'block',
                    }}
                  >
                    Private SSH key for git repository access
                  </Typography>
                </Box>
              ) : (
                <>
                  <TextField
                    fullWidth
                    label="SSH Private Key"
                    multiline
                    rows={5}
                    value={formData.sshPrivateKey}
                    onChange={(e) => {
                      handleInputChange('sshPrivateKey')(e);
                      setSshKeyModified(true);
                    }}
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                    helperText="Private SSH key for git repository access"
                    sx={{
                      '& .MuiInputBase-input': {
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '0.75rem',
                        WebkitTextSecurity: 'disc',
                      },
                    }}
                  />
                  {(formData.sshPrivateKey || isEditingSshKey) && (
                    <Button
                      size="small"
                      onClick={() => {
                        handleClear('sshPrivateKey');
                        setSshKeyModified(true);
                        if (settings?.hasSshPrivateKey) {
                          setIsEditingSshKey(false);
                        }
                      }}
                      sx={{
                        mt: 1,
                        color: afkColors.danger,
                        fontSize: '0.75rem',
                        '&:hover': {
                          bgcolor: afkColors.dangerMuted,
                        },
                      }}
                    >
                      {isEditingSshKey && !formData.sshPrivateKey
                        ? 'Cancel'
                        : 'Clear SSH Key'}
                    </Button>
                  )}
                </>
              )}
            </Box>

            {/* Claude Configuration */}
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  borderLeft: `2px solid ${afkColors.accent}`,
                  pl: 2,
                  mb: 2.5,
                }}
              >
                <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
                  Claude Configuration
                </Typography>
              </Box>

              {settings?.hasClaudeToken && !isEditingClaudeToken ? (
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 2,
                      border: `1px solid ${afkColors.border}`,
                      borderRadius: 1,
                      bgcolor: afkColors.surfaceElevated,
                    }}
                  >
                    <LockIcon sx={{ fontSize: 18, color: afkColors.accent }} />
                    <Typography
                      variant="body2"
                      sx={{ color: afkColors.textSecondary, flex: 1 }}
                    >
                      Claude API token is configured
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setIsEditingClaudeToken(true)}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Replace
                    </Button>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: afkColors.textTertiary,
                      mt: 0.5,
                      ml: 1.75,
                      display: 'block',
                    }}
                  >
                    Claude API token for AI assistance
                  </Typography>
                </Box>
              ) : (
                <>
                  <TextField
                    fullWidth
                    label="Claude API Token"
                    type="password"
                    value={formData.claudeToken}
                    onChange={(e) => {
                      handleInputChange('claudeToken')(e);
                      setClaudeTokenModified(true);
                    }}
                    placeholder="sk-ant-api03-..."
                    helperText="Claude API token for AI assistance"
                  />
                  {(formData.claudeToken || isEditingClaudeToken) && (
                    <Button
                      size="small"
                      onClick={() => {
                        handleClear('claudeToken');
                        setClaudeTokenModified(true);
                        if (settings?.hasClaudeToken) {
                          setIsEditingClaudeToken(false);
                        }
                      }}
                      sx={{
                        mt: 1,
                        color: afkColors.danger,
                        fontSize: '0.75rem',
                        '&:hover': {
                          bgcolor: afkColors.dangerMuted,
                        },
                      }}
                    >
                      {isEditingClaudeToken && !formData.claudeToken
                        ? 'Cancel'
                        : 'Clear Claude Token'}
                    </Button>
                  )}
                </>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                {saveLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </form>
        </>
      )}

      {activeTab === 1 && (
        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2.5,
            }}
          >
            <Typography variant="body2" sx={{ color: afkColors.textSecondary }}>
              Manage Docker images available for sessions.
            </Typography>
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
              {images.filter((img) => img.status !== 'NOT_PULLED').length >
                0 && (
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
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
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
              {images.filter((img) => img.status === 'NOT_PULLED').length >
                0 && (
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
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
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
      )}
    </Box>
  );
};

export default Settings;
