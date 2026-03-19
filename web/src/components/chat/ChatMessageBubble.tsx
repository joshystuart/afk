import React from 'react';
import { Box, Typography } from '@mui/material';
import { afkColors } from '../../themes/afk';
import { AssistantEventList } from './AssistantEventList';
import { StreamingIndicator } from './StreamingIndicator';
import { MarkdownContent } from './MarkdownContent';
import type { ChatStreamEvent } from '../../api/types';

interface ChatMessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  streamEvents?: ChatStreamEvent[];
  costUsd?: number;
  durationMs?: number;
  isStreaming?: boolean;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  role,
  content,
  streamEvents,
  costUsd,
  durationMs,
  isStreaming = false,
}) => {
  if (role === 'user') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Box
          sx={{
            maxWidth: '75%',
            px: 2,
            py: 1.5,
            borderRadius: 2,
            bgcolor: afkColors.accentMuted,
            border: `1px solid rgba(16, 185, 129, 0.2)`,
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: afkColors.textPrimary, whiteSpace: 'pre-wrap' }}
          >
            {content}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          maxWidth: '90%',
          minWidth: 0,
          px: 2,
          py: 1.5,
          borderRadius: 2,
          bgcolor: afkColors.surface,
          border: `1px solid ${afkColors.border}`,
          overflow: 'hidden',
        }}
      >
        {streamEvents && streamEvents.length > 0 ? (
          <AssistantEventList events={streamEvents} isStreaming={isStreaming} />
        ) : isStreaming ? (
          <StreamingIndicator />
        ) : (
          <MarkdownContent content={content} />
        )}

        {!isStreaming && (costUsd != null || durationMs != null) && (
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mt: 1,
              pt: 1,
              borderTop: `1px solid ${afkColors.borderSubtle}`,
            }}
          >
            {durationMs != null && (
              <Typography
                variant="caption"
                sx={{
                  color: afkColors.textTertiary,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.65rem',
                }}
              >
                {(durationMs / 1000).toFixed(1)}s
              </Typography>
            )}
            {costUsd != null && (
              <Typography
                variant="caption"
                sx={{
                  color: afkColors.textTertiary,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.65rem',
                }}
              >
                ${costUsd.toFixed(4)}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};
