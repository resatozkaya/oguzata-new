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
import { useSnackbar } from '@/contexts/SnackbarContext';
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
  const { showSnackbar } = useSnackbar();
  const [modalAcik, setModalAcik] = useState(false);
  const [yeniBlok, setYeniBlok] = useState({
    ad: '',
    katSayisi: 9,
    daireSayisi: 4
  });
  const [blokYonetimOpen, setBlokYonetimOpen] = useState(false);

  const handleYeniBlokEkle = async () => {
    if (!seciliSantiye?.id || !yeniBlok.ad) {
      showSnackbar('Lütfen şantiye seçin ve blok adı girin', 'warning');
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
      
      showSnackbar('Yeni blok başarıyla eklendi', 'success');
    } catch (error) {
      console.error('Blok eklenirken hata:', error);
      showSnackbar('Blok eklenirken hata oluştu', 'error');
    }
  };

  // Blok güncelleme fonksiyonu
  const handleBlokGuncelle = async (blokId, yeniAd) => {
    if (!seciliSantiye?.id || !blokId) {
      showSnackbar('Geçerli bir şantiye ve blok seçilmedi', 'warning');
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

      showSnackbar('Blok başarıyla güncellendi', 'success');
    } catch (error) {
      console.error('Blok güncellenirken hata:', error);
      showSnackbar('Blok güncellenirken hata oluştu: ' + error.message, 'error');
    }
  };

  // BlokYonetimDialog'da kullanılacak
  const handleBlokSil = async (blokId) => {
    if (!seciliSantiye?.id || !blokId) {
      showSnackbar('Geçerli bir şantiye ve blok seçilmedi', 'warning');
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

      showSnackbar('Blok başarıyla silindi', 'success');
    } catch (error) {
      console.error('Blok silinirken hata:', error);
      showSnackbar('Blok silinirken hata oluştu: ' + error.message, 'error');
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
        bgcolor: '#1e1e1e',
        borderRadius: 1
      }}>
        {/* Şantiye Seçici */}
        <FormControl sx={{ minWidth: 200 }}>
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
        <FormControl sx={{ minWidth: 200 }}>
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
