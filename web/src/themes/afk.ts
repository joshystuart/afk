import { createTheme, type ThemeOptions } from '@mui/material/styles';

// AFK Design System
// Tone: Industrial-utilitarian meets refined craft
// Inspired by Linear, Vercel, Warp terminal

const colors = {
  background: '#09090b',
  surface: '#0f0f11',
  surfaceElevated: '#18181b',
  border: '#1c1c1f',
  borderSubtle: '#141416',

  textPrimary: '#fafafa',
  textSecondary: '#71717a',
  textTertiary: '#52525b',

  accent: '#10b981',
  accentDark: '#059669',
  accentLight: '#34d399',
  accentMuted: 'rgba(16, 185, 129, 0.12)',
  accentGlow: 'rgba(16, 185, 129, 0.25)',

  danger: '#ef4444',
  dangerMuted: 'rgba(239, 68, 68, 0.12)',
  warning: '#f59e0b',
  warningMuted: 'rgba(245, 158, 11, 0.12)',
};

export const afkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.accent,
      light: colors.accentLight,
      dark: colors.accentDark,
      contrastText: '#fff',
    },
    secondary: {
      main: '#71717a',
      light: '#a1a1aa',
      dark: '#52525b',
      contrastText: '#fff',
    },
    error: {
      main: colors.danger,
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: colors.warning,
      light: '#fbbf24',
      dark: '#d97706',
    },
    success: {
      main: colors.accent,
      light: colors.accentLight,
      dark: colors.accentDark,
    },
    grey: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      disabled: colors.textTertiary,
    },
    divider: colors.border,
    action: {
      hover: 'rgba(255, 255, 255, 0.04)',
      selected: colors.accentMuted,
      focus: colors.accentMuted,
    },
  },
  typography: {
    fontFamily: '"DM Sans", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h5: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 1.6,
    },
    body1: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.8125rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
      color: colors.textSecondary,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none' as const,
      fontSize: '0.8125rem',
      letterSpacing: '0.01em',
    },
    overline: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '0.6875rem',
      fontWeight: 500,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          width: '100%',
          height: '100%',
          WebkitOverflowScrolling: 'touch',
        },
        body: {
          width: '100%',
          height: '100%',
          scrollbarColor: `${colors.surfaceElevated} ${colors.background}`,
          '&::-webkit-scrollbar': {
            width: 6,
            height: 6,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: colors.surfaceElevated,
            borderRadius: 6,
            '&:hover': {
              backgroundColor: colors.border,
            },
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
        },
        '#root': {
          width: '100%',
          height: '100%',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'all 150ms ease',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: colors.accent,
          '&:hover': {
            backgroundColor: colors.accentDark,
          },
        },
        containedError: {
          backgroundColor: colors.danger,
          '&:hover': {
            backgroundColor: '#dc2626',
          },
        },
        containedWarning: {
          backgroundColor: colors.warning,
          color: '#000',
          '&:hover': {
            backgroundColor: '#d97706',
          },
        },
        outlined: {
          borderColor: colors.border,
          color: colors.textPrimary,
          '&:hover': {
            borderColor: colors.textSecondary,
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
        },
        text: {
          color: colors.textSecondary,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            color: colors.textPrimary,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          transition: 'all 150ms ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          boxShadow: 'none',
          backgroundImage: 'none',
          backgroundColor: colors.surface,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 20,
          '&:last-child': {
            paddingBottom: 20,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: colors.surfaceElevated,
            borderRadius: 6,
            '& fieldset': {
              borderColor: colors.border,
              transition: 'border-color 150ms ease',
            },
            '&:hover fieldset': {
              borderColor: colors.textTertiary,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.accent,
              borderWidth: 1,
              boxShadow: `0 0 0 3px ${colors.accentGlow}`,
            },
          },
          '& .MuiInputBase-input': {
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.875rem',
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.875rem',
            '&.Mui-focused': {
              color: colors.accent,
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: 6,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.border,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.textTertiary,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.accent,
            borderWidth: 1,
            boxShadow: `0 0 0 3px ${colors.accentGlow}`,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          backgroundImage: 'none',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colors.border,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
          fontSize: '0.75rem',
          height: 24,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.8125rem',
          minHeight: 40,
          '&.Mui-selected': {
            color: colors.accent,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: colors.accent,
          height: 2,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          border: `1px solid`,
          fontSize: '0.8125rem',
        },
        standardError: {
          backgroundColor: colors.dangerMuted,
          borderColor: 'rgba(239, 68, 68, 0.2)',
          color: '#fca5a5',
        },
        standardWarning: {
          backgroundColor: colors.warningMuted,
          borderColor: 'rgba(245, 158, 11, 0.2)',
          color: '#fde68a',
        },
        standardSuccess: {
          backgroundColor: colors.accentMuted,
          borderColor: 'rgba(16, 185, 129, 0.2)',
          color: colors.accentLight,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surfaceElevated,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: colors.border,
          fontSize: '0.8125rem',
        },
        head: {
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.6875rem',
          fontWeight: 500,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: colors.textSecondary,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          backgroundImage: 'none',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
          '&.Mui-selected': {
            backgroundColor: colors.accentMuted,
            '&:hover': {
              backgroundColor: colors.accentMuted,
            },
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: 2,
        },
        bar: {
          backgroundColor: colors.accent,
          borderRadius: 2,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: colors.accent,
        },
      },
    },
  },
} as ThemeOptions);

// Export colors for use in sx props
export const afkColors = colors;
