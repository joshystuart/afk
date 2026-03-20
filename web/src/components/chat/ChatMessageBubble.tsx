import React, { useState, useCallback } from 'react';
import { Box, Typography, ButtonBase, CircularProgress } from '@mui/material';
import {
  UnfoldMore as ExpandIcon,
  UnfoldLess as CollapseIcon,
} from '@mui/icons-material';
import { afkColors } from '../../themes/afk';
import { AssistantEventList } from './AssistantEventList';
import { StreamingIndicator } from './StreamingIndicator';
import { MarkdownContent } from './MarkdownContent';
import { sessionsApi } from '../../api/sessions.api';
import type { ChatStreamEvent } from '../../api/types';

interface ChatMessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  streamEvents?: ChatStreamEvent[];
  costUsd?: number;
  durationMs?: number;
  isStreaming?: boolean;
  sessionId?: string;
  messageId?: string;
  streamEventCount?: number;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  role,
  content,
  streamEvents,
  costUsd,
  durationMs,
  isStreaming = false,
  sessionId,
  messageId,
  streamEventCount,
}) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [loadedEvents, setLoadedEvents] = useState<ChatStreamEvent[] | null>(
    null,
  );
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [transcriptLoadError, setTranscriptLoadError] = useState<string | null>(
    null,
  );

  const hasArchivedTranscript =
    !streamEvents?.length && (streamEventCount ?? 0) > 0;

  const handleToggleTranscript = useCallback(async () => {
    if (showTranscript) {
      setShowTranscript(false);
      return;
    }

    if (!loadedEvents && sessionId && messageId) {
      setIsLoadingTranscript(true);
      setTranscriptLoadError(null);
      try {
        const events = await sessionsApi.getMessageStream(sessionId, messageId);
        setLoadedEvents(events);
        setShowTranscript(true);
      } catch (err) {
        console.error('Failed to load transcript:', err);
        setTranscriptLoadError('Unable to load transcript. Please try again.');
      } finally {
        setIsLoadingTranscript(false);
      }
      return;
    }
    setTranscriptLoadError(null);
    setShowTranscript(true);
  }, [showTranscript, loadedEvents, sessionId, messageId]);

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

  const displayEvents = streamEvents || (showTranscript ? loadedEvents : null);

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
        {displayEvents && displayEvents.length > 0 ? (
          <AssistantEventList
            events={displayEvents}
            isStreaming={isStreaming}
          />
        ) : isStreaming ? (
          <StreamingIndicator />
        ) : (
          <MarkdownContent content={content} />
        )}

        {hasArchivedTranscript && (
          <Box
            sx={{
              mt: 1,
              pt: 1,
              borderTop: `1px solid ${afkColors.borderSubtle}`,
            }}
          >
            <ButtonBase
              onClick={() => {
                void handleToggleTranscript();
              }}
              disabled={isLoadingTranscript}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                color: afkColors.textTertiary,
                fontSize: '0.6875rem',
                fontFamily: '"JetBrains Mono", monospace',
                '&:hover': {
                  color: afkColors.textSecondary,
                  bgcolor: 'rgba(255, 255, 255, 0.04)',
                },
              }}
            >
              {isLoadingTranscript ? (
                <CircularProgress size={12} sx={{ color: 'inherit' }} />
              ) : showTranscript ? (
                <CollapseIcon sx={{ fontSize: 14 }} />
              ) : (
                <ExpandIcon sx={{ fontSize: 14 }} />
              )}
              {isLoadingTranscript
                ? 'Loading transcript...'
                : showTranscript
                  ? 'Hide transcript'
                  : 'Show transcript'}
            </ButtonBase>
            {transcriptLoadError && !showTranscript && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  px: 1,
                  color: afkColors.danger,
                  fontSize: '0.6875rem',
                }}
              >
                {transcriptLoadError}
              </Typography>
            )}
          </Box>
        )}

        {!isStreaming && (costUsd != null || durationMs != null) && (
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mt: 1,
              pt: hasArchivedTranscript ? 0 : 1,
              borderTop: hasArchivedTranscript
                ? 'none'
                : `1px solid ${afkColors.borderSubtle}`,
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
