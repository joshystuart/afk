import React from 'react';
import { Box } from '@mui/material';
import type { ChatStreamEvent } from '../../api/types';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolCallBlock } from './ToolCallBlock';
import { StreamingIndicator } from './StreamingIndicator';
import { MarkdownContent } from './MarkdownContent';

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
    } else if (raw.type === 'assistant' && !hasStreamingBlocks) {
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
            if (cb.id) {
              blockByToolId.set(cb.id, block);
            }
          }
        }
      } else if (msg?.type === 'thinking') {
        blocks.push({ type: 'thinking', content: msg.thinking || '' });
      } else if (msg?.type === 'text') {
        blocks.push({ type: 'text', content: msg.text || '' });
      }
    } else if (raw.type === 'tool_use') {
      const id = raw.tool_use_id;
      const existing = id ? blockByToolId.get(id) : undefined;
      if (existing) {
        if (raw.input || raw.tool?.input) {
          existing.toolInput = raw.input || raw.tool?.input;
        }
        if (raw.name || raw.tool?.name) {
          existing.toolName = raw.name || raw.tool?.name;
        }
      } else {
        const block: ContentBlock = {
          type: 'tool_use',
          content: '',
          toolName: raw.tool?.name || raw.name || 'unknown',
          toolInput: raw.tool?.input || raw.input,
          toolUseId: id,
        };
        blocks.push(block);
        if (id) {
          blockByToolId.set(id, block);
        }
      }
    } else if (raw.type === 'tool_result' && raw.tool_use_id) {
      const toolBlock = blockByToolId.get(raw.tool_use_id);
      if (toolBlock) {
        toolBlock.toolResult = raw.content;
        toolBlock.toolIsError = raw.is_error;
      }
    }
  }

  if (blocks.length === 0) {
    const resultEvent = events.find(
      (event) => event.type === 'result' && event.result,
    );
    if (resultEvent) {
      blocks.push({ type: 'text', content: resultEvent.result });
    }
  }

  return blocks;
}

export const AssistantEventList: React.FC<{
  events: ChatStreamEvent[];
  isStreaming?: boolean;
}> = ({ events, isStreaming = false }) => {
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
          return <MarkdownContent key={index} content={block.content} />;
        }

        if (block.type === 'tool_use') {
          let input = block.toolInput;
          const inputIsEmpty =
            !input ||
            (typeof input === 'object' && Object.keys(input).length === 0);
          if (inputIsEmpty && block.content) {
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
