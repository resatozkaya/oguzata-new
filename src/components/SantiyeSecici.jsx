import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid
} from '@mui/material';
import { Add as AddIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { binaService } from '../services/binaService';
import { enqueueSnackbar } from 'notistack';
import { useTheme } from '@mui/material/styles';
import BlokYonetimDialog from './bina/BlokYonetimDialog';

const SantiyeSecici = ({ 
  santiyeler = [], 
  seciliSantiye, 
  setSeciliSantiye,
  seciliBlok,
  setSeciliBlok,
  setSantiyeler,
  showBlokYonetim = false
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [modalAcik, setModalAcik] = useState(false);
  const [yeniBlok, setYeniBlok] = useState({
    ad: '',
    katSayisi: 9,
    daireSayisi: 4
  });
  const [blokYonetimOpen, setBlokYonetimOpen] = useState(false);

  const handleYeniBlokEkle = async () => {
    if (!seciliSantiye?.id || !yeniBlok.ad) {
      enqueueSnackbar('Lütfen şantiye seçin ve blok adı girin', { variant: 'warning' });
      return;
    }

    try {
      await binaService.yeniBlokOlustur(
        seciliSantiye.id, 
        yeniBlok.ad,
        yeniBlok.katSayisi,
        yeniBlok.daireSayisi
      );
      
      setModalAcik(false);
      setYeniBlok({
        ad: '',
        katSayisi: 9,
        daireSayisi: 4
      });
      
      const guncelSantiyeler = await binaService.getSantiyeler();
      setSantiyeler(guncelSantiyeler);
      
      const guncelSantiye = guncelSantiyeler.find(s => s.id === seciliSantiye.id);
      if (guncelSantiye) {
        setSeciliSantiye(guncelSantiye);
      }
      
      enqueueSnackbar('Yeni blok başarıyla eklendi', { variant: 'success' });
    } catch (error) {
      console.error('Blok eklenirken hata:', error);
      enqueueSnackbar('Blok eklenirken hata oluştu', { variant: 'error' });
    }
  };

  // Blok güncelleme fonksiyonu
  const handleBlokGuncelle = async (blokId, yeniAd) => {
    if (!seciliSantiye?.id || !blokId) {
      enqueueSnackbar('Geçerli bir şantiye ve blok seçilmedi', { variant: 'warning' });
      return;
    }

    try {
      await binaService.blokGuncelle(seciliSantiye.id, blokId, {
        ad: yeniAd,
        // Diğer blok özellikleri korunacak şekilde
        ...seciliSantiye.bloklar.find(b => b.id === blokId)
      });

      // Santiyeleri yeniden yükle
      const data = await binaService.getSantiyeler();
      setSantiyeler(data);

      // Seçili bloğu güncelle
      const guncelBlok = data
        .find(s => s.id === seciliSantiye.id)
        ?.bloklar.find(b => b.id === blokId);
      
      if (guncelBlok) {
        setSeciliBlok(guncelBlok);
      }

      enqueueSnackbar('Blok başarıyla güncellendi', { variant: 'success' });
    } catch (error) {
      console.error('Blok güncellenirken hata:', error);
      enqueueSnackbar('Blok güncellenirken hata oluştu: ' + error.message, { variant: 'error' });
    }
  };

  // BlokYonetimDialog'da kullanılacak
  const handleBlokSil = async (blokId) => {
    if (!seciliSantiye?.id || !blokId) {
      enqueueSnackbar('Geçerli bir şantiye ve blok seçilmedi', { variant: 'warning' });
      return;
    }

    try {
      await binaService.blokSil(seciliSantiye.id, blokId);
      
      // Santiyeleri yeniden yükle
      const data = await binaService.getSantiyeler();
      setSantiyeler(data);
      
      // Silinen blok seçili blok ise seçimi kaldır
      if (seciliBlok?.id === blokId) {
        setSeciliBlok(null);
      }

      enqueueSnackbar('Blok başarıyla silindi', { variant: 'success' });
    } catch (error) {
      console.error('Blok silinirken hata:', error);
      enqueueSnackbar('Blok silinirken hata oluştu: ' + error.message, { variant: 'error' });
    }
  };

  // Seçili şantiyenin bloklarını filtrele
  const filteredBloklar = seciliSantiye?.bloklar?.filter(blok => blok && (blok.id || blok.ad)) || [];

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        alignItems: 'center',
        mb: 2,
        p: 2,
        bgcolor: isDarkMode ? '#1e1e1e' : '#ffffff',
        borderRadius: 1,
        boxShadow: 1,
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      }}>
        {/* Şantiye Seçici */}
        <FormControl sx={{ 
          minWidth: 200,
          '& .MuiInputLabel-root': {
            color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
          },
          '& .MuiOutlinedInput-root': {
            color: isDarkMode ? '#fff' : 'inherit',
            '& fieldset': {
              borderColor: isDarkMode ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
            },
            '&:hover fieldset': {
              borderColor: isDarkMode ? '#2196f3' : '#1976d2',
            },
            '&.Mui-focused fieldset': {
              borderColor: isDarkMode ? '#2196f3' : '#1976d2',
            },
          },
          '& .MuiSelect-icon': {
            color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
          },
        }}>
          <InputLabel>Şantiye</InputLabel>
          <Select
            value={seciliSantiye?.id || ''}
            onChange={(e) => {
              const santiye = santiyeler.find(s => s.id === e.target.value);
              if (santiye) {
                setSeciliSantiye(santiye);
                setSeciliBlok(null);
              }
            }}
            label="Şantiye"
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: isDarkMode ? '#1e1e1e' : '#ffffff',
                  '& .MuiMenuItem-root': {
                    color: isDarkMode ? '#fff' : 'inherit',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    },
                    '&.Mui-selected': {
                      bgcolor: isDarkMode ? 'rgba(33,150,243,0.16)' : 'rgba(25,118,210,0.08)',
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(33,150,243,0.24)' : 'rgba(25,118,210,0.12)',
                      },
                    },
                  },
                },
              },
            }}
          >
            <MenuItem value="">
              <em>Seçiniz</em>
            </MenuItem>
            {Array.isArray(santiyeler) && santiyeler.map((santiye) => (
              santiye && santiye.id ? (
                <MenuItem key={santiye.id} value={santiye.id}>
                  {santiye.ad}
                </MenuItem>
              ) : null
            ))}
          </Select>
        </FormControl>

        {/* Blok Seçici */}
        <FormControl sx={{ 
          minWidth: 200,
          '& .MuiInputLabel-root': {
            color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
          },
          '& .MuiOutlinedInput-root': {
            color: isDarkMode ? '#fff' : 'inherit',
            '& fieldset': {
              borderColor: isDarkMode ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
            },
            '&:hover fieldset': {
              borderColor: isDarkMode ? '#2196f3' : '#1976d2',
            },
            '&.Mui-focused fieldset': {
              borderColor: isDarkMode ? '#2196f3' : '#1976d2',
            },
          },
          '& .MuiSelect-icon': {
            color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
          },
        }}>
          <InputLabel>Blok</InputLabel>
          <Select
            value={seciliBlok?.id || ''}
            onChange={(e) => {
              const blok = filteredBloklar.find(b => b.id === e.target.value);
              if (blok) {
                setSeciliBlok(blok);
              }
            }}
            disabled={!filteredBloklar.length}
            label="Blok"
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: isDarkMode ? '#1e1e1e' : '#ffffff',
                  '& .MuiMenuItem-root': {
                    color: isDarkMode ? '#fff' : 'inherit',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    },
                    '&.Mui-selected': {
                      bgcolor: isDarkMode ? 'rgba(33,150,243,0.16)' : 'rgba(25,118,210,0.08)',
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(33,150,243,0.24)' : 'rgba(25,118,210,0.12)',
                      },
                    },
                  },
                },
              },
            }}
          >
            <MenuItem value="">
              <em>Seçiniz</em>
            </MenuItem>
            {filteredBloklar.map((blok) => (
              <MenuItem key={blok.id || `blok-${blok.ad}`} value={blok.id || blok.ad}>
                {blok.ad}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Blok Yönetim Butonları */}
        {showBlokYonetim && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SettingsIcon />}
              onClick={() => setBlokYonetimOpen(true)}
              disabled={!seciliSantiye}
            >
              Blok Yönetimi
            </Button>

            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => setModalAcik(true)}
              disabled={!seciliSantiye}
            >
              Yeni Blok
            </Button>
          </Box>
        )}
      </Box>

      {/* Yeni Blok Modal */}
      <Dialog 
        open={modalAcik} 
        onClose={() => setModalAcik(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Yeni Blok Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Blok Adı"
                value={yeniBlok.ad}
                onChange={(e) => setYeniBlok(prev => ({ ...prev, ad: e.target.value }))}
                autoFocus
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Kat Sayısı"
                type="number"
                value={yeniBlok.katSayisi}
                onChange={(e) => setYeniBlok(prev => ({ ...prev, katSayisi: parseInt(e.target.value) || 9 }))}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Daire Sayısı"
                type="number"
                value={yeniBlok.daireSayisi}
                onChange={(e) => setYeniBlok(prev => ({ ...prev, daireSayisi: parseInt(e.target.value) || 4 }))}
                inputProps={{ min: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalAcik(false)}>İptal</Button>
          <Button onClick={handleYeniBlokEkle} variant="contained" color="primary">
            Ekle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Blok Yönetim Dialog */}
      <BlokYonetimDialog
        open={blokYonetimOpen}
        onClose={() => setBlokYonetimOpen(false)}
        santiye={seciliSantiye}
        onUpdate={handleBlokGuncelle}
        onDelete={handleBlokSil}
      />
    </Box>
  );
};

export default SantiyeSecici;
