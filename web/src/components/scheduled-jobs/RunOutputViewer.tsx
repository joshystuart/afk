import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { afkColors } from '../../themes/afk';
import { ScheduledJobRunStatus, type ScheduledJobRun } from '../../api/types';
import { AssistantEventList } from '../chat/AssistantEventList';

const RunOutputContent: React.FC<{ run: ScheduledJobRun }> = ({ run }) => {
  if (run.errorMessage && !run.streamEvents?.length) {
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

  if (!run.streamEvents?.length) {
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
      <AssistantEventList
        events={run.streamEvents}
        isStreaming={run.status === ScheduledJobRunStatus.RUNNING}
      />

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
