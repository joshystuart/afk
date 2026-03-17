import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import { afkColors } from '../themes/afk';

const ScheduledJobs: React.FC = () => {
  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Typography variant="h3">Scheduled Jobs</Typography>
        <Button
          component={Link}
          to={ROUTES.CREATE_SCHEDULED_JOB}
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
        >
          Create Job
        </Button>
      </Box>

      <Box
        sx={{
          textAlign: 'center',
          py: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <ScheduleIcon
          sx={{ fontSize: 48, color: afkColors.textTertiary, opacity: 0.5 }}
        />
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '1.25rem',
            color: afkColors.textSecondary,
            fontWeight: 500,
          }}
        >
          No scheduled jobs
        </Typography>
        <Typography
          sx={{
            fontSize: '0.875rem',
            color: afkColors.textTertiary,
            maxWidth: 400,
          }}
        >
          Create recurring jobs that spin up containers, run Claude prompts
          against your repos, and optionally commit changes.
        </Typography>
        <Button
          component={Link}
          to={ROUTES.CREATE_SCHEDULED_JOB}
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ mt: 2 }}
        >
          Create Your First Job
        </Button>
      </Box>
    </Box>
  );
};

export { ScheduledJobs };
