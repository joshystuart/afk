import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import { afkColors } from '../../themes/afk';

const pulse = keyframes`
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
`;

export const StreamingIndicator: React.FC = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, px: 2 }}>
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: afkColors.accent,
            animation: `${pulse} 1.4s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </Box>
    <Typography variant="caption" sx={{ color: afkColors.textSecondary }}>
      Claude is working...
    </Typography>
  </Box>
);
