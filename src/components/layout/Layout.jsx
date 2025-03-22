import React, { useMemo, useState } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';
import { alpha } from '@mui/material/styles';
import SantiyeSecici from '../SantiyeSecici';
import { useSantiye } from '../../contexts/SantiyeContext';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from '../ErrorBoundary';
import { binaService } from '../../services/binaService';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../contexts/PermissionContext';

const Layout = ({ children }) => {
  const { isDarkMode } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { 
    santiyeler, 
    setSantiyeler,
    seciliSantiye, 
    setSeciliSantiye,
    seciliBlok,
    setSeciliBlok,
    yenileVerileri 
  } = useSantiye();
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);
  const { hasPermission } = usePermission();

  // SantiyeSecici'nin görüneceği sayfalar
  const showSantiyeSeciciPages = [
    '/santiye/:santiyeId/blok/:blokId/eksiklikler',
    '/teslimat-ekip'
  ];

  const shouldShowSantiyeSecici = useMemo(() => {
    return showSantiyeSeciciPages.some(pattern => {
      if (!pattern.includes(':')) {
        return location.pathname === pattern;
      }
      return location.pathname.match(new RegExp(pattern.replace(/:\w+/g, '[^/]+')));
    });
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(false);
      } catch (error) {
        console.error('Veriler yüklenirken hata:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header onDrawerToggle={handleDrawerToggle} />
      <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          mt: 8,
          bgcolor: isDarkMode ? 'background.default' : alpha('#f5f5f5', 0.9),
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <ErrorBoundary>
          {shouldShowSantiyeSecici && (
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <SantiyeSecici />
            </Box>
          )}
          {children}
        </ErrorBoundary>
      </Box>
    </Box>
  );
};

export default Layout;
