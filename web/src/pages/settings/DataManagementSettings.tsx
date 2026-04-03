import React, { useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import {
  DeleteForever as DeleteForeverIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { afkColors } from '../../themes/afk';
import { sessionsApi } from '../../api/sessions.api';
import { scheduledJobsApi } from '../../api/scheduled-jobs.api';
import { DataClearConfirmDialog } from '../../components/DataClearConfirmDialog';

const DangerSectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Box
    sx={{
      borderLeft: `2px solid ${afkColors.danger}`,
      pl: 2,
      mb: 2.5,
    }}
  >
    <Typography variant="h5" sx={{ color: afkColors.textPrimary }}>
      {title}
    </Typography>
  </Box>
);

const DataManagementSettings: React.FC = () => {
  const [confirmDialog, setConfirmDialog] = useState<
    'sessions' | 'jobs' | 'prepare-uninstall' | null
  >(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [prepareUninstallLoading, setPrepareUninstallLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleClearSessions = async () => {
    setSessionsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const result = await sessionsApi.clearAll();
      setConfirmDialog(null);
      const parts: string[] = [];
      if (result.stopped > 0) parts.push(`${result.stopped} stopped`);
      if (result.deleted > 0) parts.push(`${result.deleted} deleted`);
      if (result.failed > 0) parts.push(`${result.failed} failed`);
      setSuccessMessage(
        parts.length > 0
          ? `Sessions cleared: ${parts.join(', ')}.`
          : 'No sessions to clear.',
      );
    } catch {
      setConfirmDialog(null);
      setErrorMessage(
        'Failed to clear sessions. Check server logs for details.',
      );
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleClearJobs = async () => {
    setJobsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const result = await scheduledJobsApi.clearAll();
      setConfirmDialog(null);
      const parts: string[] = [];
      if (result.deleted > 0) parts.push(`${result.deleted} deleted`);
      if (result.failed > 0) parts.push(`${result.failed} failed`);
      setSuccessMessage(
        parts.length > 0
          ? `Scheduled jobs cleared: ${parts.join(', ')}.`
          : 'No scheduled jobs to clear.',
      );
    } catch {
      setConfirmDialog(null);
      setErrorMessage(
        'Failed to clear scheduled jobs. Check server logs for details.',
      );
    } finally {
      setJobsLoading(false);
    }
  };

  const handlePrepareForUninstall = async () => {
    setPrepareUninstallLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const result = await scheduledJobsApi.prepareForUninstall();
      setConfirmDialog(null);
      const parts: string[] = [];
      if (result.disabledJobs > 0) {
        parts.push(`${result.disabledJobs} job(s) disabled`);
      }
      if (result.removedLaunchAgents > 0) {
        parts.push(`${result.removedLaunchAgents} LaunchAgent(s) removed`);
      }
      setSuccessMessage(
        parts.length > 0
          ? `AFK is ready for uninstall: ${parts.join(', ')}. You can now remove the app from /Applications.`
          : 'AFK was already ready for uninstall. You can now remove the app from /Applications.',
      );
    } catch {
      setConfirmDialog(null);
      setErrorMessage(
        'Failed to prepare AFK for uninstall. Check server logs for details.',
      );
    } finally {
      setPrepareUninstallLoading(false);
    }
  };

  return (
    <Box>
      {errorMessage && (
        <Alert
          severity="error"
          onClose={() => setErrorMessage('')}
          sx={{ mb: 3 }}
        >
          {errorMessage}
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

      <DangerSectionHeader title="Data Management" />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Clear Sessions */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body1"
              sx={{ color: afkColors.textPrimary, fontWeight: 500 }}
            >
              Clear All Sessions
            </Typography>
            <Typography variant="body2" sx={{ color: afkColors.textSecondary }}>
              Stops running sessions and deletes all sessions, containers,
              volumes, and chat history.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={
              <DeleteForeverIcon sx={{ fontSize: '16px !important' }} />
            }
            onClick={() => setConfirmDialog('sessions')}
            sx={{
              color: afkColors.danger,
              borderColor: afkColors.danger,
              flexShrink: 0,
              '&:hover': {
                borderColor: '#dc2626',
                bgcolor: afkColors.dangerMuted,
              },
            }}
          >
            Clear Sessions
          </Button>
        </Box>

        {/* Clear Jobs */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body1"
              sx={{ color: afkColors.textPrimary, fontWeight: 500 }}
            >
              Clear All Scheduled Jobs
            </Typography>
            <Typography variant="body2" sx={{ color: afkColors.textSecondary }}>
              Deletes all scheduled jobs, run history, scheduler registrations,
              and launchd plists.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={
              <DeleteForeverIcon sx={{ fontSize: '16px !important' }} />
            }
            onClick={() => setConfirmDialog('jobs')}
            sx={{
              color: afkColors.danger,
              borderColor: afkColors.danger,
              flexShrink: 0,
              '&:hover': {
                borderColor: '#dc2626',
                bgcolor: afkColors.dangerMuted,
              },
            }}
          >
            Clear Jobs
          </Button>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body1"
              sx={{ color: afkColors.textPrimary, fontWeight: 500 }}
            >
              Prepare for Uninstall
            </Typography>
            <Typography variant="body2" sx={{ color: afkColors.textSecondary }}>
              Disables scheduled jobs and removes AFK launchd LaunchAgents so
              the desktop app can be safely removed from /Applications without
              relaunching itself.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={
              <DeleteForeverIcon sx={{ fontSize: '16px !important' }} />
            }
            onClick={() => setConfirmDialog('prepare-uninstall')}
            sx={{
              color: afkColors.danger,
              borderColor: afkColors.danger,
              flexShrink: 0,
              '&:hover': {
                borderColor: '#dc2626',
                bgcolor: afkColors.dangerMuted,
              },
            }}
          >
            Prepare for Uninstall
          </Button>
        </Box>
      </Box>

      <DataClearConfirmDialog
        open={confirmDialog !== null}
        onClose={() => setConfirmDialog(null)}
        onConfirm={
          confirmDialog === 'sessions'
            ? handleClearSessions
            : confirmDialog === 'jobs'
              ? handleClearJobs
              : handlePrepareForUninstall
        }
        type={confirmDialog ?? 'sessions'}
        isLoading={sessionsLoading || jobsLoading || prepareUninstallLoading}
      />
    </Box>
  );
};

export { DataManagementSettings };
