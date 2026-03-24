import React from 'react';
import { Box, Typography, Skeleton, Chip, Switch } from '@mui/material';
import {
  Add as AddIcon,
  Schedule as ScheduleIcon,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useScheduledJobs } from '../hooks/useScheduledJobs';
import type { ScheduledJob } from '../api/types';
import { ScheduledJobRunStatus } from '../api/types';
import { ROUTES } from '../utils/constants';
import { afkColors } from '../themes/afk';
import { PrimaryCtaButton } from '../components/PrimaryCtaButton';

function formatScheduleSummary(job: ScheduledJob): string {
  if (job.scheduleType === 'cron' && job.cronExpression) {
    return `cron: ${job.cronExpression}`;
  }
  if (job.scheduleType === 'interval' && job.intervalMs) {
    const ms = job.intervalMs;
    if (ms >= 86400000) return `every ${Math.round(ms / 86400000)}d`;
    if (ms >= 3600000) return `every ${Math.round(ms / 3600000)}h`;
    if (ms >= 60000) return `every ${Math.round(ms / 60000)}m`;
    return `every ${Math.round(ms / 1000)}s`;
  }
  return 'No schedule';
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getRepoName(repoUrl: string): string {
  return repoUrl.split('/').pop()?.replace('.git', '') || repoUrl;
}

function getJobActivityState(job: ScheduledJob): {
  label: string;
  color: string;
  dotColor?: string;
} {
  if (job.currentRun?.status === ScheduledJobRunStatus.RUNNING) {
    return {
      label: 'Running',
      color: afkColors.warning,
      dotColor: afkColors.warning,
    };
  }

  if (job.currentRun?.status === ScheduledJobRunStatus.PENDING) {
    return {
      label: 'Starting',
      color: afkColors.warning,
      dotColor: afkColors.warning,
    };
  }

  if (!job.enabled) {
    return {
      label: 'Paused',
      color: afkColors.textTertiary,
    };
  }

  return {
    label: 'Active',
    color: afkColors.accent,
    dotColor: afkColors.accent,
  };
}

const ScheduledJobs: React.FC = () => {
  const navigate = useNavigate();
  const { jobs, isLoading, updateJob } = useScheduledJobs();

  const handleToggleEnabled = async (
    e: React.ChangeEvent<HTMLInputElement>,
    job: ScheduledJob,
  ) => {
    e.stopPropagation();
    try {
      await updateJob({ id: job.id, request: { enabled: !job.enabled } });
    } catch {
      // handled by React Query
    }
  };

  if (isLoading && jobs.length === 0) {
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
          <Typography variant="h3">Jobs</Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={160}
              sx={{ borderRadius: '8px' }}
            />
          ))}
        </Box>
      </Box>
    );
  }

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
        <Typography variant="h3">Jobs</Typography>
        <PrimaryCtaButton
          component={Link}
          to={ROUTES.CREATE_SCHEDULED_JOB}
          startIcon={<AddIcon />}
          size="small"
        >
          Create Job
        </PrimaryCtaButton>
      </Box>

      {jobs.length === 0 ? (
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
          <PrimaryCtaButton
            component={Link}
            to={ROUTES.CREATE_SCHEDULED_JOB}
            startIcon={<AddIcon />}
            sx={{ mt: 2 }}
          >
            Create Your First Job
          </PrimaryCtaButton>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          <AnimatePresence mode="popLayout">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onToggleEnabled={handleToggleEnabled}
                onView={() => navigate(ROUTES.getScheduledJobDetails(job.id))}
              />
            ))}
          </AnimatePresence>
        </Box>
      )}
    </Box>
  );
};

const JobCard: React.FC<{
  job: ScheduledJob;
  onToggleEnabled: (
    e: React.ChangeEvent<HTMLInputElement>,
    job: ScheduledJob,
  ) => void;
  onView: () => void;
}> = ({ job, onToggleEnabled, onView }) => {
  const activityState = getJobActivityState(job);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
      transition={{
        layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
        filter: { duration: 0.2 },
      }}
    >
      <Box
        sx={{
          border: `1px solid ${afkColors.border}`,
          borderRadius: '8px',
          bgcolor: afkColors.surface,
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          transition: 'border-color 150ms ease',
          cursor: 'pointer',
          height: '100%',
          opacity: job.enabled ? 1 : 0.6,
          '&:hover': {
            borderColor: afkColors.textTertiary,
          },
        }}
        onClick={onView}
      >
        {/* Top: Name + Enabled Toggle */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: afkColors.textPrimary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {job.name}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: afkColors.textTertiary,
                mt: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {getRepoName(job.repoUrl)}
            </Typography>
          </Box>
          <Switch
            size="small"
            checked={job.enabled}
            onChange={(e) => {
              e.stopPropagation();
              onToggleEnabled(e, job);
            }}
            onClick={(e) => e.stopPropagation()}
            sx={{
              ml: 1,
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: afkColors.accent,
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: afkColors.accent,
              },
            }}
          />
        </Box>

        {/* Schedule + Branch */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={formatScheduleSummary(job)}
            size="small"
            sx={{
              bgcolor: afkColors.surfaceElevated,
              color: afkColors.textSecondary,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.6875rem',
            }}
          />
          {job.commitAndPush && (
            <Chip
              label="auto-push"
              size="small"
              sx={{
                bgcolor: afkColors.accentMuted,
                color: afkColors.accent,
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.6875rem',
              }}
            />
          )}
        </Box>

        {/* Footer: Last run + status */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 'auto',
            pt: 1.5,
            borderTop: `1px solid ${afkColors.border}`,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.6875rem',
              color: afkColors.textTertiary,
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            {job.lastRunAt
              ? `ran ${formatRelativeTime(job.lastRunAt)}`
              : 'no runs yet'}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {activityState.dotColor && (
              <>
                <DotIcon
                  sx={{
                    fontSize: 8,
                    color: activityState.dotColor,
                    animation: 'pulse-dot 2s ease-in-out infinite',
                  }}
                />
              </>
            )}
            <Typography
              sx={{
                fontSize: '0.6875rem',
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 500,
                color: activityState.color,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {activityState.label}
            </Typography>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
};

export { ScheduledJobs };
