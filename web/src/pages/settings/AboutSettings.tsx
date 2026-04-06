import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { apiClient } from '../../api/client';
import { afkColors } from '../../themes/afk';
import { useUpdateState } from '../../hooks/useUpdateState';

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

interface HealthLivePayload {
  version?: string;
}

const AboutSettings: React.FC = () => {
  const [desktopVersion, setDesktopVersion] = useState<string | null>(null);
  const [desktopLoading, setDesktopLoading] = useState(true);
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverLoading, setServerLoading] = useState(true);

  const updateState = useUpdateState();

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.getAppVersion) {
      setDesktopVersion(null);
      setDesktopLoading(false);
      return;
    }

    void api
      .getAppVersion()
      .then((v) => setDesktopVersion(v))
      .catch(() => setDesktopVersion(null))
      .finally(() => setDesktopLoading(false));
  }, []);

  useEffect(() => {
    void apiClient
      .get<HealthLivePayload>('/health/live')
      .then((data) => {
        const payload = data as unknown as HealthLivePayload;
        setServerVersion(
          typeof payload?.version === 'string' ? payload.version : null,
        );
        setServerError(null);
      })
      .catch((err: unknown) => {
        setServerVersion(null);
        const message = err instanceof Error ? err.message : 'Failed to load';
        setServerError(message);
      })
      .finally(() => setServerLoading(false));
  }, []);

  const handleCheckForUpdates = useCallback(() => {
    void window.electronAPI?.updater?.checkForUpdates();
  }, []);

  const handleInstallUpdate = useCallback(() => {
    void window.electronAPI?.updater?.install();
  }, []);

  const renderUpdaterSection = () => {
    const api = window.electronAPI?.updater;
    if (!api) {
      return (
        <Typography variant="body2" sx={{ color: afkColors.textSecondary }}>
          Software updates are only available in the AFK desktop app.
        </Typography>
      );
    }

    switch (updateState.status) {
      case 'checking':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" sx={{ color: afkColors.textSecondary }}>
              Checking for updates…
            </Typography>
          </Box>
        );
      case 'downloading':
        return (
          <Typography variant="body2" sx={{ color: afkColors.textSecondary }}>
            Downloading update… {updateState.progress ?? 0}%
          </Typography>
        );
      case 'downloaded':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="body2" sx={{ color: afkColors.textSecondary }}>
              Update is ready to install.
            </Typography>
            <Button variant="contained" onClick={handleInstallUpdate}>
              Restart to update
              {updateState.version ? ` (v${updateState.version})` : ''}
            </Button>
          </Box>
        );
      case 'restarting':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" sx={{ color: afkColors.textSecondary }}>
              Restarting to apply update
              {updateState.version ? ` (v${updateState.version})` : ''}…
            </Typography>
          </Box>
        );
      case 'available':
        return (
          <Typography variant="body2" sx={{ color: afkColors.textSecondary }}>
            Update available
            {updateState.version ? ` (v${updateState.version})` : ''}.
          </Typography>
        );
      case 'error':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {updateState.error && (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                {updateState.error}
              </Alert>
            )}
            <Button variant="outlined" onClick={handleCheckForUpdates}>
              Check for updates
            </Button>
          </Box>
        );
      default:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="body2" sx={{ color: afkColors.textSecondary }}>
              {updateState.status === 'not-available'
                ? 'You are on the latest version.'
                : 'Check whether a newer version is available.'}
            </Typography>
            <Button variant="outlined" onClick={handleCheckForUpdates}>
              Check for updates
            </Button>
          </Box>
        );
    }
  };

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <SectionHeader title="AFK Desktop" />
        {desktopLoading ? (
          <CircularProgress size={20} />
        ) : desktopVersion ? (
          <Typography variant="body1" sx={{ color: afkColors.textPrimary }}>
            Version {desktopVersion}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ color: afkColors.textSecondary }}>
            Not running in the desktop app (or version unavailable).
          </Typography>
        )}
      </Box>

      <Box sx={{ mb: 4 }}>
        <SectionHeader title="AFK Server" />
        {serverLoading ? (
          <CircularProgress size={20} />
        ) : serverError ? (
          <Typography variant="body2" sx={{ color: afkColors.danger }}>
            {serverError}
          </Typography>
        ) : serverVersion ? (
          <Typography variant="body1" sx={{ color: afkColors.textPrimary }}>
            Version {serverVersion}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ color: afkColors.textSecondary }}>
            Version unknown
          </Typography>
        )}
      </Box>

      <Box>
        <SectionHeader title="Updates" />
        {renderUpdaterSection()}
      </Box>
    </>
  );
};

export { AboutSettings };
