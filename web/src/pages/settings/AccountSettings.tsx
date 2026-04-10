import React, { useState } from 'react';
import { Box, Typography, TextField, Alert, CircularProgress } from '@mui/material';
import { Save as SaveIcon, Check as CheckIcon } from '@mui/icons-material';
import { authApi } from '../../api/auth.api';
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

const AccountSettings: React.FC = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleInputChange =
    (field: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
      if (successMessage) setSuccessMessage('');
      if (error) setError(null);
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage('');

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    if (!formData.currentPassword) {
      setError('Current password is required');
      return;
    }

    setSaveLoading(true);
    try {
      await authApi.updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setSuccessMessage('Password updated successfully!');
      setFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
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
        <Box sx={{ mb: 4 }}>
          <SectionHeader title="Change Password" />

          <TextField
            fullWidth
            label="Current Password"
            type="password"
            value={formData.currentPassword}
            onChange={handleInputChange('currentPassword')}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={handleInputChange('newPassword')}
            helperText="Must be at least 6 characters"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            value={formData.confirmNewPassword}
            onChange={handleInputChange('confirmNewPassword')}
          />
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
            {saveLoading ? 'Updating...' : 'Update Password'}
          </PrimaryCtaButton>
        </Box>
      </form>
    </>
  );
};

export { AccountSettings };
