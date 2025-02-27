import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useDepo } from '../../contexts/DepoContext';
import { depoService } from '../../services/depoService';

const IslemDuzenleDialog = ({ open, onClose, islem, onSuccess }) => {
  const { seciliSantiye, seciliDepo, setMalzemeler } = useDepo();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [duzenlenenIslem, setDuzenlenenIslem] = useState({
    miktar: '',
    islemTuru: '',
    aciklama: ''
  });

  useEffect(() => {
    if (islem) {
      setDuzenlenenIslem({
        miktar: islem.miktar,
        islemTuru: islem.islemTuru,
        aciklama: islem.aciklama || ''
      });
    }
  }, [islem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Tüm gerekli alanların kontrolü
    if (!islem?.id || !islem?.malzemeId || !seciliSantiye?.id || !seciliDepo?.id) {
      console.error('Eksik parametreler:', { 
        islemId: islem?.id,
        malzemeId: islem?.malzemeId,
        santiyeId: seciliSantiye?.id,
        depoId: seciliDepo?.id 
      });
      alert('İşlem güncellemek için gerekli bilgiler eksik');
      return;
    }

    try {
      setYukleniyor(true);

      console.log('Düzenlenen işlem bilgileri:', {
        islem,
        duzenlenenIslem,
        santiyeId: seciliSantiye.id,
        depoId: seciliDepo.id,
        malzemeId: islem.malzemeId
      });

      // Miktar farkını hesapla
      const eskiMiktar = islem.islemTuru === 'Giriş' 
        ? Number(islem.miktar) 
        : -Number(islem.miktar);
      
      const yeniMiktar = duzenlenenIslem.islemTuru === 'Giriş'
        ? Number(duzenlenenIslem.miktar)
        : -Number(duzenlenenIslem.miktar);

      const miktarFarki = yeniMiktar - eskiMiktar;

      // İşlemi güncelle
      await depoService.islemGuncelle(
        seciliSantiye.id,
        seciliDepo.id,
        islem.malzemeId,
        islem.id,
        {
          miktar: Number(duzenlenenIslem.miktar),
          islemTuru: duzenlenenIslem.islemTuru,
          aciklama: duzenlenenIslem.aciklama || ''
        }
      );

      // Malzeme miktarını güncelle
      await depoService.malzemeMiktarGuncelle(
        seciliSantiye.id,
        seciliDepo.id,
        islem.malzemeId,
        miktarFarki
      );

      // Malzemeler listesini güncelle
      setMalzemeler(prev => prev.map(m => 
        m.id === islem.malzemeId
          ? { ...m, miktar: Number(m.miktar) + miktarFarki }
          : m
      ));

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('İşlem güncelleme hatası:', error);
      alert('İşlem güncellenirken bir hata oluştu: ' + error.message);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>İşlem Düzenle</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>İşlem Türü</InputLabel>
              <Select
                value={duzenlenenIslem.islemTuru}
                label="İşlem Türü"
                onChange={(e) => setDuzenlenenIslem(prev => ({
                  ...prev,
                  islemTuru: e.target.value
                }))}
              >
                <MenuItem value="Giriş">Giriş</MenuItem>
                <MenuItem value="Çıkış">Çıkış</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Miktar"
              type="number"
              value={duzenlenenIslem.miktar}
              onChange={(e) => setDuzenlenenIslem(prev => ({
                ...prev,
                miktar: e.target.value
              }))}
              required
            />

            <TextField
              fullWidth
              label="Açıklama"
              multiline
              rows={3}
              value={duzenlenenIslem.aciklama}
              onChange={(e) => setDuzenlenenIslem(prev => ({
                ...prev,
                aciklama: e.target.value
              }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>İptal</Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={yukleniyor}
          >
            {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default IslemDuzenleDialog; 