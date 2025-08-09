import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  Terminal as TerminalIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

const drawerWidth = 260;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const location = useLocation();
  const matchDownLG = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState(!matchDownLG);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: ROUTES.DASHBOARD,
      icon: DashboardIcon,
    },
    {
      id: 'create-session',
      title: 'Create Session',
      type: 'item',
      url: ROUTES.CREATE_SESSION,
      icon: AddIcon,
    },
    {
      id: 'settings',
      title: 'Settings',
      type: 'item',
      url: ROUTES.SETTINGS,
      icon: SettingsIcon,
    },
  ];

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: 'background.paper', borderRight: `1px solid ${theme.palette.divider}` }}>
      {/* Logo */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          px: open ? 3 : 1,
          py: 2,
          minHeight: 64,
        }}
      >
        {open && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TerminalIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
              AFK Server
            </Typography>
          </Box>
        )}
        {!matchDownLG && (
          <IconButton onClick={open ? handleDrawerClose : handleDrawerOpen} size="small">
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <List sx={{ px: 2 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isSelected = location.pathname === item.url;

          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.url}
                sx={{
                  minHeight: 44,
                  borderRadius: 1.5,
                  px: 2,
                  py: 1,
                  color: isSelected ? 'primary.main' : 'text.secondary',
                  bgcolor: isSelected ? 'rgba(33, 150, 243, 0.08)' : 'transparent',
                  '&:hover': {
                    bgcolor: isSelected ? 'rgba(33, 150, 243, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? 'primary.main' : 'text.primary',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 32,
                    color: 'inherit',
                  }}
                >
                  <Icon fontSize="small" />
                </ListItemIcon>
                {open && (
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? 600 : 500,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Mobile App Bar */}
      {matchDownLG && (
        <AppBar
          position="fixed"
          sx={{
            width: '100%',
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 1,
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
              <TerminalIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
                AFK Server
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>
      )}

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{
          width: matchDownLG ? 0 : open ? drawerWidth : 72,
          flexShrink: 0,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* Mobile Drawer */}
        {matchDownLG && (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
          >
            {drawer}
          </Drawer>
        )}

        {/* Desktop Drawer */}
        {!matchDownLG && (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: open ? drawerWidth : 72,
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
                overflowX: 'hidden',
                border: 'none',
              },
            }}
            open={open}
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          minHeight: '100vh',
          bgcolor: 'background.default',
          ...(matchDownLG && {
            pt: 8, // Account for mobile app bar
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;