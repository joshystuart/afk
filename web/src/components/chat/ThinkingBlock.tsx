import React from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import { afkColors } from '../../themes/afk';

interface ThinkingBlockProps {
  thinking: string;
  defaultExpanded?: boolean;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  thinking,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <Box
      sx={{
        border: `1px solid ${afkColors.borderSubtle}`,
        borderRadius: 1,
        overflow: 'hidden',
        my: 0.5,
      }}
    >
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          py: 0.75,
          cursor: 'pointer',
          bgcolor: 'rgba(255,255,255,0.02)',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: afkColors.textTertiary,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            flex: 1,
          }}
        >
          Thinking
        </Typography>
        <IconButton size="small" sx={{ p: 0, color: afkColors.textTertiary }}>
          {expanded ? (
            <CollapseIcon fontSize="small" />
          ) : (
            <ExpandIcon fontSize="small" />
          )}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ px: 1.5, pb: 1.5 }}>
          <Typography
            variant="body2"
            sx={{
              color: afkColors.textSecondary,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.75rem',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
            }}
          >
            {thinking}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
};
