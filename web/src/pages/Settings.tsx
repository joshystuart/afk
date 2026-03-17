import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress, Tabs, Tab } from '@mui/material';
import { useSettingsStore } from '../stores/settings.store';
import { afkColors } from '../themes/afk';
import { useSearchParams } from 'react-router-dom';
import { GeneralSettings } from './settings/GeneralSettings';
import { GitSettings } from './settings/GitSettings';
import { DockerSettings } from './settings/DockerSettings';

const TAB_KEYS = ['general', 'git', 'docker'] as const;
type TabKey = (typeof TAB_KEYS)[number];

const Settings: React.FC = () => {
  const { settings, loading, fetchSettings } = useSettingsStore();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const githubParam = searchParams.get('github');
    if (githubParam === 'connected' || githubParam === 'error') {
      if (githubParam === 'connected') {
        fetchSettings();
      }
      const next = new URLSearchParams(searchParams);
      next.delete('github');
      next.delete('reason');
      if (githubParam === 'connected') {
        next.set('tab', 'git');
      }
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, fetchSettings]);

  const tabParam = searchParams.get('tab') as TabKey | null;
  const activeTab = TAB_KEYS.indexOf(
    tabParam && TAB_KEYS.includes(tabParam) ? tabParam : 'general',
  );

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    const next = new URLSearchParams(searchParams);
    if (newValue === 0) {
      next.delete('tab');
    } else {
      next.set('tab', TAB_KEYS[newValue]);
    }
    setSearchParams(next, { replace: true });
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
        <Tab label="Git" />
        <Tab label="Docker" />
      </Tabs>

      {activeTab === 0 && <GeneralSettings />}
      {activeTab === 1 && <GitSettings />}
      {activeTab === 2 && <DockerSettings />}
    </Box>
  );
};

export { Settings };
