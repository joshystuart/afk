import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { Dashboard as DashboardIcon, Add as AddIcon } from '@mui/icons-material';
import { ROUTES } from '../utils/constants';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#1a1a1a' }}>
      {/* Sidebar Navigation */}
      <Box sx={{
        width: '240px',
        backgroundColor: '#2d2d2d',
        borderRight: '1px solid #404040',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Logo/Brand */}
        <Box sx={{ p: 3, borderBottom: '1px solid #404040' }}>
          <Typography variant="h6" sx={{ 
            color: 'white', 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            🚀 AFK Server
          </Typography>
        </Box>

        {/* Navigation Menu */}
        <Box sx={{ flex: 1, p: 2 }}>
          <Button
            component={Link}
            to={ROUTES.DASHBOARD}
            fullWidth
            startIcon={<DashboardIcon />}
            sx={{
              justifyContent: 'flex-start',
              color: location.pathname === ROUTES.DASHBOARD ? '#60a5fa' : '#a1a1aa',
              backgroundColor: location.pathname === ROUTES.DASHBOARD ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
              '&:hover': { 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'white'
              },
              mb: 1,
              textTransform: 'none',
              fontWeight: location.pathname === ROUTES.DASHBOARD ? 600 : 400,
            }}
          >
            Dashboard
          </Button>

          <Button
            component={Link}
            to={ROUTES.CREATE_SESSION}
            fullWidth
            startIcon={<AddIcon />}
            sx={{
              justifyContent: 'flex-start',
              color: location.pathname === ROUTES.CREATE_SESSION ? '#60a5fa' : '#a1a1aa',
              backgroundColor: location.pathname === ROUTES.CREATE_SESSION ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
              '&:hover': { 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'white'
              },
              textTransform: 'none',
              fontWeight: location.pathname === ROUTES.CREATE_SESSION ? 600 : 400,
            }}
          >
            Create Session
          </Button>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;