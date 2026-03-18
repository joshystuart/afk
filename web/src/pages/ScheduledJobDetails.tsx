import React from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Cancel as FailedIcon,
  HourglassEmpty as PendingIcon,
  Loop as RunningIcon,
  Edit as EditIcon,
  PauseCircleOutline as PauseIcon,
  PlayCircleOutline as PlayIcon,
  DeleteOutline as DeleteIcon,
  Bolt as RunNowIcon,
} from '@mui/icons-material';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  useScheduledJob,
  useScheduledJobRuns,
  useScheduledJobRunStream,
  useScheduledJobs,
} from '../hooks/useScheduledJobs';
import {
  ScheduledJobRunStatus,
  type ScheduledJob,
  type ScheduledJobRun,
} from '../api/types';
import { ROUTES } from '../utils/constants';
import { getClaudeModelLabel } from '../utils/claude-models';
import { afkColors } from '../themes/afk';
import { RunOutputDialog } from '../components/scheduled-jobs/RunOutputViewer';

const TAB_KEYS = ['settings', 'history'] as const;
type TabKey = (typeof TAB_KEYS)[number];

function getJobChipConfig(job: ScheduledJob): {
  label: string;
  bg: string;
  color: string;
} {
  if (job.currentRun?.status === ScheduledJobRunStatus.RUNNING) {
    return {
      label: 'Running',
      bg: afkColors.warningMuted,
      color: afkColors.warning,
    };
  }

  if (job.currentRun?.status === ScheduledJobRunStatus.PENDING) {
    return {
      label: 'Starting',
      bg: afkColors.warningMuted,
      color: afkColors.warning,
    };
  }

  if (job.enabled) {
    return {
      label: 'Active',
      bg: afkColors.accentMuted,
      color: afkColors.accent,
    };
  }

  return {
    label: 'Paused',
    bg: afkColors.surfaceElevated,
    color: afkColors.textTertiary,
  };
}

const ScheduledJobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: job, isLoading: jobLoading } = useScheduledJob(id || '');
  const { data: runs = [], isLoading: runsLoading } = useScheduledJobRuns(
    id || '',
  );
  const {
    updateJob,
    isUpdating,
    updateError,
    deleteJob,
    isDeleting,
    deleteError,
    triggerJob,
    isTriggering,
    triggerError,
  } = useScheduledJobs();
  const [selectedRunId, setSelectedRunId] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const selectedRun = React.useMemo(
    () => runs.find((run) => run.id === selectedRunId) ?? null,
    [runs, selectedRunId],
  );
  useScheduledJobRunStream(
    id || '',
    selectedRunId,
    selectedRun?.status === ScheduledJobRunStatus.RUNNING,
  );

  const tabParam = searchParams.get('tab') as TabKey | null;
  const activeTab = TAB_KEYS.indexOf(
    tabParam && TAB_KEYS.includes(tabParam) ? tabParam : 'settings',
  );
  const actionError = updateError || deleteError || triggerError;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    const next = new URLSearchParams(searchParams);
    if (newValue === 0) {
      next.delete('tab');
    } else {
      next.set('tab', TAB_KEYS[newValue]);
    }
    setSearchParams(next, { replace: true });
  };

  const handleRunNow = async () => {
    if (!job) {
      return;
    }

    await triggerJob(job.id);

    const next = new URLSearchParams(searchParams);
    next.set('tab', 'history');
    setSearchParams(next, { replace: true });
  };

  const handleToggleEnabled = async () => {
    if (!job) {
      return;
    }

    await updateJob({
      id: job.id,
      request: { enabled: !job.enabled },
    });
  };

  const handleDelete = async () => {
    if (!job) {
      return;
    }

    await deleteJob(job.id);
    navigate(ROUTES.SCHEDULED_JOBS);
  };

  if (jobLoading) {
    return (
      <Box sx={{ p: 3, width: '100%' }}>
        <Skeleton variant="text" width={120} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="text" width={250} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={300} height={20} sx={{ mb: 3 }} />
        <Skeleton
          variant="rectangular"
          height={300}
          sx={{ borderRadius: '8px' }}
        />
      </Box>
    );
  }

  if (!job) {
    return (
      <Box sx={{ p: 3, width: '100%' }}>
        <Button
          component={Link}
          to={ROUTES.SCHEDULED_JOBS}
          variant="text"
          size="small"
          startIcon={<ArrowBackIcon />}
          sx={{ color: afkColors.textSecondary, mb: 3 }}
        >
          Back
        </Button>
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '1rem',
            color: afkColors.textTertiary,
          }}
        >
          Job not found
        </Typography>
      </Box>
    );
  }

  const jobChip = getJobChipConfig(job);

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

      {actionError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {actionError.message || 'Failed to update scheduled job.'}
        </Alert>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h3">{job.name}</Typography>
          <Chip
            label={jobChip.label}
            size="small"
            sx={{
              bgcolor: jobChip.bg,
              color: jobChip.color,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.6875rem',
              fontWeight: 500,
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            component={Link}
            to={ROUTES.getEditScheduledJob(job.id)}
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            disabled={isUpdating || isDeleting || isTriggering}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<RunNowIcon />}
            onClick={() => {
              void handleRunNow();
            }}
            disabled={isUpdating || isDeleting || isTriggering}
          >
            Run Now
          </Button>
          <Button
            variant="outlined"
            size="small"
            color={job.enabled ? 'warning' : 'success'}
            startIcon={job.enabled ? <PauseIcon /> : <PlayIcon />}
            onClick={() => {
              void handleToggleEnabled();
            }}
            disabled={isUpdating || isDeleting || isTriggering}
          >
            {job.enabled ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isUpdating || isDeleting || isTriggering}
          >
            Delete
          </Button>
        </Box>
      </Box>
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

      {activeTab === 0 && <SettingsTab job={job} />}
      {activeTab === 1 && (
        <HistoryTab
          runs={runs}
          isLoading={runsLoading}
          onViewOutput={(run) => setSelectedRunId(run.id)}
        />
      )}

      <RunOutputDialog
        run={selectedRun}
        open={!!selectedRun}
        onClose={() => setSelectedRunId(null)}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Scheduled Job?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`This will permanently remove "${job.name}" and stop future scheduled runs.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              void handleDelete();
            }}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Job'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const SettingsRow: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <Box
    sx={{
      display: 'flex',
      py: 1.5,
      borderBottom: `1px solid ${afkColors.border}`,
      '&:last-of-type': { borderBottom: 'none' },
    }}
  >
    <Typography
      sx={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '0.6875rem',
        fontWeight: 500,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: afkColors.textSecondary,
        width: 160,
        flexShrink: 0,
        pt: 0.25,
      }}
    >
      {label}
    </Typography>
    <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
  </Box>
);

const SettingsTab: React.FC<{ job: ScheduledJob }> = ({ job }) => {
  const scheduleLabel =
    job.scheduleType === 'cron'
      ? `Cron: ${job.cronExpression || '—'}`
      : formatIntervalLabel(job.intervalMs);

  return (
    <Box
      sx={{
        bgcolor: afkColors.surface,
        border: `1px solid ${afkColors.border}`,
        borderRadius: '8px',
        p: 3,
      }}
    >
      <SettingsRow label="Name">
        <Typography sx={{ fontSize: '0.875rem' }}>{job.name}</Typography>
      </SettingsRow>

      <SettingsRow label="Repository">
        <Typography
          sx={{
            fontSize: '0.875rem',
            fontFamily: '"JetBrains Mono", monospace',
            wordBreak: 'break-all',
          }}
        >
          {job.repoUrl}
        </Typography>
      </SettingsRow>

      <SettingsRow label="Branch">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={job.branch}
            size="small"
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.75rem',
              bgcolor: afkColors.surfaceElevated,
              color: afkColors.textPrimary,
            }}
          />
          {job.createNewBranch && (
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: afkColors.textTertiary,
              }}
            >
              New branch: {job.newBranchPrefix || job.branch}-YYYY-MM-DD-HHmmss
            </Typography>
          )}
        </Box>
      </SettingsRow>

      <SettingsRow label="Image">
        <Typography
          sx={{
            fontSize: '0.8125rem',
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          {job.imageId}
        </Typography>
      </SettingsRow>

      <SettingsRow label="Model">
        <Typography sx={{ fontSize: '0.875rem' }}>
          {getClaudeModelLabel(job.model)}
        </Typography>
      </SettingsRow>

      <SettingsRow label="Schedule">
        <Typography sx={{ fontSize: '0.875rem' }}>{scheduleLabel}</Typography>
      </SettingsRow>

      <SettingsRow label="Prompt">
        <Box
          sx={{
            bgcolor: afkColors.surfaceElevated,
            borderRadius: '6px',
            p: 2,
            border: `1px solid ${afkColors.border}`,
          }}
        >
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.8125rem',
              color: afkColors.textPrimary,
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
            }}
          >
            {job.prompt}
          </Typography>
        </Box>
      </SettingsRow>

      <SettingsRow label="Options">
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={job.commitAndPush ? 'Commit & Push' : 'No commit'}
            size="small"
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.6875rem',
              bgcolor: job.commitAndPush
                ? afkColors.accentMuted
                : afkColors.surfaceElevated,
              color: job.commitAndPush
                ? afkColors.accent
                : afkColors.textTertiary,
            }}
          />
        </Box>
      </SettingsRow>

      {job.lastRunAt && (
        <SettingsRow label="Last Run">
          <Typography
            sx={{ fontSize: '0.875rem', color: afkColors.textSecondary }}
          >
            {new Date(job.lastRunAt).toLocaleString()}
          </Typography>
        </SettingsRow>
      )}

      {job.nextRunAt && (
        <SettingsRow label="Next Run">
          <Typography
            sx={{ fontSize: '0.875rem', color: afkColors.textSecondary }}
          >
            {new Date(job.nextRunAt).toLocaleString()}
          </Typography>
        </SettingsRow>
      )}
    </Box>
  );
};

function formatIntervalLabel(ms?: number): string {
  if (!ms) return '—';
  if (ms >= 86400000) {
    const days = Math.round(ms / 86400000);
    return `Every ${days} day${days > 1 ? 's' : ''}`;
  }
  if (ms >= 3600000) {
    const hours = Math.round(ms / 3600000);
    return `Every ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  if (ms >= 60000) {
    const minutes = Math.round(ms / 60000);
    return `Every ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  return `Every ${Math.round(ms / 1000)} seconds`;
}

function formatDuration(ms?: number): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

const RunStatusChip: React.FC<{ status: ScheduledJobRun['status'] }> = ({
  status,
}) => {
  const config: Record<
    string,
    { color: string; bg: string; icon: React.ReactNode; label: string }
  > = {
    [ScheduledJobRunStatus.COMPLETED]: {
      color: afkColors.accent,
      bg: afkColors.accentMuted,
      icon: <CheckIcon sx={{ fontSize: 14 }} />,
      label: 'Completed',
    },
    [ScheduledJobRunStatus.FAILED]: {
      color: afkColors.danger,
      bg: afkColors.dangerMuted,
      icon: <FailedIcon sx={{ fontSize: 14 }} />,
      label: 'Failed',
    },
    [ScheduledJobRunStatus.RUNNING]: {
      color: afkColors.warning,
      bg: afkColors.warningMuted,
      icon: <RunningIcon sx={{ fontSize: 14 }} />,
      label: 'Running',
    },
    [ScheduledJobRunStatus.PENDING]: {
      color: afkColors.textTertiary,
      bg: afkColors.surfaceElevated,
      icon: <PendingIcon sx={{ fontSize: 14 }} />,
      label: 'Pending',
    },
  };

  const c = config[status] || config[ScheduledJobRunStatus.PENDING];

  return (
    <Chip
      icon={<>{c.icon}</>}
      label={c.label}
      size="small"
      sx={{
        bgcolor: c.bg,
        color: c.color,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '0.6875rem',
        fontWeight: 500,
        '& .MuiChip-icon': { color: c.color },
      }}
    />
  );
};

const HistoryTab: React.FC<{
  runs: ScheduledJobRun[];
  isLoading: boolean;
  onViewOutput: (run: ScheduledJobRun) => void;
}> = ({ runs, isLoading, onViewOutput }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={48}
            sx={{ borderRadius: '6px' }}
          />
        ))}
      </Box>
    );
  }

  if (runs.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <PendingIcon
          sx={{ fontSize: 40, color: afkColors.textTertiary, opacity: 0.5 }}
        />
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.875rem',
            color: afkColors.textTertiary,
          }}
        >
          No runs yet
        </Typography>
        <Typography
          sx={{
            fontSize: '0.8125rem',
            color: afkColors.textTertiary,
            maxWidth: 360,
          }}
        >
          Runs will appear here once the job has been triggered or executed on
          schedule.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer
      sx={{
        bgcolor: afkColors.surface,
        border: `1px solid ${afkColors.border}`,
        borderRadius: '8px',
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Branch</TableCell>
            <TableCell align="right">Files</TableCell>
            <TableCell align="center">Committed</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {runs.map((run) => (
            <TableRow
              key={run.id}
              sx={{
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' },
                '&:last-child td': { borderBottom: 'none' },
              }}
            >
              <TableCell>
                <Typography
                  sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.75rem',
                    color: afkColors.textPrimary,
                  }}
                >
                  {run.startedAt
                    ? new Date(run.startedAt).toLocaleString()
                    : run.createdAt
                      ? new Date(run.createdAt).toLocaleString()
                      : '—'}
                </Typography>
              </TableCell>
              <TableCell>
                <RunStatusChip status={run.status} />
              </TableCell>
              <TableCell>
                <Typography
                  sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.75rem',
                    color: afkColors.textSecondary,
                  }}
                >
                  {formatDuration(run.durationMs)}
                </Typography>
              </TableCell>
              <TableCell>
                {run.branch ? (
                  <Chip
                    label={run.branch}
                    size="small"
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '0.6875rem',
                      bgcolor: afkColors.surfaceElevated,
                      color: afkColors.textSecondary,
                      maxWidth: 180,
                    }}
                  />
                ) : (
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      color: afkColors.textTertiary,
                    }}
                  >
                    —
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <Typography
                  sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.75rem',
                    color: afkColors.textSecondary,
                  }}
                >
                  {run.filesChanged != null ? run.filesChanged : '—'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                {run.committed ? (
                  <Chip
                    label={run.commitSha ? run.commitSha.slice(0, 7) : 'Yes'}
                    size="small"
                    sx={{
                      bgcolor: afkColors.accentMuted,
                      color: afkColors.accent,
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '0.6875rem',
                    }}
                  />
                ) : (
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      color: afkColors.textTertiary,
                    }}
                  >
                    —
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  onClick={() => onViewOutput(run)}
                  title="View output"
                  sx={{
                    color: afkColors.textTertiary,
                    '&:hover': { color: afkColors.textPrimary },
                  }}
                >
                  <ViewIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export { ScheduledJobDetails };
