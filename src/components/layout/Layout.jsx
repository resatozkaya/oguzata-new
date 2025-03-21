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
import { Edit as EditIcon } from '@mui/icons-material';
import BinaYapisiDuzenle from '../bina/BinaYapisiDuzenle';
import { binaService } from '../../services/binaService';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../contexts/PermissionContext';

const Layout = ({ children }) => {
  const { isDarkMode } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [duzenleDialogAcik, setDuzenleDialogAcik] = useState(false);
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

  // Bina yapısı düzenleme butonunun görüneceği sayfalar
  const showBinaYapisiDuzenlePages = [
    '/santiye/:santiyeId/blok/:blokId/eksiklikler',
    '/teslimat-ekip'
  ];

  const shouldShowBinaYapisiDuzenle = useMemo(() => {
    return showBinaYapisiDuzenlePages.some(pattern => {
      if (!pattern.includes(':')) {
        return location.pathname === pattern;
      }
      return location.pathname.match(new RegExp(pattern.replace(/:\w+/g, '[^/]+')));
    });
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleBinaYapisiGuncelle = async (binaYapisi) => {
    try {
      await binaService.setBinaYapisi(
        seciliSantiye?.id,
        seciliBlok?.id,
        {
          bloklar: [{
            ...seciliBlok,
            katlar: binaYapisi.katlar
          }]
        }
      );

      if (typeof yenileVerileri === 'function') {
        await yenileVerileri();
      }
      setDuzenleDialogAcik(false);
    } catch (error) {
      console.error('Bina yapısı güncellenirken hata:', error);
      alert('Bina yapısı güncellenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  };

  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Gerekli veriler yüklenirken
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
              {shouldShowBinaYapisiDuzenle && seciliBlok && hasPermission('EDIT_BINA_YAPISI') && (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setDuzenleDialogAcik(true)}
                >
                  Bina Yapısını Düzenle
                </Button>
              )}
            </Box>
          )}
          {children}
        </ErrorBoundary>
      </Box>

      {duzenleDialogAcik && (
        <BinaYapisiDuzenle
          open={duzenleDialogAcik}
          onClose={() => setDuzenleDialogAcik(false)}
          onSave={handleBinaYapisiGuncelle}
          binaYapisi={seciliBlok}
        />
      )}
    </Box>
  );
};

export default Layout;
