import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { afkColors } from '../../themes/afk';
import {
  ScheduledJobRunStatus,
  type ScheduledJobRun,
  type ChatStreamEvent,
} from '../../api/types';
import { scheduledJobsApi } from '../../api/scheduled-jobs.api';
import { AssistantEventList } from '../chat/AssistantEventList';

const RunOutputContent: React.FC<{ run: ScheduledJobRun }> = ({ run }) => {
  const [loadedEvents, setLoadedEvents] = useState<ChatStreamEvent[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const events = run.streamEvents || loadedEvents;
  const isRunning = run.status === ScheduledJobRunStatus.RUNNING;
  const hasArchivedEvents =
    !run.streamEvents?.length && (run.streamEventCount ?? 0) > 0;

  useEffect(() => {
    if (!hasArchivedEvents || isRunning) return;

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    scheduledJobsApi
      .getRunStream(run.id)
      .then((result) => {
        if (!cancelled) setLoadedEvents(result);
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [run.id, hasArchivedEvents, isRunning]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          gap: 1.5,
        }}
      >
        <CircularProgress size={16} sx={{ color: afkColors.textTertiary }} />
        <Typography
          sx={{
            color: afkColors.textTertiary,
            fontSize: '0.8125rem',
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          Loading run output...
        </Typography>
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: '6px',
          bgcolor: afkColors.dangerMuted,
          border: `1px solid rgba(239, 68, 68, 0.2)`,
        }}
      >
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.8125rem',
            color: '#fca5a5',
          }}
        >
          Failed to load run output: {loadError}
        </Typography>
      </Box>
    );
  }

  if (run.errorMessage && !events?.length) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: '6px',
          bgcolor: afkColors.dangerMuted,
          border: `1px solid rgba(239, 68, 68, 0.2)`,
        }}
      >
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.8125rem',
            color: '#fca5a5',
            whiteSpace: 'pre-wrap',
          }}
        >
          {run.errorMessage}
        </Typography>
      </Box>
    );
  }

  if (!events?.length) {
    return (
      <Typography
        sx={{
          color: afkColors.textTertiary,
          fontSize: '0.875rem',
          fontStyle: 'italic',
        }}
      >
        No output captured for this run.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <AssistantEventList events={events} isStreaming={isRunning} />

      {run.errorMessage && (
        <Box
          sx={{
            mt: 1,
            p: 2,
            borderRadius: '6px',
            bgcolor: afkColors.dangerMuted,
            border: `1px solid rgba(239, 68, 68, 0.2)`,
          }}
        >
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.75rem',
              color: '#fca5a5',
              whiteSpace: 'pre-wrap',
            }}
          >
            {run.errorMessage}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export const RunOutputDialog: React.FC<{
  run: ScheduledJobRun | null;
  open: boolean;
  onClose: () => void;
}> = ({ run, open, onClose }) => {
  if (!run) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: afkColors.surface,
          maxHeight: '85vh',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          borderBottom: `1px solid ${afkColors.border}`,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            Run Output
          </Typography>
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.6875rem',
              color: afkColors.textTertiary,
              mt: 0.25,
            }}
          >
            {run.id.slice(0, 8)} &middot;{' '}
            {run.startedAt
              ? new Date(run.startedAt).toLocaleString()
              : 'Unknown'}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: afkColors.textTertiary }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: 3 }}>
        <RunOutputContent run={run} />
      </DialogContent>
    </Dialog>
  );
};

export { RunOutputContent };
