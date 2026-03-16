import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { WarningAmber as WarningIcon } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useDockerHealth } from '../hooks/useDockerHealth';
import { afkColors } from '../themes/afk';

const DockerStatusBanner: React.FC = () => {
  const { isAvailable, isLoading, refetch } = useDockerHealth();

  const visible = !isLoading && isAvailable === false;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden', flexShrink: 0 }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 0.75,
              bgcolor: afkColors.warningMuted,
              borderBottom: `1px solid rgba(245, 158, 11, 0.2)`,
            }}
          >
            <WarningIcon
              sx={{ fontSize: 16, color: afkColors.warning, flexShrink: 0 }}
            />
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: '#fde68a',
                flex: 1,
              }}
            >
              Docker is not running — sessions cannot be created or started
              until Docker is available.
            </Typography>
            <Button
              size="small"
              onClick={refetch}
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: '#fde68a',
                minWidth: 'auto',
                px: 1.5,
                py: 0.25,
                '&:hover': {
                  bgcolor: 'rgba(245, 158, 11, 0.15)',
                },
              }}
            >
              Retry
            </Button>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DockerStatusBanner;
