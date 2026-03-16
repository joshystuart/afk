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
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import { useAuthStore } from '../stores/auth.store';
import { useSession } from '../hooks/useSession';
import { useIsElectronMac } from '../hooks/useElectron';
import { SessionStatus } from '../api/types';
import { afkColors } from '../themes/afk';
import DockerStatusBanner from './DockerStatusBanner';

const TRAFFIC_LIGHT_WIDTH = 78;
export const TOP_BAR_HEIGHT = 48;
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
  const isElectronMac = useIsElectronMac();

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

  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Nav Items */}
      <Box
        sx={{
          px: 1.5,
          pt: 1.5,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
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
              <AnimatePresence initial={false}>
                {runningSessions.map((session) => {
                  const sessionUrl = ROUTES.getSessionDetails(session.id);
                  const isSelected = location.pathname === sessionUrl;

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <Box
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
                    </motion.div>
                  );
                })}
              </AnimatePresence>
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Top bar - always visible */}
      <Box
        sx={{
          height: TOP_BAR_HEIGHT,
          flexShrink: 0,
          bgcolor: afkColors.surface,
          borderBottom: `1px solid ${afkColors.border}`,
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          gap: 1.5,
          ...(isElectronMac && {
            WebkitAppRegion: 'drag',
            pl: `${TRAFFIC_LIGHT_WIDTH}px`,
          }),
        }}
      >
        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            size="small"
            sx={{
              color: afkColors.textSecondary,
              ...(isElectronMac && { WebkitAppRegion: 'no-drag' }),
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
        )}
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

      <DockerStatusBanner />

      {/* Body: sidebar + content */}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
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
                top: TOP_BAR_HEIGHT,
                height: `calc(100% - ${TOP_BAR_HEIGHT}px)`,
              },
            }}
          >
            {sidebarContent}
          </Drawer>
        )}

        {/* Desktop Sidebar */}
        {!isMobile && (
          <Box
            component="nav"
            sx={{
              width: SIDEBAR_WIDTH,
              flexShrink: 0,
              bgcolor: afkColors.surface,
              borderRight: `1px solid ${afkColors.border}`,
              overflowY: 'auto',
            }}
          >
            {sidebarContent}
          </Box>
        )}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            overflow: 'auto',
            bgcolor: afkColors.background,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
