import React from 'react';
import { Box, Typography } from '@mui/material';
import { afkColors } from '../../themes/afk';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolCallBlock } from './ToolCallBlock';
import { StreamingIndicator } from './StreamingIndicator';
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
          px: 2,
          py: 1.5,
          borderRadius: 2,
          bgcolor: afkColors.surface,
          border: `1px solid ${afkColors.border}`,
        }}
      >
        {streamEvents && streamEvents.length > 0 ? (
          <AssistantEventList events={streamEvents} isStreaming={isStreaming} />
        ) : isStreaming ? (
          <StreamingIndicator />
        ) : (
          <Typography
            variant="body2"
            sx={{ color: afkColors.textPrimary, whiteSpace: 'pre-wrap' }}
          >
            {content}
          </Typography>
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

interface ContentBlock {
  type: string;
  content: string;
  toolName?: string;
  toolInput?: any;
  toolUseId?: string;
  toolResult?: any;
  toolIsError?: boolean;
}

function processStreamEvents(events: ChatStreamEvent[]): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const blockByIndex = new Map<number, ContentBlock>();
  const blockByToolId = new Map<string, ContentBlock>();
  let hasStreamingBlocks = false;

  for (const raw of events) {
    if (raw.type === 'stream_event' && raw.event) {
      const evt = raw.event;

      if (evt.type === 'content_block_start' && evt.content_block) {
        hasStreamingBlocks = true;
        const cb = evt.content_block;
        const block: ContentBlock = {
          type: cb.type,
          content: cb.thinking || cb.text || '',
          toolName: cb.name,
          toolInput: cb.input,
          toolUseId: cb.id,
        };
        blockByIndex.set(evt.index, block);
        blocks.push(block);
        if (cb.type === 'tool_use' && cb.id) {
          blockByToolId.set(cb.id, block);
        }
      } else if (evt.type === 'content_block_delta' && evt.delta) {
        const block = blockByIndex.get(evt.index);
        if (block) {
          if (evt.delta.type === 'thinking_delta') {
            block.content += evt.delta.thinking || '';
          } else if (evt.delta.type === 'text_delta') {
            block.content += evt.delta.text || '';
          } else if (evt.delta.type === 'input_json_delta') {
            block.content =
              (block.content || '') + (evt.delta.partial_json || '');
          }
        }
      }
    }
    // Complete assistant message (only when no streaming blocks exist)
    else if (raw.type === 'assistant' && !hasStreamingBlocks) {
      const msg = raw.message;
      if (msg?.content && Array.isArray(msg.content)) {
        for (const cb of msg.content) {
          if (cb.type === 'thinking') {
            blocks.push({ type: 'thinking', content: cb.thinking || '' });
          } else if (cb.type === 'text') {
            blocks.push({ type: 'text', content: cb.text || '' });
          } else if (cb.type === 'tool_use') {
            const block: ContentBlock = {
              type: 'tool_use',
              content: '',
              toolName: cb.name,
              toolInput: cb.input,
              toolUseId: cb.id,
            };
            blocks.push(block);
            if (cb.id) blockByToolId.set(cb.id, block);
          }
        }
      }
      // Legacy format: message.type is directly 'thinking' or 'text'
      else if (msg?.type === 'thinking') {
        blocks.push({ type: 'thinking', content: msg.thinking || '' });
      } else if (msg?.type === 'text') {
        blocks.push({ type: 'text', content: msg.text || '' });
      }
    }
    // Standalone tool_use event
    else if (raw.type === 'tool_use') {
      const id = raw.tool_use_id;
      const existing = id ? blockByToolId.get(id) : undefined;
      if (existing) {
        if (raw.input || raw.tool?.input)
          existing.toolInput = raw.input || raw.tool?.input;
        if (raw.name || raw.tool?.name)
          existing.toolName = raw.name || raw.tool?.name;
      } else {
        const block: ContentBlock = {
          type: 'tool_use',
          content: '',
          toolName: raw.tool?.name || raw.name || 'unknown',
          toolInput: raw.tool?.input || raw.input,
          toolUseId: id,
        };
        blocks.push(block);
        if (id) blockByToolId.set(id, block);
      }
    }
    // Tool result
    else if (raw.type === 'tool_result' && raw.tool_use_id) {
      const toolBlock = blockByToolId.get(raw.tool_use_id);
      if (toolBlock) {
        toolBlock.toolResult = raw.content;
        toolBlock.toolIsError = raw.is_error;
      }
    }
  }

  // Fall back to result event text if no content blocks were produced
  if (blocks.length === 0) {
    const resultEvent = events.find((e) => e.type === 'result' && e.result);
    if (resultEvent) {
      blocks.push({ type: 'text', content: resultEvent.result });
    }
  }

  return blocks;
}

const AssistantEventList: React.FC<{
  events: ChatStreamEvent[];
  isStreaming: boolean;
}> = ({ events, isStreaming }) => {
  const blocks = React.useMemo(() => processStreamEvents(events), [events]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {blocks.map((block, index) => {
        if (block.type === 'thinking') {
          return (
            <ThinkingBlock
              key={index}
              thinking={block.content}
              defaultExpanded={isStreaming && index === blocks.length - 1}
            />
          );
        }

        if (block.type === 'text') {
          return (
            <Typography
              key={index}
              variant="body2"
              sx={{
                color: afkColors.textPrimary,
                whiteSpace: 'pre-wrap',
                py: 0.25,
              }}
            >
              {block.content}
            </Typography>
          );
        }

        if (block.type === 'tool_use') {
          let input = block.toolInput;
          if (!input && block.content) {
            try {
              input = JSON.parse(block.content);
            } catch {
              /* partial JSON during streaming */
            }
          }
          return (
            <ToolCallBlock
              key={index}
              toolName={block.toolName || 'unknown'}
              input={input}
              result={block.toolResult}
              isError={block.toolIsError}
            />
          );
        }

        return null;
      })}
      {isStreaming && <StreamingIndicator />}
    </Box>
  );
};
