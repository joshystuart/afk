import { createTheme, type ThemeOptions } from '@mui/material/styles';

// Berry theme colors
const colors = {
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
    dark: '#1565c0',
    main: '#2196f3',
    light: '#64b5f6'
  },
  secondary: {
    50: '#f3e5f5',
    100: '#e1bee7',
    200: '#ce93d8',
    300: '#ba68c8',
    400: '#ab47bc',
    500: '#9c27b0',
    600: '#8e24aa',
    700: '#7b1fa2',
    800: '#6a1b9a',
    900: '#4a148c',
    dark: '#7b1fa2',
    main: '#9c27b0',
    light: '#ba68c8'
  },
  error: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336',
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c'
  },
  warning: {
    50: '#fff8e1',
    100: '#ffecb3',
    200: '#ffe082',
    300: '#ffd54f',
    400: '#ffca28',
    500: '#ffc107',
    600: '#ffb300',
    700: '#ffa000',
    800: '#ff8f00',
    900: '#ff6f00'
  },
  success: {
    50: '#e8f5e8',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50',
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20'
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121'
  },
  dark: {
    50: '#e3e5e8',
    100: '#b9bec7',
    200: '#8b93a2',
    300: '#5d677c',
    400: '#3a4660',
    500: '#182543',
    600: '#15213d',
    700: '#111b34',
    800: '#0e152c',
    900: '#080c1e'
  }
};

// Berry theme configuration
export const berryTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: '#fff'
    },
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
      contrastText: '#fff'
    },
    error: {
      main: colors.error[500],
      light: colors.error[300],
      dark: colors.error[700]
    },
    warning: {
      main: colors.warning[500],
      light: colors.warning[300],
      dark: colors.warning[700]
    },
    success: {
      main: colors.success[500],
      light: colors.success[300],
      dark: colors.success[700]
    },
    grey: colors.grey,
    background: {
      default: '#0a0e1a',
      paper: '#111936'
    },
    text: {
      primary: '#ffffff',
      secondary: '#8492c4',
      disabled: '#616161'
    },
    divider: '#1e2139'
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.125rem',
      fontWeight: 700,
      lineHeight: 1.2
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.27
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.33
    },
    h4: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4
    },
    h5: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.5
    },
    h6: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 1.57
    },
    body1: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5
    },
    body2: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.66
    },
    button: {
      fontWeight: 600,
      textTransform: 'none' as const
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box'
        },
        html: {
          width: '100%',
          height: '100%',
          WebkitOverflowScrolling: 'touch'
        },
        body: {
          width: '100%',
          height: '100%',
          scrollbarColor: '#1e2139 #0a0e1a',
          '&::-webkit-scrollbar': {
            width: 6,
            height: 6
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#1e2139',
            borderRadius: 6
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#0a0e1a'
          }
        },
        '#root': {
          width: '100%',
          height: '100%'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(33, 150, 243, 0.24)'
          }
        }
      }
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #1e2139'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #1e2139',
          boxShadow: '0 2px 14px 0 rgba(32, 40, 45, 0.08)'
        }
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24
        }
      }
    }
  }
} as ThemeOptions);