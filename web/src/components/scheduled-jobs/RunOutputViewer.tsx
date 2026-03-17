import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { afkColors } from '../../themes/afk';
import { ThinkingBlock } from '../chat/ThinkingBlock';
import { ToolCallBlock } from '../chat/ToolCallBlock';
import { MarkdownContent } from '../chat/MarkdownContent';
import type { ChatStreamEvent, ScheduledJobRun } from '../../api/types';

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
            if (cb.id) blockByToolId.set(cb.id, block);
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
    } else if (raw.type === 'tool_result' && raw.tool_use_id) {
      const toolBlock = blockByToolId.get(raw.tool_use_id);
      if (toolBlock) {
        toolBlock.toolResult = raw.content;
        toolBlock.toolIsError = raw.is_error;
      }
    }
  }

  if (blocks.length === 0) {
    const resultEvent = events.find((e) => e.type === 'result' && e.result);
    if (resultEvent) {
      blocks.push({ type: 'text', content: resultEvent.result });
    }
  }

  return blocks;
}

const RunOutputContent: React.FC<{ run: ScheduledJobRun }> = ({ run }) => {
  const blocks = React.useMemo(
    () =>
      run.streamEvents?.length ? processStreamEvents(run.streamEvents) : [],
    [run.streamEvents],
  );

  if (run.errorMessage && blocks.length === 0) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: '6px',
          bgcolor: afkColors.dangerMuted,
          border: `1px solid rgba(239, 68, 68, 0.2)`,
        }}
      >
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.8125rem',
            color: '#fca5a5',
            whiteSpace: 'pre-wrap',
          }}
        >
          {run.errorMessage}
        </Typography>
      </Box>
    );
  }

  if (blocks.length === 0) {
    return (
      <Typography
        sx={{
          color: afkColors.textTertiary,
          fontSize: '0.875rem',
          fontStyle: 'italic',
        }}
      >
        No output captured for this run.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {blocks.map((block, index) => {
        if (block.type === 'thinking') {
          return <ThinkingBlock key={index} thinking={block.content} />;
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
              /* partial JSON */
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

      {run.errorMessage && (
        <Box
          sx={{
            mt: 1,
            p: 2,
            borderRadius: '6px',
            bgcolor: afkColors.dangerMuted,
            border: `1px solid rgba(239, 68, 68, 0.2)`,
          }}
        >
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.75rem',
              color: '#fca5a5',
              whiteSpace: 'pre-wrap',
            }}
          >
            {run.errorMessage}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export const RunOutputDialog: React.FC<{
  run: ScheduledJobRun | null;
  open: boolean;
  onClose: () => void;
}> = ({ run, open, onClose }) => {
  if (!run) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: afkColors.surface,
          maxHeight: '85vh',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          borderBottom: `1px solid ${afkColors.border}`,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            Run Output
          </Typography>
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.6875rem',
              color: afkColors.textTertiary,
              mt: 0.25,
            }}
          >
            {run.id.slice(0, 8)} &middot;{' '}
            {run.startedAt
              ? new Date(run.startedAt).toLocaleString()
              : 'Unknown'}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: afkColors.textTertiary }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: 3 }}>
        <RunOutputContent run={run} />
      </DialogContent>
    </Dialog>
  );
};

export { RunOutputContent };
