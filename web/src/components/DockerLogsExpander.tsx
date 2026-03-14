import { useState, useRef, useEffect } from 'react';
import { Box, ButtonBase, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { afkColors } from '../themes/afk';
import { useDockerLogs } from '../hooks/useDockerLogs';

interface DockerLogsExpanderProps {
  sessionId: string;
}

export const DockerLogsExpander = ({ sessionId }: DockerLogsExpanderProps) => {
  const [expanded, setExpanded] = useState(false);
  const { logs } = useDockerLogs(sessionId, expanded);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs]);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <ButtonBase
          onClick={() => setExpanded((prev) => !prev)}
          disableRipple
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1.5,
            py: 0.75,
            borderRadius: '4px',
            color: afkColors.textTertiary,
            transition: 'color 150ms ease',
            '&:hover': { color: afkColors.textSecondary },
          }}
        >
          <ExpandMoreIcon
            sx={{
              fontSize: 14,
              transition: 'transform 200ms ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
          <Box
            component="span"
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.6875rem',
              fontWeight: 500,
              letterSpacing: '0.03em',
            }}
          >
            Container logs
          </Box>
        </ButtonBase>
      </Box>

      <Collapse in={expanded}>
        <Box
          ref={scrollRef}
          sx={{
            mt: 1.5,
            bgcolor: afkColors.surface,
            border: `1px solid ${afkColors.border}`,
            borderRadius: '6px',
            maxHeight: 220,
            overflowY: 'auto',
            px: 2,
            py: 1.5,
            scrollbarColor: `${afkColors.surfaceElevated} transparent`,
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: afkColors.surfaceElevated,
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
          }}
        >
          {logs.length === 0 ? (
            <Box
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.6875rem',
                color: afkColors.textTertiary,
                textAlign: 'center',
                py: 2,
              }}
            >
              Waiting for logs...
            </Box>
          ) : (
            logs.map((line, i) => (
              <Box
                key={i}
                component="pre"
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.6875rem',
                  lineHeight: 1.7,
                  color: afkColors.textSecondary,
                  m: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {line}
              </Box>
            ))
          )}
        </Box>
      </Collapse>
    </Box>
  );
};
