import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import { afkColors } from '../themes/afk';

const CreateScheduledJob: React.FC = () => {
  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: 720 }}>
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

      <Typography variant="h3" sx={{ mb: 3 }}>
        Create Scheduled Job
      </Typography>

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
          Job creation form coming in Phase 4
        </Typography>
      </Box>
    </Box>
  );
};

export { CreateScheduledJob };
