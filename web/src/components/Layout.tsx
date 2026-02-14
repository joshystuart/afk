import React, { useState } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import { useAuthStore } from '../stores/auth.store';
import { useSession } from '../hooks/useSession';
import { SessionStatus } from '../api/types';
import { afkColors } from '../themes/afk';

const SIDEBAR_WIDTH = 220;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { logout } = useAuthStore();
  const { sessions } = useSession();

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const runningSessions = sessions.filter(
    (s) => s.status === SessionStatus.RUNNING,
  );

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      url: ROUTES.DASHBOARD,
      icon: DashboardIcon,
    },
    {
      id: 'create-session',
      title: 'New Session',
      url: ROUTES.CREATE_SESSION,
      icon: AddIcon,
    },
    {
      id: 'settings',
      title: 'Settings',
      url: ROUTES.SETTINGS,
      icon: SettingsIcon,
    },
  ];

  const sidebar = (
    <Box
      sx={{
        height: '100%',
        bgcolor: afkColors.surface,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${afkColors.border}`,
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          px: 2.5,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 700,
            fontSize: '1.25rem',
            color: afkColors.textPrimary,
            letterSpacing: '-0.02em',
          }}
        >
          AFK
        </Typography>
      </Box>

      {/* Nav Items */}
      <Box sx={{ px: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {menuItems.map((item) => {
            const isSelected = location.pathname === item.url;

            return (
              <Box
                key={item.id}
                component={Link}
                to={item.url}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 1,
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: isSelected ? 500 : 400,
                  color: isSelected
                    ? afkColors.textPrimary
                    : afkColors.textSecondary,
                  position: 'relative',
                  transition: 'color 150ms ease',
                  '&:hover': {
                    color: afkColors.textPrimary,
                  },
                  ...(isSelected && {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 2,
                      height: 16,
                      borderRadius: 1,
                      bgcolor: afkColors.accent,
                    },
                  }),
                }}
              >
                <item.icon
                  sx={{
                    fontSize: 18,
                    opacity: isSelected ? 1 : 0.6,
                  }}
                />
                {item.title}
              </Box>
            );
          })}
        </Box>

        {/* Running Sessions */}
        {runningSessions.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.625rem',
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: afkColors.textTertiary,
                px: 1.5,
                mb: 1,
              }}
            >
              Sessions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              {runningSessions.map((session) => {
                const sessionUrl = ROUTES.getSessionDetails(session.id);
                const isSelected = location.pathname === sessionUrl;

                return (
                  <Box
                    key={session.id}
                    component={Link}
                    to={sessionUrl}
                    onClick={() => isMobile && setMobileOpen(false)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      px: 1.5,
                      py: 0.75,
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '0.8125rem',
                      fontWeight: isSelected ? 500 : 400,
                      color: isSelected
                        ? afkColors.textPrimary
                        : afkColors.textSecondary,
                      transition: 'color 150ms ease',
                      overflow: 'hidden',
                      '&:hover': {
                        color: afkColors.textPrimary,
                      },
                    }}
                  >
                    <DotIcon
                      sx={{
                        fontSize: 8,
                        color: afkColors.accent,
                        animation: 'pulse-dot 2s ease-in-out infinite',
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: '0.8125rem',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontWeight: 'inherit',
                        color: 'inherit',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {session.name || session.id.slice(0, 8)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Logout */}
        <Box sx={{ pb: 2, pt: 1, borderTop: `1px solid ${afkColors.border}` }}>
          <Box
            component="button"
            onClick={handleLogout}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 1.5,
              py: 1,
              width: '100%',
              border: 'none',
              borderRadius: '6px',
              bgcolor: 'transparent',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 400,
              fontFamily: '"DM Sans", sans-serif',
              color: afkColors.textSecondary,
              transition: 'color 150ms ease',
              '&:hover': {
                color: afkColors.textPrimary,
              },
            }}
          >
            <LogoutIcon sx={{ fontSize: 18, opacity: 0.6 }} />
            Logout
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      {/* Mobile hamburger */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 48,
            bgcolor: afkColors.surface,
            borderBottom: `1px solid ${afkColors.border}`,
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            zIndex: theme.zIndex.drawer + 1,
            gap: 1.5,
          }}
        >
          <IconButton
            onClick={handleDrawerToggle}
            size="small"
            sx={{ color: afkColors.textSecondary }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
          <Typography
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 700,
              fontSize: '0.875rem',
              color: afkColors.textPrimary,
            }}
          >
            AFK
          </Typography>
        </Box>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: SIDEBAR_WIDTH,
              border: 'none',
            },
          }}
        >
          {sidebar}
        </Drawer>
      )}

      {/* Desktop Sidebar - always visible */}
      {!isMobile && (
        <Box
          component="nav"
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
          }}
        >
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: SIDEBAR_WIDTH,
                border: 'none',
              },
            }}
            open
          >
            {sidebar}
          </Drawer>
        </Box>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          minHeight: '100vh',
          bgcolor: afkColors.background,
          ...(isMobile && {
            pt: '48px',
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
