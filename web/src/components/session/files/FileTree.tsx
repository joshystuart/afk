import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import type { FileEntry } from '../../../api/types';
import { afkColors } from '../../../themes/afk';
import { useFileTree } from '../../../hooks/useFileTree';
import { FileTreeItem } from './FileTreeItem';

interface FileTreeProps {
  sessionId: string;
  onFileSelect: (path: string) => void;
  selectedFile: string | null;
}

const sortEntries = (entries: FileEntry[]): FileEntry[] => {
  return [...entries].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
};

interface TreeNodeProps {
  sessionId: string;
  path: string;
  depth: number;
  enabled: boolean;
  expandedDirs: Set<string>;
  toggleDir: (path: string) => void;
  onFileSelect: (path: string) => void;
  selectedFile: string | null;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  sessionId,
  path,
  depth,
  enabled,
  expandedDirs,
  toggleDir,
  onFileSelect,
  selectedFile,
}) => {
  const { data, isLoading, isError, error } = useFileTree(
    sessionId,
    path,
    enabled,
  );

  if (!enabled) return null;

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pl: `${depth * 16 + 24}px`,
          py: 0.5,
        }}
      >
        <CircularProgress size={14} sx={{ color: afkColors.textTertiary }} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Typography
        sx={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.75rem',
          color: afkColors.danger,
          pl: `${depth * 16 + 24}px`,
          py: 0.5,
        }}
      >
        {(error as Error)?.message ?? 'Failed to load directory'}
      </Typography>
    );
  }

  const entries = sortEntries(data?.entries ?? []);

  if (depth === 0 && entries.length === 0) {
    return (
      <Typography
        sx={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.8rem',
          color: afkColors.textTertiary,
          px: 2,
          py: 2,
          textAlign: 'center',
        }}
      >
        No files found
      </Typography>
    );
  }

  return (
    <>
      {entries.map((entry) => {
        const expanded = expandedDirs.has(entry.path);
        const isSelected = entry.type === 'file' && selectedFile === entry.path;
        return (
          <React.Fragment key={entry.path}>
            <FileTreeItem
              entry={entry}
              depth={depth}
              expanded={expanded}
              selected={isSelected}
              onToggle={() => toggleDir(entry.path)}
              onSelect={() => onFileSelect(entry.path)}
            />
            {entry.type === 'directory' && expanded && (
              <TreeNode
                sessionId={sessionId}
                path={entry.path}
                depth={depth + 1}
                enabled={true}
                expandedDirs={expandedDirs}
                toggleDir={toggleDir}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

const FileTreeComponent: React.FC<FileTreeProps> = ({
  sessionId,
  onFileSelect,
  selectedFile,
}) => {
  const [expandedDirs, setExpandedDirs] = React.useState<Set<string>>(
    () => new Set(),
  );

  const toggleDir = React.useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        py: 0.5,
      }}
    >
      <TreeNode
        sessionId={sessionId}
        path="/"
        depth={0}
        enabled={true}
        expandedDirs={expandedDirs}
        toggleDir={toggleDir}
        onFileSelect={onFileSelect}
        selectedFile={selectedFile}
      />
    </Box>
  );
};

export const FileTree = React.memo(FileTreeComponent);
FileTree.displayName = 'FileTree';
