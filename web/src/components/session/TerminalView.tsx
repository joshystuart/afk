import React, { useEffect, useRef, useCallback } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { useTerminal } from '../../hooks/useTerminal';
import { useSessionHealth } from '../../hooks/useSessionHealth';
import { afkColors } from '../../themes/afk';

interface TerminalViewProps {
  sessionId: string;
  visible: boolean;
}

const XTERM_THEME = {
  background: '#09090b',
  foreground: '#fafafa',
  cursor: '#10b981',
  selectionBackground: 'rgba(16, 185, 129, 0.3)',
};

const DEBOUNCE_MS = 50;

function decodeBase64(data: string): Uint8Array {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  sessionId,
  visible,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const initializedRef = useRef(false);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { startTerminal, sendInput, resize, status, setOnData } =
    useTerminal(sessionId);
  const { terminalReady } = useSessionHealth(sessionId, true);

  const doFit = useCallback(() => {
    const fitAddon = fitAddonRef.current;
    if (!fitAddon) return;
    try {
      fitAddon.fit();
      const dims = fitAddon.proposeDimensions();
      if (dims?.cols && dims?.rows) {
        resize(dims.cols, dims.rows);
      }
    } catch {
      // fit may throw if terminal not attached
    }
  }, [resize]);

  // Terminal initialization
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;

    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Menlo', monospace",
      theme: XTERM_THEME,
      scrollback: 5000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(containerRef.current);
    fitAddon.fit();

    terminal.onData((data) => {
      sendInput(data);
    });

    setOnData((data: string) => {
      terminal.write(decodeBase64(data));
    });

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;
    initializedRef.current = true;

    return () => {
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
      initializedRef.current = false;
    };
    // sendInput and setOnData are stable callbacks — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fit on visibility change
  useEffect(() => {
    if (!visible || !initializedRef.current) return;
    requestAnimationFrame(() => doFit());
  }, [visible, doFit]);

  // ResizeObserver for dynamic resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        if (initializedRef.current && visible) {
          doFit();
        }
      }, DEBOUNCE_MS);
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, [visible, doFit]);

  // Start terminal when conditions are met
  useEffect(() => {
    if (
      !visible ||
      !initializedRef.current ||
      !terminalReady ||
      status !== 'idle'
    )
      return;

    const fitAddon = fitAddonRef.current;
    if (!fitAddon) return;

    const dims = fitAddon.proposeDimensions();
    if (dims?.cols && dims?.rows) {
      startTerminal(dims.cols, dims.rows);
    }
  }, [visible, terminalReady, status, startTerminal]);

  const showTerminal = status === 'connected';
  const showConnecting = status === 'connecting';
  const showNotReady = !terminalReady && status === 'idle';
  const showDisconnected = status === 'disconnected';
  const showError = status === 'error';

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        bgcolor: afkColors.background,
      }}
    >
      {/* Status overlays */}
      {showConnecting && (
        <CenteredOverlay>
          <CircularProgress size={24} sx={{ color: afkColors.accent }} />
          <Typography
            sx={{ color: afkColors.textSecondary, fontSize: 12, mt: 1.5 }}
          >
            Connecting to terminal...
          </Typography>
        </CenteredOverlay>
      )}

      {showNotReady && (
        <CenteredOverlay>
          <TerminalIcon sx={{ color: afkColors.textTertiary, fontSize: 48 }} />
          <Typography
            sx={{ color: afkColors.textSecondary, fontSize: 13, mt: 1.5 }}
          >
            Session not running
          </Typography>
          <Typography
            sx={{ color: afkColors.textTertiary, fontSize: 12, mt: 0.5 }}
          >
            Start the session to access the terminal
          </Typography>
        </CenteredOverlay>
      )}

      {showDisconnected && (
        <InlineBanner>
          <CircularProgress size={14} sx={{ color: afkColors.accent, mr: 1 }} />
          <Typography sx={{ color: afkColors.textPrimary, fontSize: 12 }}>
            Terminal disconnected — reconnecting...
          </Typography>
        </InlineBanner>
      )}

      {showError && (
        <InlineBanner>
          <ErrorOutlineIcon sx={{ color: '#ef4444', fontSize: 16, mr: 1 }} />
          <Typography sx={{ color: afkColors.textPrimary, fontSize: 12 }}>
            Terminal connection failed — check that the session is running and
            try again
          </Typography>
        </InlineBanner>
      )}

      {/* Terminal container — always mounted, hidden when overlay is active */}
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: '100%',
          visibility: showTerminal ? 'visible' : 'hidden',
        }}
      />
    </Box>
  );
};

const CenteredOverlay: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Box
    sx={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    }}
  >
    {children}
  </Box>
);

const InlineBanner: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 0.75,
      px: 2,
      bgcolor: afkColors.surfaceElevated,
      borderBottom: `1px solid ${afkColors.border}`,
      zIndex: 2,
    }}
  >
    {children}
  </Box>
);
