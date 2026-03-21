import React from 'react';
import { Box, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { afkColors } from '../../themes/afk';
import { ChatMessageBubble } from './ChatMessageBubble';
import {
  ChatInput,
  DEFAULT_MODEL,
  DEFAULT_MODE,
  type ModelId,
  type ModeId,
} from './ChatInput';
import { StreamingIndicator } from './StreamingIndicator';
import { useChat } from '../../hooks/useChat';
import { sessionsApi } from '../../api/sessions.api';

interface ChatPanelProps {
  sessionId: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId }) => {
  const {
    messages,
    streamingEvents,
    isProcessing,
    isLoadingHistory,
    sendMessage: sendChatMessage,
    cancelExecution,
  } = useChat(sessionId);

  const queryClient = useQueryClient();
  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionsApi.getSession(sessionId),
    enabled: !!sessionId,
  });

  const [selectedModel, setSelectedModel] =
    React.useState<ModelId>(DEFAULT_MODEL);
  const [selectedMode, setSelectedMode] = React.useState<ModeId>(DEFAULT_MODE);
  const initializedForSessionRef = React.useRef<string | null>(null);
  const shouldJumpToBottomRef = React.useRef(true);
  const isPinnedToBottomRef = React.useRef(true);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (initializedForSessionRef.current !== sessionId) {
      initializedForSessionRef.current = null;
      setSelectedModel(DEFAULT_MODEL);
      setSelectedMode(DEFAULT_MODE);
    }
  }, [sessionId]);

  React.useEffect(() => {
    if (session && initializedForSessionRef.current !== sessionId) {
      setSelectedModel((session.model as ModelId) ?? DEFAULT_MODEL);
      setSelectedMode((session.permissionMode as ModeId) ?? DEFAULT_MODE);
      initializedForSessionRef.current = sessionId;
    }
  }, [session, sessionId]);

  React.useEffect(() => {
    shouldJumpToBottomRef.current = true;
    isPinnedToBottomRef.current = true;
  }, [sessionId]);

  const handleModelChange = React.useCallback(
    (model: ModelId) => {
      setSelectedModel(model);
      sessionsApi
        .updateSession(sessionId, { model })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
        })
        .catch((err) => {
          console.error('Failed to persist model selection:', err);
        });
    },
    [sessionId, queryClient],
  );

  const handleModeChange = React.useCallback(
    (permissionMode: ModeId) => {
      setSelectedMode(permissionMode);
      sessionsApi
        .updateSession(sessionId, { permissionMode })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
        })
        .catch((err) => {
          console.error('Failed to persist mode selection:', err);
        });
    },
    [sessionId, queryClient],
  );

  const updatePinnedToBottom = React.useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const distanceFromBottom =
      scrollContainer.scrollHeight -
      scrollContainer.scrollTop -
      scrollContainer.clientHeight;

    isPinnedToBottomRef.current = distanceFromBottom <= 48;
  }, []);

  const handleMessagesScroll = React.useCallback(() => {
    updatePinnedToBottom();
  }, [updatePinnedToBottom]);

  const handleSendMessage = React.useCallback(
    (
      content: string,
      continueConversation: boolean,
      model?: string,
      permissionMode?: string,
    ) => {
      shouldJumpToBottomRef.current = true;
      isPinnedToBottomRef.current = true;
      sendChatMessage(content, continueConversation, model, permissionMode);
    },
    [sendChatMessage],
  );

  React.useLayoutEffect(() => {
    const hasChatContent =
      messages.length > 0 || streamingEvents.length > 0 || isProcessing;
    if (!hasChatContent) return;
    if (!shouldJumpToBottomRef.current && !isPinnedToBottomRef.current) return;

    messagesEndRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'end',
    });
    shouldJumpToBottomRef.current = false;
    isPinnedToBottomRef.current = true;
  }, [messages, streamingEvents, isProcessing]);

  const shouldShowInitialLoadingState =
    isLoadingHistory &&
    messages.length === 0 &&
    streamingEvents.length === 0 &&
    !isProcessing;

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
        ref={scrollContainerRef}
        onScroll={handleMessagesScroll}
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
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
        {shouldShowInitialLoadingState ? (
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
                sessionId={sessionId}
                messageId={msg.id}
                streamEventCount={msg.streamEventCount}
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
            {isProcessing &&
              streamingEvents.length === 0 &&
              !(
                messages.length > 0 &&
                messages[messages.length - 1].role === 'assistant'
              ) && <StreamingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input area */}
      <ChatInput
        onSend={handleSendMessage}
        onCancel={cancelExecution}
        isProcessing={isProcessing}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        selectedMode={selectedMode}
        onModeChange={handleModeChange}
      />
    </Box>
  );
};
