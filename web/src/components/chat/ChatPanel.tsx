import React from 'react';
import { Box, Typography } from '@mui/material';
import { afkColors } from '../../themes/afk';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatInput } from './ChatInput';
import { StreamingIndicator } from './StreamingIndicator';
import { useChat } from '../../hooks/useChat';

interface ChatPanelProps {
  sessionId: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId }) => {
  const {
    messages,
    streamingEvents,
    isProcessing,
    isLoadingHistory,
    sendMessage,
    cancelExecution,
  } = useChat(sessionId);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingEvents]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: afkColors.background,
      }}
    >
      {/* Messages area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 3,
          py: 2,
          scrollbarColor: `${afkColors.surfaceElevated} transparent`,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: afkColors.surfaceElevated,
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        }}
      >
        {isLoadingHistory ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              py: 4,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: afkColors.textTertiary }}
            >
              Loading chat history...
            </Typography>
          </Box>
        ) : messages.length === 0 && !isProcessing ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 1,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: afkColors.textSecondary,
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              Ready to chat
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: afkColors.textTertiary, textAlign: 'center' }}
            >
              Send a message to start working with Claude in this session.
              <br />
              Claude has access to the repository and can edit files, run
              commands, and more.
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((msg, index) => (
              <ChatMessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                streamEvents={msg.streamEvents}
                costUsd={msg.costUsd}
                durationMs={msg.durationMs}
                isStreaming={
                  isProcessing &&
                  msg.role === 'assistant' &&
                  index === messages.length - 1
                }
              />
            ))}
            {isProcessing && streamingEvents.length > 0 && (
              <ChatMessageBubble
                role="assistant"
                content=""
                streamEvents={streamingEvents}
                isStreaming
              />
            )}
            {isProcessing && streamingEvents.length === 0 && (
              <StreamingIndicator />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input area */}
      <ChatInput
        onSend={sendMessage}
        onCancel={cancelExecution}
        isProcessing={isProcessing}
      />
    </Box>
  );
};
