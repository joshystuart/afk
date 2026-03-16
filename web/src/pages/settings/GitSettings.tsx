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
import { useSettingsStore } from '../../stores/settings.store';
import { useGitHub } from '../../hooks/useGitHub';
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

const GitSettings: React.FC = () => {
  const { settings, error, updateSettings, clearError } = useSettingsStore();
  const {
    isConnected,
    username,
    isElectron,
    authUrl,
    startAuth,
    isAuthenticating,
    cancelAuth,
    disconnect,
    isDisconnecting,
  } = useGitHub();

  const [formData, setFormData] = useState({
    gitUserName: '',
    gitUserEmail: '',
    sshPrivateKey: '',
    githubClientId: '',
    githubClientSecret: '',
    githubCallbackUrl: '',
    githubFrontendRedirectUrl: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditingSshKey, setIsEditingSshKey] = useState(false);
  const [sshKeyModified, setSshKeyModified] = useState(false);
  const [isEditingClientSecret, setIsEditingClientSecret] = useState(false);
  const [clientSecretModified, setClientSecretModified] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        gitUserName: settings.gitUserName || '',
        gitUserEmail: settings.gitUserEmail || '',
        sshPrivateKey: '',
        githubClientId: settings.githubClientId || '',
        githubClientSecret: '',
        githubCallbackUrl: settings.githubCallbackUrl || '',
        githubFrontendRedirectUrl: settings.githubFrontendRedirectUrl || '',
      });
      setIsEditingSshKey(false);
      setSshKeyModified(false);
      setIsEditingClientSecret(false);
      setClientSecretModified(false);
    }
  }, [settings]);

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
        gitUserName: formData.gitUserName,
        gitUserEmail: formData.gitUserEmail,
        githubClientId: formData.githubClientId,
        githubCallbackUrl: formData.githubCallbackUrl,
        githubFrontendRedirectUrl: formData.githubFrontendRedirectUrl,
      };
      if (sshKeyModified) {
        submitData.sshPrivateKey = formData.sshPrivateKey;
      }
      if (clientSecretModified) {
        submitData.githubClientSecret = formData.githubClientSecret;
      }
      await updateSettings(submitData);
      setSuccessMessage('Settings saved successfully!');
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

      <form onSubmit={handleSubmit}>
        {/* Git Configuration */}
        <Box sx={{ mb: 4 }}>
          <SectionHeader title="Git Configuration" />
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

        {/* SSH Configuration */}
        <Box sx={{ mb: 4 }}>
          <SectionHeader title="SSH Configuration" />

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
                    setFormData((prev) => ({ ...prev, sshPrivateKey: '' }));
                    setSshKeyModified(true);
                    if (settings?.hasSshPrivateKey) {
                      setIsEditingSshKey(false);
                    }
                  }}
                  sx={{
                    mt: 1,
                    color: afkColors.danger,
                    fontSize: '0.75rem',
                    '&:hover': { bgcolor: afkColors.dangerMuted },
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

        {/* GitHub OAuth Settings */}
        <Box sx={{ mb: 4 }}>
          <SectionHeader title="GitHub OAuth Settings" />
          <Typography
            variant="caption"
            sx={{
              color: afkColors.textTertiary,
              mb: 2,
              display: 'block',
            }}
          >
            Configure your GitHub OAuth App credentials to enable GitHub
            integration. Create an OAuth App at{' '}
            <a
              href="https://github.com/settings/developers"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: afkColors.accent }}
            >
              github.com/settings/developers
            </a>
          </Typography>

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
                label="Client ID"
                value={formData.githubClientId}
                onChange={handleInputChange('githubClientId')}
                placeholder="Ov23li..."
                helperText="GitHub OAuth App client ID"
              />
              {settings?.hasGithubClientSecret && !isEditingClientSecret ? (
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
                      height: 56,
                    }}
                  >
                    <LockIcon sx={{ fontSize: 18, color: afkColors.accent }} />
                    <Typography
                      variant="body2"
                      sx={{ color: afkColors.textSecondary, flex: 1 }}
                    >
                      Client secret is set
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setIsEditingClientSecret(true)}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Replace
                    </Button>
                  </Box>
                </Box>
              ) : (
                <TextField
                  fullWidth
                  label="Client Secret"
                  type="password"
                  value={formData.githubClientSecret}
                  onChange={(e) => {
                    handleInputChange('githubClientSecret')(e);
                    setClientSecretModified(true);
                  }}
                  placeholder="GitHub OAuth App client secret"
                  helperText="GitHub OAuth App client secret"
                />
              )}
            </Box>
            <TextField
              fullWidth
              label="Callback URL"
              value={formData.githubCallbackUrl}
              onChange={handleInputChange('githubCallbackUrl')}
              placeholder="http://localhost:3001/api/github/callback"
              helperText="OAuth callback URL (must match your GitHub OAuth App settings)"
              sx={{
                '& .MuiInputBase-input': {
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.8125rem',
                },
              }}
            />
            <TextField
              fullWidth
              label="Frontend Redirect URL"
              value={formData.githubFrontendRedirectUrl}
              onChange={handleInputChange('githubFrontendRedirectUrl')}
              placeholder="http://localhost:5173/settings"
              helperText="Where to redirect after OAuth completes"
              sx={{
                '& .MuiInputBase-input': {
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.8125rem',
                },
              }}
            />
          </Box>
        </Box>

        {/* GitHub Connection */}
        <Box sx={{ mb: 4 }}>
          <SectionHeader title="GitHub Connection" />

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
              {isAuthenticating ? (
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
                  <CircularProgress
                    size={18}
                    sx={{ color: afkColors.accent }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: afkColors.textSecondary, flex: 1 }}
                  >
                    Waiting for GitHub authorization&hellip;
                  </Typography>
                  <Button
                    size="small"
                    onClick={cancelAuth}
                    sx={{
                      fontSize: '0.75rem',
                      color: afkColors.textTertiary,
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<GitHubIcon />}
                  {...(isElectron
                    ? { onClick: () => startAuth() }
                    : { href: authUrl })}
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
              )}
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
  );
};

export { GitSettings };
