import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Check as CheckIcon,
  Lock as LockIcon,
  GitHub as GitHubIcon,
  LinkOff as LinkOffIcon,
} from '@mui/icons-material';
import { useSettingsStore } from '../stores/settings.store';
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
  });

  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditingSshKey, setIsEditingSshKey] = useState(false);
  const [sshKeyModified, setSshKeyModified] = useState(false);
  const [isEditingClaudeToken, setIsEditingClaudeToken] = useState(false);
  const [claudeTokenModified, setClaudeTokenModified] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

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

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: 640 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3">Settings</Typography>
        <Typography
          variant="body2"
          sx={{ color: afkColors.textSecondary, mt: 1 }}
        >
          Global settings used for all new sessions.
        </Typography>
      </Box>

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
              <GitHubIcon sx={{ fontSize: 20, color: afkColors.textPrimary }} />
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
                  You can browse and select repositories when creating sessions
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
                Connect your GitHub account to browse and select repositories
                when creating sessions
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

        {/* Save */}
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
    </Box>
  );
};

export default Settings;
