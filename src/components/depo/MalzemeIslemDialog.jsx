import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography
} from '@mui/material';
import { useDepo } from '../../contexts/DepoContext';
import { depoService } from '../../services/depoService';

const MalzemeIslemDialog = ({ open, onClose, malzeme }) => {
  const { seciliSantiye, seciliDepo, setMalzemeler } = useDepo();
  const [islem, setIslem] = useState({
    miktar: '',
    islemTuru: 'Giriş',
    aciklama: ''
  });
  const [yukleniyor, setYukleniyor] = useState(false);

  // Dialog açıldığında form'u sıfırla
  React.useEffect(() => {
    if (open) {
      setIslem({
        miktar: '',
        islemTuru: 'Giriş',
        aciklama: ''
      });
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Malzeme kontrolü
    if (!malzeme) {
      alert('Lütfen bir malzeme seçin');
      return;
    }

    // Miktar kontrolü
    if (!islem.miktar || islem.miktar <= 0) {
      alert('Lütfen geçerli bir miktar girin');
      return;
    }

    // Şantiye ve depo kontrolü
    if (!seciliSantiye?.id || !seciliDepo?.id) {
      alert('Lütfen şantiye ve depo seçin');
      return;
    }

    try {
      setYukleniyor(true);

      // Yeni miktarı hesapla
      const yeniMiktar = islem.islemTuru === 'Giriş' 
        ? Number(malzeme.miktar) + Number(islem.miktar)
        : Number(malzeme.miktar) - Number(islem.miktar);

      if (yeniMiktar < 0) {
        alert('Stok miktarı negatif olamaz!');
        return;
      }

      // İşlem verisi hazırla
      const islemVerisi = {
        miktar: Number(islem.miktar),
        islemTuru: islem.islemTuru,
        aciklama: islem.aciklama,
        malzemeAdi: malzeme.ad,
        birim: malzeme.birim,
        tarih: new Date()
      };

      // Önce işlemi kaydet
      await depoService.malzemeIslemEkle(
        seciliSantiye.id,
        seciliDepo.id,
        malzeme.id,
        islemVerisi
      );

      // Sonra malzeme miktarını güncelle
      await depoService.malzemeGuncelle(
        seciliSantiye.id,
        seciliDepo.id,
        malzeme.id,
        { miktar: yeniMiktar }
      );

      // Malzemeler listesini güncelle
      setMalzemeler(prev => prev.map(m => 
        m.id === malzeme.id 
          ? { ...m, miktar: yeniMiktar }
          : m
      ));

      onClose();
    } catch (error) {
      console.error('İşlem eklenirken hata:', error);
      alert(error.message || 'İşlem eklenirken bir hata oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  // Dialog içeriğini malzeme varsa göster
  if (!malzeme) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {malzeme.ad} - Malzeme İşlemi
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle1">
              Mevcut Miktar: {malzeme?.miktar} {malzeme?.birim}
            </Typography>

            <FormControl fullWidth>
              <InputLabel>İşlem Türü</InputLabel>
              <Select
                value={islem.islemTuru}
                label="İşlem Türü"
                onChange={(e) => setIslem(prev => ({ ...prev, islemTuru: e.target.value }))}
              >
                <MenuItem value="Giriş">Giriş</MenuItem>
                <MenuItem value="Çıkış">Çıkış</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Miktar"
              type="number"
              value={islem.miktar}
              onChange={(e) => setIslem(prev => ({ ...prev, miktar: e.target.value }))}
              required
            />

            <TextField
              fullWidth
              label="Açıklama"
              multiline
              rows={3}
              value={islem.aciklama}
              onChange={(e) => setIslem(prev => ({ ...prev, aciklama: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={yukleniyor}>İptal</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={yukleniyor || !islem.miktar}
          >
            {yukleniyor ? 'Kaydediliyor...' : 'İşlemi Kaydet'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MalzemeIslemDialog; 