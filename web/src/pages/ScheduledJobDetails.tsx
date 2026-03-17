import React from 'react';
import { Box, Typography, Button, Tabs, Tab } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import { afkColors } from '../themes/afk';

const TAB_KEYS = ['settings', 'history'] as const;
type TabKey = (typeof TAB_KEYS)[number];

const ScheduledJobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') as TabKey | null;
  const activeTab = TAB_KEYS.indexOf(
    tabParam && TAB_KEYS.includes(tabParam) ? tabParam : 'settings',
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

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Button
          component={Link}
          to={ROUTES.SCHEDULED_JOBS}
          variant="text"
          size="small"
          startIcon={<ArrowBackIcon />}
          sx={{ color: afkColors.textSecondary, minWidth: 'auto' }}
        >
          Back
        </Button>
      </Box>

      <Typography variant="h3" sx={{ mb: 0.5 }}>
        Job Details
      </Typography>
      <Typography
        sx={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.75rem',
          color: afkColors.textTertiary,
          mb: 3,
        }}
      >
        {id}
      </Typography>

      <Box sx={{ borderBottom: `1px solid ${afkColors.border}`, mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Settings" />
          <Tab label="History" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box
          sx={{
            border: `1px dashed ${afkColors.border}`,
            borderRadius: '8px',
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.875rem',
              color: afkColors.textTertiary,
            }}
          >
            Job settings view coming in Phase 6
          </Typography>
        </Box>
      )}

      {activeTab === 1 && (
        <Box
          sx={{
            border: `1px dashed ${afkColors.border}`,
            borderRadius: '8px',
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.875rem',
              color: afkColors.textTertiary,
            }}
          >
            Run history coming in Phase 6
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export { ScheduledJobDetails };
