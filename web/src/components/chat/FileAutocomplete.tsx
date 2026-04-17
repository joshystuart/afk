import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { FolderOutlined as FolderIcon } from '@mui/icons-material';
import Fuse from 'fuse.js';
import { afkColors } from '../../themes/afk';

interface FileAutocompleteProps {
  files: string[];
  filter: string;
  onSelect: (path: string) => void;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}

interface FileItem {
  path: string;
}

const MAX_RESULTS = 20;

const getDisplayName = (path: string): string => {
  const trimmed = path.endsWith('/') ? path.slice(0, -1) : path;
  const parts = trimmed.split('/');
  return parts[parts.length - 1] || path;
};

const isFolder = (path: string): boolean => path.endsWith('/');

export const FileAutocomplete: React.FC<FileAutocompleteProps> = ({
  files,
  filter,
  onSelect,
  onClose,
  anchorEl,
}) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const fuse = React.useMemo(() => {
    const items: FileItem[] = files.map((path) => ({ path }));
    return new Fuse(items, {
      keys: ['path'],
      threshold: 0.4,
      distance: 200,
      includeScore: true,
      shouldSort: true,
    });
  }, [files]);

  const filtered = React.useMemo<FileItem[]>(() => {
    if (!filter) {
      return files.slice(0, MAX_RESULTS).map((path) => ({ path }));
    }
    return fuse.search(filter).slice(0, MAX_RESULTS).map((r) => r.item);
  }, [fuse, filter, files]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  React.useEffect(() => {
    if (!anchorEl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === 'Enter' && filtered.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        onSelect(filtered[selectedIndex].path);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab') {
        if (filtered.length > 0) {
          e.preventDefault();
          onSelect(filtered[selectedIndex].path);
        } else {
          onClose();
        }
      }
    };

    anchorEl.addEventListener('keydown', handleKeyDown, true);
    return () => anchorEl.removeEventListener('keydown', handleKeyDown, true);
  }, [anchorEl, filtered, selectedIndex, onSelect, onClose]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (anchorEl && !anchorEl.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [anchorEl, onClose]);

  const listRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const selected = container.children[selectedIndex] as HTMLElement;
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!anchorEl) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        mb: 0.5,
        bgcolor: afkColors.surface,
        border: `1px solid ${afkColors.border}`,
        borderRadius: '8px',
        maxHeight: 240,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1300,
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          borderBottom: `1px solid ${afkColors.border}`,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            color: afkColors.textTertiary,
            fontSize: '0.625rem',
            letterSpacing: '0.08em',
          }}
        >
          Files
        </Typography>
      </Box>

      <Box ref={listRef} sx={{ overflowY: 'auto', py: 0.5 }}>
        {filtered.length === 0 ? (
          <Box sx={{ px: 1.5, py: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: afkColors.textTertiary }}
            >
              {files.length === 0 ? 'No files indexed' : 'No matching files'}
            </Typography>
          </Box>
        ) : (
          filtered.map((item, index) => {
            const folder = isFolder(item.path);
            const displayName = getDisplayName(item.path);
            return (
              <Box
                key={item.path}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(item.path);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  minWidth: 0,
                  bgcolor:
                    index === selectedIndex
                      ? afkColors.accentMuted
                      : 'transparent',
                  '&:hover': {
                    bgcolor: afkColors.accentMuted,
                  },
                }}
              >
                {folder && (
                  <FolderIcon
                    sx={{
                      fontSize: '14px',
                      color: afkColors.accent,
                      flexShrink: 0,
                    }}
                  />
                )}
                <Typography
                  component="span"
                  sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    color: afkColors.accent,
                    flexShrink: 0,
                  }}
                >
                  {displayName}
                </Typography>
                <Typography
                  component="span"
                  noWrap
                  sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.7rem',
                    color: afkColors.textSecondary,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.path}
                </Typography>
              </Box>
            );
          })
        )}
      </Box>
    </Paper>
  );
};
