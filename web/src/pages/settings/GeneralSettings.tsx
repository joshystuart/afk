import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Check as CheckIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useSettingsStore } from '../../stores/settings.store';
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

const GeneralSettings: React.FC = () => {
  const { settings, error, updateSettings, clearError } = useSettingsStore();

  const [formData, setFormData] = useState({
    defaultMountDirectory: '',
    claudeToken: '',
    skillsDirectory: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditingClaudeToken, setIsEditingClaudeToken] = useState(false);
  const [claudeTokenModified, setClaudeTokenModified] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        defaultMountDirectory: settings.defaultMountDirectory || '',
        claudeToken: '',
        skillsDirectory: settings.skillsDirectory || '',
      });
      setIsEditingClaudeToken(false);
      setClaudeTokenModified(false);
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
        defaultMountDirectory: formData.defaultMountDirectory,
        skillsDirectory: formData.skillsDirectory,
      };
      if (claudeTokenModified) {
        submitData.claudeToken = formData.claudeToken;
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
        {/* Workspace */}
        <Box sx={{ mb: 4 }}>
          <SectionHeader title="Workspace" />
          <TextField
            fullWidth
            label="Default Mount Directory"
            value={formData.defaultMountDirectory}
            onChange={handleInputChange('defaultMountDirectory')}
            placeholder="/Users/josh/afk-workspaces"
            helperText="Base directory on the host for mounting session workspaces. When set, sessions can bind-mount their workspace to this directory."
          />
        </Box>

        {/* Skills */}
        <Box sx={{ mb: 4 }}>
          <SectionHeader title="Skills" />
          <TextField
            fullWidth
            label="Skills Directory"
            value={formData.skillsDirectory}
            onChange={handleInputChange('skillsDirectory')}
            placeholder="/path/to/your/skills"
            helperText="Host directory containing agent skills. Mounted read-only into session containers."
          />
        </Box>

        {/* Claude Configuration */}
        <Box sx={{ mb: 4 }}>
          <SectionHeader title="Claude Configuration" />

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
                    setFormData((prev) => ({ ...prev, claudeToken: '' }));
                    setClaudeTokenModified(true);
                    if (settings?.hasClaudeToken) {
                      setIsEditingClaudeToken(false);
                    }
                  }}
                  sx={{
                    mt: 1,
                    color: afkColors.danger,
                    fontSize: '0.75rem',
                    '&:hover': { bgcolor: afkColors.dangerMuted },
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

export { GeneralSettings };
