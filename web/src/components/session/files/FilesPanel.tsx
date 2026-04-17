import React from 'react';
import { Box } from '@mui/material';
import { afkColors } from '../../../themes/afk';
import { FileTree } from './FileTree';
import { FilePreview } from './FilePreview';

interface FilesPanelProps {
  sessionId: string;
  hostMountPath: string | null;
  ideCommand: string | null;
}

const TREE_WIDTH = 280;

export const FilesPanel: React.FC<FilesPanelProps> = ({
  sessionId,
  hostMountPath,
  ideCommand,
}) => {
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);

  return (
    <Box
      sx={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: afkColors.background,
      }}
    >
      <Box
        sx={{
          width: TREE_WIDTH,
          flexShrink: 0,
          borderRight: `1px solid ${afkColors.border}`,
          overflowY: 'auto',
          overflowX: 'hidden',
          bgcolor: afkColors.surface,
        }}
      >
        <FileTree
          sessionId={sessionId}
          onFileSelect={setSelectedFile}
          selectedFile={selectedFile}
        />
      </Box>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <FilePreview
          sessionId={sessionId}
          filePath={selectedFile}
          hostMountPath={hostMountPath}
          ideCommand={ideCommand}
        />
      </Box>
    </Box>
  );
};
