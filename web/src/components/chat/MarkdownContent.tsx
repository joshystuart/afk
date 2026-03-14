import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box } from '@mui/material';
import type { Components } from 'react-markdown';
import { afkColors } from '../../themes/afk';

const monoFont = '"JetBrains Mono", monospace';
const bodyFont = '"DM Sans", "Helvetica Neue", Arial, sans-serif';

const components: Components = {
  h1: ({ children }) => (
    <Box
      component="h1"
      sx={{
        fontFamily: monoFont,
        fontSize: '1.25rem',
        fontWeight: 700,
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
        color: afkColors.textPrimary,
        mt: 2,
        mb: 1,
        '&:first-of-type': { mt: 0 },
      }}
    >
      {children}
    </Box>
  ),
  h2: ({ children }) => (
    <Box
      component="h2"
      sx={{
        fontFamily: monoFont,
        fontSize: '1.1rem',
        fontWeight: 700,
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
        color: afkColors.textPrimary,
        mt: 2,
        mb: 0.75,
        '&:first-of-type': { mt: 0 },
      }}
    >
      {children}
    </Box>
  ),
  h3: ({ children }) => (
    <Box
      component="h3"
      sx={{
        fontFamily: monoFont,
        fontSize: '0.95rem',
        fontWeight: 600,
        lineHeight: 1.4,
        color: afkColors.textPrimary,
        mt: 1.5,
        mb: 0.5,
        '&:first-of-type': { mt: 0 },
      }}
    >
      {children}
    </Box>
  ),
  h4: ({ children }) => (
    <Box
      component="h4"
      sx={{
        fontFamily: monoFont,
        fontSize: '0.875rem',
        fontWeight: 600,
        lineHeight: 1.5,
        color: afkColors.textPrimary,
        mt: 1.5,
        mb: 0.5,
        '&:first-of-type': { mt: 0 },
      }}
    >
      {children}
    </Box>
  ),
  h5: ({ children }) => (
    <Box
      component="h5"
      sx={{
        fontFamily: monoFont,
        fontSize: '0.8125rem',
        fontWeight: 600,
        lineHeight: 1.5,
        color: afkColors.textPrimary,
        mt: 1,
        mb: 0.5,
      }}
    >
      {children}
    </Box>
  ),
  h6: ({ children }) => (
    <Box
      component="h6"
      sx={{
        fontFamily: monoFont,
        fontSize: '0.75rem',
        fontWeight: 600,
        lineHeight: 1.6,
        color: afkColors.textSecondary,
        mt: 1,
        mb: 0.5,
      }}
    >
      {children}
    </Box>
  ),
  p: ({ children }) => (
    <Box
      component="p"
      sx={{
        fontFamily: bodyFont,
        fontSize: '0.8125rem',
        fontWeight: 400,
        lineHeight: 1.6,
        color: afkColors.textPrimary,
        my: 0.5,
        '&:first-of-type': { mt: 0 },
        '&:last-of-type': { mb: 0 },
      }}
    >
      {children}
    </Box>
  ),
  a: ({ href, children }) => (
    <Box
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        color: afkColors.accent,
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
          color: afkColors.accentLight,
        },
      }}
    >
      {children}
    </Box>
  ),
  strong: ({ children }) => (
    <Box
      component="strong"
      sx={{ fontWeight: 600, color: afkColors.textPrimary }}
    >
      {children}
    </Box>
  ),
  em: ({ children }) => (
    <Box component="em" sx={{ fontStyle: 'italic' }}>
      {children}
    </Box>
  ),
  ul: ({ children }) => (
    <Box
      component="ul"
      sx={{
        pl: 2.5,
        my: 0.5,
        fontSize: '0.8125rem',
        lineHeight: 1.6,
        color: afkColors.textPrimary,
        '& li': { mb: 0.25 },
      }}
    >
      {children}
    </Box>
  ),
  ol: ({ children }) => (
    <Box
      component="ol"
      sx={{
        pl: 2.5,
        my: 0.5,
        fontSize: '0.8125rem',
        lineHeight: 1.6,
        color: afkColors.textPrimary,
        '& li': { mb: 0.25 },
      }}
    >
      {children}
    </Box>
  ),
  li: ({ children }) => (
    <Box
      component="li"
      sx={{
        fontSize: '0.8125rem',
        lineHeight: 1.6,
        '&::marker': { color: afkColors.textTertiary },
      }}
    >
      {children}
    </Box>
  ),
  blockquote: ({ children }) => (
    <Box
      component="blockquote"
      sx={{
        borderLeft: `3px solid ${afkColors.accent}`,
        bgcolor: afkColors.accentMuted,
        m: 0,
        my: 1,
        py: 0.5,
        pl: 1.5,
        pr: 1,
        borderRadius: '0 4px 4px 0',
        '& p': { my: 0.25 },
      }}
    >
      {children}
    </Box>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.startsWith('language-');
    if (isBlock) {
      return (
        <Box
          component="code"
          className={className}
          sx={{
            display: 'block',
            fontFamily: monoFont,
            fontSize: '0.75rem',
            lineHeight: 1.6,
            color: afkColors.textPrimary,
            whiteSpace: 'pre',
            overflowX: 'auto',
          }}
          {...props}
        >
          {children}
        </Box>
      );
    }
    return (
      <Box
        component="code"
        sx={{
          fontFamily: monoFont,
          fontSize: '0.75rem',
          bgcolor: afkColors.surfaceElevated,
          color: afkColors.accentLight,
          border: `1px solid ${afkColors.border}`,
          borderRadius: '4px',
          px: 0.6,
          py: 0.15,
        }}
        {...props}
      >
        {children}
      </Box>
    );
  },
  pre: ({ children }) => (
    <Box
      component="pre"
      sx={{
        bgcolor: afkColors.background,
        border: `1px solid ${afkColors.border}`,
        borderRadius: '6px',
        p: 1.5,
        my: 1,
        overflow: 'auto',
        maxHeight: 400,
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: afkColors.surfaceElevated,
          borderRadius: 4,
        },
      }}
    >
      {children}
    </Box>
  ),
  hr: () => (
    <Box
      component="hr"
      sx={{
        border: 'none',
        borderTop: `1px solid ${afkColors.border}`,
        my: 1.5,
      }}
    />
  ),
  table: ({ children }) => (
    <Box sx={{ overflowX: 'auto', my: 1 }}>
      <Box
        component="table"
        sx={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.8125rem',
          '& th': {
            fontFamily: monoFont,
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            color: afkColors.textSecondary,
            bgcolor: afkColors.surfaceElevated,
            border: `1px solid ${afkColors.border}`,
            px: 1,
            py: 0.75,
            textAlign: 'left',
          },
          '& td': {
            color: afkColors.textPrimary,
            border: `1px solid ${afkColors.border}`,
            px: 1,
            py: 0.5,
          },
          '& tr:hover td': {
            bgcolor: 'rgba(255,255,255,0.02)',
          },
        }}
      >
        {children}
      </Box>
    </Box>
  ),
  del: ({ children }) => (
    <Box component="del" sx={{ color: afkColors.textTertiary }}>
      {children}
    </Box>
  ),
};

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = React.memo(
  ({ content }) => (
    <Box
      sx={{
        wordBreak: 'break-word',
        '& > *:first-of-type': { mt: 0 },
        '& > *:last-child': { mb: 0 },
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </Box>
  ),
);

MarkdownContent.displayName = 'MarkdownContent';
