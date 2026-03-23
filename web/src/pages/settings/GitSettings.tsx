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
import { PrimaryCtaButton } from '../../components/PrimaryCtaButton';

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
  const { username, disconnect, isDisconnecting } = useGitHub();

  const [formData, setFormData] = useState({
    gitUserName: '',
    gitUserEmail: '',
    sshPrivateKey: '',
    githubAccessToken: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditingSshKey, setIsEditingSshKey] = useState(false);
  const [sshKeyModified, setSshKeyModified] = useState(false);
  const [isRemovingSshKey, setIsRemovingSshKey] = useState(false);
  const [isEditingToken, setIsEditingToken] = useState(false);
  const [tokenModified, setTokenModified] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        gitUserName: settings.gitUserName || '',
        gitUserEmail: settings.gitUserEmail || '',
        sshPrivateKey: '',
        githubAccessToken: '',
      });
      setIsEditingSshKey(false);
      setSshKeyModified(false);
      setIsEditingToken(false);
      setTokenModified(false);
    }
  }, [settings]);

  const handleInputChange =
    (field: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
      if (successMessage) setSuccessMessage('');
      if (error) clearError();
    };

  const handleRemoveSshKey = async () => {
    setIsRemovingSshKey(true);
    try {
      await updateSettings({ sshPrivateKey: '' });
      setSuccessMessage('SSH key removed successfully');
    } catch {
      // Error handled by store
    } finally {
      setIsRemovingSshKey(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveLoading(true);
    setSuccessMessage('');

    try {
      const submitData: UpdateSettingsRequest = {
        gitUserName: formData.gitUserName,
        gitUserEmail: formData.gitUserEmail,
      };
      if (sshKeyModified) {
        submitData.sshPrivateKey = formData.sshPrivateKey;
      }
      if (tokenModified) {
        submitData.githubAccessToken = formData.githubAccessToken;
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
                <Button
                  size="small"
                  startIcon={
                    isRemovingSshKey ? (
                      <CircularProgress size={14} sx={{ color: 'inherit' }} />
                    ) : (
                      <LinkOffIcon sx={{ fontSize: 16 }} />
                    )
                  }
                  onClick={handleRemoveSshKey}
                  disabled={isRemovingSshKey}
                  sx={{
                    fontSize: '0.75rem',
                    color: afkColors.danger,
                    '&:hover': { bgcolor: afkColors.dangerMuted },
                  }}
                >
                  Remove
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

        {/* GitHub Personal Access Token */}
        <Box sx={{ mb: 4 }}>
          <SectionHeader title="GitHub Token" />
          <Typography
            variant="caption"
            sx={{
              color: afkColors.textTertiary,
              mb: 2,
              display: 'block',
            }}
          >
            Add a GitHub Personal Access Token to enable GitHub integration
            (browse repos, clone via HTTPS). Create a token at{' '}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: afkColors.accent }}
            >
              github.com/settings/tokens
            </a>{' '}
            with the <strong>repo</strong> scope.
          </Typography>

          {settings?.hasGitHubToken && !isEditingToken ? (
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
                <GitHubIcon
                  sx={{ fontSize: 20, color: afkColors.textPrimary }}
                />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {username && (
                      <Typography
                        variant="body2"
                        sx={{ color: afkColors.textPrimary, fontWeight: 500 }}
                      >
                        {username}
                      </Typography>
                    )}
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
                  onClick={() => setIsEditingToken(true)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Replace
                </Button>
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
                  Remove
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              <TextField
                fullWidth
                label="Personal Access Token"
                type="password"
                value={formData.githubAccessToken}
                onChange={(e) => {
                  handleInputChange('githubAccessToken')(e);
                  setTokenModified(true);
                }}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                helperText="GitHub Personal Access Token with repo scope"
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.8125rem',
                  },
                }}
              />
              {isEditingToken && !formData.githubAccessToken && (
                <Button
                  size="small"
                  onClick={() => {
                    setIsEditingToken(false);
                    setTokenModified(false);
                    setFormData((prev) => ({ ...prev, githubAccessToken: '' }));
                  }}
                  sx={{
                    mt: 1,
                    fontSize: '0.75rem',
                    color: afkColors.textTertiary,
                  }}
                >
                  Cancel
                </Button>
              )}
            </>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <PrimaryCtaButton
            type="submit"
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
          </PrimaryCtaButton>
        </Box>
      </form>
    </>
  );
};

export { GitSettings };
