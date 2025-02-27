import React, { useMemo, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
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
  const [isLoading, setIsLoading] = React.useState(true);

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

  console.log('Current path:', location.pathname);
  console.log('Selected block:', seciliBlok);
  console.log('Should show edit button:', shouldShowBinaYapisiDuzenle);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleBinaYapisiGuncelle = async (binaYapisi) => {
    try {
      // Firebase service'i kullan
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

      // Başarılı olursa verileri yenile
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
    // Gerekli verilerin yüklenmesini bekleyin
    Promise.all([
      // Örnek: API çağrıları
    ]).finally(() => {
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return <div>Yükleniyor...</div>; // veya daha güzel bir loading component
  }

  return (
    <ErrorBoundary>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Header onMenuClick={handleDrawerToggle} />
        <Sidebar open={mobileOpen} onClose={handleDrawerToggle} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${240}px)` },
            mt: 8,
            bgcolor: isDarkMode ? 'background.default' : alpha('#f5f5f5', 0.9)
          }}
        >
          {shouldShowSantiyeSecici && (
            <SantiyeSecici
              santiyeler={santiyeler}
              setSantiyeler={setSantiyeler}
              seciliSantiye={seciliSantiye}
              setSeciliSantiye={setSeciliSantiye}
              seciliBlok={seciliBlok}
              setSeciliBlok={setSeciliBlok}
              showBlokYonetim={true}
            />
          )}

          {shouldShowBinaYapisiDuzenle && seciliBlok && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 2,
              mb: 2,
              p: 2,
              bgcolor: '#1e1e1e',
              borderRadius: 1,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Typography variant="h6" sx={{ color: '#2196f3' }}>
                Bina Yapısı Düzenleme
              </Typography>
              <Button
                startIcon={<EditIcon />}
                onClick={() => setDuzenleDialogAcik(true)}
                variant="contained"
                color="secondary"
                size="large"
                sx={{ 
                  bgcolor: 'purple',
                  '&:hover': {
                    bgcolor: '#9c27b0'
                  },
                  px: 3
                }}
              >
                Bina Yapısını Düzenle
              </Button>
            </Box>
          )}

          {children}

          <BinaYapisiDuzenle
            open={duzenleDialogAcik}
            onClose={() => setDuzenleDialogAcik(false)}
            santiye={seciliSantiye}
            blok={seciliBlok}
            onUpdate={handleBinaYapisiGuncelle}
            yenileVerileri={yenileVerileri}
          />
        </Box>
      </Box>
    </ErrorBoundary>
  );
};

export default Layout;
