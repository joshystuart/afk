import React, { useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SystemUpdateAlt as UpdateIcon } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { afkColors } from '../themes/afk';
import { useUpdateState } from '../hooks/useUpdateState';

const UpdateReadyBanner: React.FC = () => {
  const state = useUpdateState();

  const handleInstall = useCallback(() => {
    void window.electronAPI?.updater?.install();
  }, []);

  const visible = state.status === 'downloaded';

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
              bgcolor: afkColors.accentMuted,
              borderBottom: `1px solid rgba(16, 185, 129, 0.2)`,
            }}
          >
            <UpdateIcon
              sx={{ fontSize: 16, color: afkColors.accent, flexShrink: 0 }}
            />
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: afkColors.accentLight,
                flex: 1,
              }}
            >
              AFK {state.version ? `v${state.version} ` : ''}update is ready to
              install.
            </Typography>
            <Button
              size="small"
              onClick={handleInstall}
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: afkColors.accentLight,
                minWidth: 'auto',
                px: 1.5,
                py: 0.25,
                '&:hover': {
                  bgcolor: 'rgba(16, 185, 129, 0.15)',
                },
              }}
            >
              Restart to update
            </Button>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { UpdateReadyBanner };
