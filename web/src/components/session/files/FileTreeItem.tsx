import React from 'react';
import { Box, Typography } from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import type { FileEntry } from '../../../api/types';
import { afkColors } from '../../../themes/afk';
import { FileIcon } from './FileIcon';

interface FileTreeItemProps {
  entry: FileEntry;
  depth: number;
  expanded?: boolean;
  selected?: boolean;
  onToggle?: () => void;
  onSelect?: () => void;
}

const CHEVRON_SIZE = 14;
const ROW_HEIGHT = 22;
const INDENT_PX = 16;

export const FileTreeItem: React.FC<FileTreeItemProps> = ({
  entry,
  depth,
  expanded = false,
  selected = false,
  onToggle,
  onSelect,
}) => {
  const isDirectory = entry.type === 'directory';

  const handleClick = () => {
    if (isDirectory) {
      onToggle?.();
    } else {
      onSelect?.();
    }
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        cursor: 'pointer',
        pl: `${depth * INDENT_PX + 4}px`,
        pr: 1,
        height: ROW_HEIGHT,
        minHeight: ROW_HEIGHT,
        bgcolor: selected ? afkColors.accentMuted : 'transparent',
        color: selected ? afkColors.textPrimary : afkColors.textSecondary,
        userSelect: 'none',
        '&:hover': {
          bgcolor: selected
            ? afkColors.accentMuted
            : 'rgba(255, 255, 255, 0.04)',
        },
      }}
    >
      <Box
        sx={{
          width: CHEVRON_SIZE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isDirectory && (
          <ChevronRight
            sx={{
              fontSize: CHEVRON_SIZE,
              color: afkColors.textTertiary,
              transition: 'transform 120ms ease',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          />
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <FileIcon name={entry.name} type={entry.type} expanded={expanded} />
      </Box>
      <Typography
        sx={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.8rem',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: 'inherit',
        }}
      >
        {entry.name}
      </Typography>
    </Box>
  );
};
