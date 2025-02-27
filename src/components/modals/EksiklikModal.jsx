import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
  FormHelperText
} from '@mui/material';
import { IS_KATEGORILERI, ONCELIK_SEVIYELERI, DURUM_TIPLERI } from '../../constants/eksiklik';

const EksiklikModal = ({
  open,
  onClose,
  secilenSantiye,
  seciliBlokId,
  eksiklik,
  taseronService,
  eksiklikService,
  onEksiklikEklendi
}) => {
  const [formData, setFormData] = useState({
    kategori: eksiklik?.kategori || '',
    taseron: eksiklik?.taseron || '',
    oncelik: eksiklik?.oncelik || 'NORMAL',
    aciklama: eksiklik?.aciklama || '',
    daireNo: eksiklik?.daire_no || '',
    durum: eksiklik?.durum || 'YENI'
  });

  const [taseronlar, setTaseronlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [kaydetYukleniyor, setKaydetYukleniyor] = useState(false);
  const [hatalar, setHatalar] = useState({});

  // Modal açıldığında taşeronları yükle
  useEffect(() => {
    const taseronlariYukle = async () => {
      if (!open) return;

      try {
        setYukleniyor(true);
        console.log('Taşeronlar yükleniyor...');
        const data = await taseronService.taseronlariGetir();
        console.log('Yüklenen taşeronlar:', data);
        setTaseronlar(data);
      } catch (error) {
        console.error('Taşeronlar yüklenirken hata:', error);
      } finally {
        setYukleniyor(false);
      }
    };

    taseronlariYukle();
  }, [open, taseronService]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Hata mesajını temizle
    setHatalar(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const validateForm = () => {
    const yeniHatalar = {};
    
    if (!formData.kategori) {
      yeniHatalar.kategori = 'İş kategorisi seçiniz';
    }
    if (!formData.daireNo) {
      yeniHatalar.daireNo = 'Daire no giriniz';
    }
    if (!formData.aciklama) {
      yeniHatalar.aciklama = 'Açıklama giriniz';
    }

    setHatalar(yeniHatalar);
    return Object.keys(yeniHatalar).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (!secilenSantiye || !seciliBlokId) {
        console.error('Santiye veya blok seçili değil');
        return;
      }

      setKaydetYukleniyor(true);
      console.log('Form gönderiliyor:', formData);

      if (eksiklik?.id) {
        await eksiklikService.eksiklikGuncelle(
          secilenSantiye,
          seciliBlokId,
          eksiklik.id,
          formData
        );
      } else {
        await eksiklikService.eksiklikEkle(
          secilenSantiye,
          seciliBlokId,
          formData
        );
      }

      onEksiklikEklendi();
      handleClose();
    } catch (error) {
      console.error('Form gönderilirken hata:', error);
    } finally {
      setKaydetYukleniyor(false);
    }
  };

  const handleClose = () => {
    setFormData({
      kategori: '',
      taseron: '',
      oncelik: 'NORMAL',
      aciklama: '',
      daireNo: '',
      durum: 'YENI'
    });
    setHatalar({});
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 1
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {eksiklik ? 'Eksiklik Düzenle' : 'Yeni Eksiklik Ekle'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* İş Kategorisi */}
          <FormControl error={!!hatalar.kategori} required>
            <InputLabel>İş Kategorisi</InputLabel>
            <Select
              name="kategori"
              value={formData.kategori}
              onChange={handleChange}
              label="İş Kategorisi"
            >
              <MenuItem value="">
                <em>Seçiniz</em>
              </MenuItem>
              {IS_KATEGORILERI.map(kategori => (
                <MenuItem key={kategori} value={kategori}>
                  {kategori}
                </MenuItem>
              ))}
            </Select>
            {hatalar.kategori && (
              <FormHelperText>{hatalar.kategori}</FormHelperText>
            )}
          </FormControl>

          {/* Taşeron */}
          <FormControl>
            <InputLabel>Taşeron</InputLabel>
            <Select
              name="taseron"
              value={formData.taseron}
              onChange={handleChange}
              label="Taşeron"
            >
              <MenuItem value="">
                <em>Seçiniz</em>
              </MenuItem>
              {yukleniyor ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Yükleniyor...
                </MenuItem>
              ) : (
                taseronlar.map(taseron => (
                  <MenuItem key={taseron.id} value={taseron.id}>
                    {taseron.ad_soyad} {taseron.firma ? `(${taseron.firma})` : ''}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {/* Öncelik */}
          <FormControl>
            <InputLabel>Öncelik</InputLabel>
            <Select
              name="oncelik"
              value={formData.oncelik}
              onChange={handleChange}
              label="Öncelik"
            >
              {ONCELIK_SEVIYELERI.map(oncelik => (
                <MenuItem key={oncelik} value={oncelik}>
                  {oncelik}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Durum */}
          {eksiklik && (
            <FormControl>
              <InputLabel>Durum</InputLabel>
              <Select
                name="durum"
                value={formData.durum}
                onChange={handleChange}
                label="Durum"
              >
                {DURUM_TIPLERI.map(durum => (
                  <MenuItem key={durum} value={durum}>
                    {durum}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Daire No */}
          <TextField
            required
            fullWidth
            label="Daire No"
            name="daireNo"
            value={formData.daireNo}
            onChange={handleChange}
            error={!!hatalar.daireNo}
            helperText={hatalar.daireNo}
          />

          {/* Açıklama */}
          <TextField
            required
            fullWidth
            label="Açıklama"
            name="aciklama"
            value={formData.aciklama}
            onChange={handleChange}
            multiline
            rows={4}
            error={!!hatalar.aciklama}
            helperText={hatalar.aciklama}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit">
          İptal
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={kaydetYukleniyor}
        >
          {kaydetYukleniyor ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Kaydediliyor...
            </>
          ) : (
            'Kaydet'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EksiklikModal;
