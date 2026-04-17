import React from 'react';
import { Box, Button, Chip, Tooltip, Typography } from '@mui/material';
import { OpenInNew, WarningAmberRounded } from '@mui/icons-material';
import { afkColors } from '../../../themes/afk';

interface FilePreviewHeaderProps {
  filePath: string;
  language: string;
  truncated: boolean;
  binary: boolean;
  ideUrl: string | null;
}

export const FilePreviewHeader: React.FC<FilePreviewHeaderProps> = ({
  filePath,
  language,
  truncated,
  binary,
  ideUrl,
}) => {
  const handleOpenInIde = () => {
    if (!ideUrl) return;
    window.open(ideUrl, '_self');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        px: 2,
        py: 0.75,
        minHeight: 36,
        borderBottom: `1px solid ${afkColors.border}`,
        bgcolor: afkColors.surface,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flex: 1,
          minWidth: 0,
        }}
      >
        <Tooltip title={filePath} placement="bottom-start">
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.75rem',
              color: afkColors.textSecondary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              direction: 'rtl',
              textAlign: 'left',
            }}
          >
            {filePath}
          </Typography>
        </Tooltip>
        {!binary && language && (
          <Chip
            label={language}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.625rem',
              fontFamily: '"JetBrains Mono", monospace',
              bgcolor: afkColors.surfaceElevated,
              color: afkColors.textTertiary,
              border: `1px solid ${afkColors.border}`,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        )}
        {truncated && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <WarningAmberRounded
              sx={{ fontSize: 14, color: afkColors.warning }}
            />
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.6875rem',
                color: afkColors.warning,
              }}
            >
              File truncated (&gt;512KB)
            </Typography>
          </Box>
        )}
      </Box>

      {ideUrl !== null && (
        <Button
          size="small"
          startIcon={<OpenInNew sx={{ fontSize: '14px !important' }} />}
          onClick={handleOpenInIde}
          sx={{
            flexShrink: 0,
            fontSize: '0.75rem',
            color: afkColors.textSecondary,
            '&:hover': { color: afkColors.textPrimary },
          }}
        >
          Open in IDE
        </Button>
      )}
    </Box>
  );
};
