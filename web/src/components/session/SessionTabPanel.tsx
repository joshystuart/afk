import React from 'react';
import { Box } from '@mui/material';

interface SessionTabPanelProps {
  active: boolean;
  children: React.ReactNode;
}

export const SessionTabPanel: React.FC<SessionTabPanelProps> = ({
  active,
  children,
}) => (
  <Box
    sx={{
      display: active ? 'flex' : 'none',
      flex: 1,
      minHeight: 0,
      flexDirection: 'column',
      overflow: 'hidden',
    }}
  >
    {children}
  </Box>
);
