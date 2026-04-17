import React from 'react';
import { Box, CircularProgress, Skeleton, Typography } from '@mui/material';
import { InsertDriveFileOutlined } from '@mui/icons-material';
import { createHighlighter, type Highlighter } from 'shiki';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { afkColors } from '../../../themes/afk';
import { useFileContent } from '../../../hooks/useFileContent';
import { FilePreviewHeader } from './FilePreviewHeader';

interface FilePreviewProps {
  sessionId: string;
  filePath: string | null;
  hostMountPath: string | null;
  ideCommand: string | null;
}

const SHIKI_THEME = 'github-dark-default';
const SUPPORTED_LANGS = new Set([
  'typescript',
  'javascript',
  'json',
  'css',
  'html',
  'python',
  'bash',
  'yaml',
  'markdown',
]);

let highlighterPromise: Promise<Highlighter> | null = null;

const getHighlighter = (): Promise<Highlighter> => {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [import('shiki/themes/github-dark-default.mjs')],
      langs: [
        import('shiki/langs/typescript.mjs'),
        import('shiki/langs/javascript.mjs'),
        import('shiki/langs/json.mjs'),
        import('shiki/langs/css.mjs'),
        import('shiki/langs/html.mjs'),
        import('shiki/langs/python.mjs'),
        import('shiki/langs/bash.mjs'),
        import('shiki/langs/yaml.mjs'),
        import('shiki/langs/markdown.mjs'),
      ],
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
};

const normalizeIdeCommand = (raw: string): string => {
  // Tolerate users pasting "cursor://", "cursor:", or "Cursor" as their IDE command.
  return raw.trim().toLowerCase().replace(/:\/+$/, '').replace(/:+$/, '');
};

const buildIdeUrl = (
  containerPath: string,
  hostMountPath: string | null,
  ideCommand: string | null,
): string | null => {
  if (!hostMountPath || !ideCommand) return null;

  const cmd = normalizeIdeCommand(ideCommand);
  if (!cmd) return null;

  const normalizedMount = hostMountPath.replace(/\/+$/, '');

  let relative: string;
  if (containerPath.startsWith('/workspace/repo/')) {
    relative = containerPath.slice('/workspace/repo/'.length);
  } else if (
    containerPath === '/workspace/repo' ||
    containerPath === '/workspace'
  ) {
    relative = '';
  } else if (containerPath.startsWith('/workspace/')) {
    relative = containerPath.slice('/workspace/'.length);
  } else if (containerPath.startsWith('/')) {
    return null;
  } else {
    // The workspace API returns paths relative to the repo root
    // (e.g. "AGENTS.md", "src/index.ts") — map straight onto the host mount.
    relative = containerPath.replace(/^\/+/, '');
  }

  const hostPath = relative
    ? `${normalizedMount}/${relative}`
    : normalizedMount;

  const scheme = cmd === 'code' ? 'vscode' : cmd;
  return `${scheme}://file/${hostPath}`;
};

const EmptyState: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
      color: afkColors.textTertiary,
    }}
  >
    {children}
  </Box>
);

// Isolating the rendered HTML in its own memoized component means unrelated
// parent re-renders (health polling, socket events, sibling tab updates) can
// never reach down and replace the DOM nodes that hold the user's active
// text selection. React.memo's default shallow comparison of the single
// `html` prop is exactly what we want.
const HighlightedCode = React.memo<{ html: string }>(({ html }) => (
  <Box dangerouslySetInnerHTML={{ __html: html }} sx={{ height: '100%' }} />
));
HighlightedCode.displayName = 'HighlightedCode';

const FilePreviewComponent: React.FC<FilePreviewProps> = ({
  sessionId,
  filePath,
  hostMountPath,
  ideCommand,
}) => {
  const { data, isLoading, isError, error } = useFileContent(
    sessionId,
    filePath,
  );

  const [highlightedHtml, setHighlightedHtml] = React.useState<string | null>(
    null,
  );
  const [highlightError, setHighlightError] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    if (!data || data.binary) {
      setHighlightedHtml(null);
      setHighlightError(null);
      return;
    }

    let cancelled = false;
    setHighlightError(null);

    getHighlighter()
      .then((highlighter) => {
        if (cancelled) return;
        const lang = SUPPORTED_LANGS.has(data.language)
          ? data.language
          : 'plaintext';
        try {
          const html = highlighter.codeToHtml(data.content, {
            lang,
            theme: SHIKI_THEME,
          });
          if (!cancelled) setHighlightedHtml(html);
        } catch (e) {
          if (!cancelled) {
            setHighlightError((e as Error).message);
            setHighlightedHtml(null);
          }
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setHighlightError((e as Error).message);
          setHighlightedHtml(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [data]);

  if (!filePath) {
    return (
      <EmptyState>
        <InsertDriveFileOutlined
          sx={{ fontSize: 32, color: afkColors.textTertiary }}
        />
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.8rem',
            color: afkColors.textTertiary,
          }}
        >
          Select a file to preview
        </Typography>
      </EmptyState>
    );
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.75,
            minHeight: 36,
            borderBottom: `1px solid ${afkColors.border}`,
            bgcolor: afkColors.surface,
          }}
        >
          <Skeleton
            variant="text"
            width={240}
            sx={{ bgcolor: afkColors.surfaceElevated }}
          />
        </Box>
        <Box sx={{ flex: 1, p: 2 }}>
          <Skeleton
            variant="rectangular"
            height="100%"
            sx={{ bgcolor: afkColors.surfaceElevated, borderRadius: 1 }}
          />
        </Box>
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState>
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.8rem',
            color: afkColors.danger,
          }}
        >
          {(error as Error)?.message ?? 'Failed to load file'}
        </Typography>
      </EmptyState>
    );
  }

  const ideUrl = buildIdeUrl(data.path, hostMountPath, ideCommand);

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <FilePreviewHeader
        filePath={data.path}
        language={data.language}
        truncated={data.truncated}
        binary={data.binary}
        ideUrl={ideUrl}
      />
      {data.binary ? (
        <EmptyState>
          <InsertDriveFileOutlined
            sx={{ fontSize: 32, color: afkColors.textTertiary }}
          />
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.8rem',
              color: afkColors.textTertiary,
            }}
          >
            Binary file — cannot preview
          </Typography>
        </EmptyState>
      ) : (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.8rem',
            bgcolor: afkColors.background,
            '& pre.shiki': {
              margin: 0,
              padding: '16px 20px',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              lineHeight: 1.55,
              overflow: 'visible',
              background: 'transparent !important',
            },
            '& pre.shiki code': {
              fontFamily: 'inherit',
              fontSize: 'inherit',
            },
          }}
        >
          {highlightError ? (
            <Box component="pre" sx={{ m: 0, p: 2, whiteSpace: 'pre' }}>
              {data.content}
            </Box>
          ) : highlightedHtml ? (
            <HighlightedCode html={highlightedHtml} />
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
              }}
            >
              <CircularProgress
                size={16}
                sx={{ color: afkColors.textTertiary }}
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export const FilePreview = React.memo(FilePreviewComponent);
FilePreview.displayName = 'FilePreview';
