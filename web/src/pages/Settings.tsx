import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';
import { Save as SaveIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useSettingsStore } from '../stores/settings.store';
import type { UpdateSettingsRequest } from '../api/types';

const Settings: React.FC = () => {
  const { 
    settings, 
    loading, 
    error, 
    fetchSettings, 
    updateSettings, 
    clearError 
  } = useSettingsStore();

  const [formData, setFormData] = useState<UpdateSettingsRequest>({
    sshPrivateKey: '',
    claudeToken: '',
    gitUserName: '',
    gitUserEmail: ''
  });

  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setFormData({
        sshPrivateKey: settings.sshPrivateKey || '',
        claudeToken: settings.claudeToken || '',
        gitUserName: settings.gitUserName || '',
        gitUserEmail: settings.gitUserEmail || ''
      });
    }
  }, [settings]);

  const handleInputChange = (field: keyof UpdateSettingsRequest) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (successMessage) setSuccessMessage('');
    if (error) clearError();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveLoading(true);
    setSuccessMessage('');
    
    try {
      await updateSettings(formData);
      setSuccessMessage('Settings saved successfully!');
    } catch (err) {
      // Error is handled by the store
    } finally {
      setSaveLoading(false);
    }
  };

  const handleClear = (field: keyof UpdateSettingsRequest) => {
    setFormData(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  if (loading && !settings) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <SettingsIcon sx={{ mr: 2, fontSize: 32 }} />
        <Typography variant="h4" component="h1">
          Global Settings
        </Typography>
      </Box>
      
      <Typography variant="body1" color="text.secondary" mb={3}>
        Configure global settings that will be used for all new sessions. 
        These settings eliminate the need to enter SSH keys and Claude tokens for each session.
      </Typography>

      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Git Configuration */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Git Configuration
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Git User Name"
                  value={formData.gitUserName}
                  onChange={handleInputChange('gitUserName')}
                  placeholder="Your Name"
                  helperText="Default git user name for commits"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Git User Email"
                  type="email"
                  value={formData.gitUserEmail}
                  onChange={handleInputChange('gitUserEmail')}
                  placeholder="your.email@example.com"
                  helperText="Default git user email for commits"
                />
              </Grid>

              {/* SSH Configuration */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  SSH Configuration
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="SSH Private Key"
                  multiline
                  rows={6}
                  value={formData.sshPrivateKey}
                  onChange={handleInputChange('sshPrivateKey')}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;[Your SSH private key content]&#10;-----END OPENSSH PRIVATE KEY-----"
                  helperText="Private SSH key for git repository access. This will be used for all sessions that require git access."
                  sx={{ fontFamily: 'monospace' }}
                />
                {formData.sshPrivateKey && (
                  <Button 
                    size="small" 
                    onClick={() => handleClear('sshPrivateKey')}
                    sx={{ mt: 1 }}
                  >
                    Clear SSH Key
                  </Button>
                )}
              </Grid>

              {/* Claude Configuration */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Claude Configuration
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Claude API Token"
                  type="password"
                  value={formData.claudeToken}
                  onChange={handleInputChange('claudeToken')}
                  placeholder="sk-ant-api03-..."
                  helperText="Claude API token for AI assistance. This will be used for all sessions."
                />
                {formData.claudeToken && (
                  <Button 
                    size="small" 
                    onClick={() => handleClear('claudeToken')}
                    sx={{ mt: 1 }}
                  >
                    Clear Claude Token
                  </Button>
                )}
              </Grid>

              {/* Actions */}
              <Grid size={{ xs: 12 }}>
                <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={saveLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={saveLoading}
                    size="large"
                  >
                    {saveLoading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;