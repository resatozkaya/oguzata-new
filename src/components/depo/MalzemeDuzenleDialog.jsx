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
  MenuItem
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { useDepo } from '../../contexts/DepoContext';
import { depoService } from '../../services/depoService';
import imageCompression from 'browser-image-compression';

const MALZEME_KATEGORILERI = [
  'İNŞAAT',
  'BOYA_MALZEMELERI',
  'ELEKTRIK_MALZEMELERI',
  'TESISAT_MALZEMELERI',
  'HIRDAVAT',
  'DIGER'
];

const BIRIM_TIPLERI = [
  'ADET',
  'KOVA',
  'TENEKE',
  'KG',
  'METRE',
  'PAKET'
];

const ISLEM_TURLERI = [
  'Giriş',
  'Çıkış'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_SIZE = 800; // maksimum 800px genişlik/yükseklik

const MalzemeDuzenleDialog = ({ open, onClose, malzeme }) => {
  const { seciliSantiye, seciliDepo, setMalzemeler } = useDepo();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [duzenlenenMalzeme, setDuzenlenenMalzeme] = useState({
    ad: '',
    kategori: '',
    miktar: '',
    birim: '',
    islemTuru: 'Giriş',
    aciklama: '',
    kritikStokSeviyesi: 10,
    resim: null
  });
  const [resimOnizleme, setResimOnizleme] = useState(null);
  const [buyukResimDialogAcik, setBuyukResimDialogAcik] = useState(false);

  // Malzeme değiştiğinde formu güncelle
  useEffect(() => {
    if (malzeme) {
      setDuzenlenenMalzeme({
        ad: malzeme.ad || '',
        kategori: malzeme.kategori || '',
        miktar: malzeme.miktar || '',
        birim: malzeme.birim || '',
        islemTuru: malzeme.islemTuru || 'Giriş',
        aciklama: malzeme.aciklama || '',
        kritikStokSeviyesi: malzeme.kritikStokSeviyesi || 10,
        resim: malzeme.resim || null
      });
      setResimOnizleme(malzeme.resimUrl || null);
    }
  }, [malzeme]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDuzenlenenMalzeme(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleResimChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert('Dosya boyutu çok büyük (maksimum 5MB)');
      return;
    }

    try {
      setYukleniyor(true);

      // Resmi sıkıştır
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: MAX_IMAGE_SIZE,
        useWebWorker: true
      };
      
      const compressedFile = await imageCompression(file, options);
      const base64Image = await convertToBase64(compressedFile);
      
      // Base64 string'i kırp (data:image/jpeg;base64, kısmını kaldır)
      const base64Data = base64Image.split(',')[1];
      
      setResimOnizleme(base64Image);
      setDuzenlenenMalzeme(prev => ({
        ...prev,
        resim: base64Data // Sadece base64 data kısmını sakla
      }));
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      alert('Resim yüklenirken bir hata oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  // Resmi görüntülerken base64 formatını tamamla
  const getImageUrl = (base64Data) => {
    if (!base64Data) return null;
    // Eğer zaten tam base64 url ise olduğu gibi döndür
    if (base64Data.startsWith('data:image/')) return base64Data;
    // Değilse base64 header ekle
    return `data:image/jpeg;base64,${base64Data}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!malzeme?.id || !seciliSantiye?.id || !seciliDepo?.id) return;

    try {
      setYukleniyor(true);

      // Güncellenecek veriyi hazırla
      const guncellenecekVeri = {
        ...duzenlenenMalzeme,
        kritikStokSeviyesi: Number(duzenlenenMalzeme.kritikStokSeviyesi),
        miktar: Number(duzenlenenMalzeme.miktar)
      };

      // Eğer yeni resim yüklendiyse ekle
      if (duzenlenenMalzeme.resim && duzenlenenMalzeme.resim !== malzeme.resim) {
        guncellenecekVeri.resimUrl = duzenlenenMalzeme.resim;
      }

      // Malzemeyi güncelle
      await depoService.malzemeGuncelle(
        seciliSantiye.id,
        seciliDepo.id,
        malzeme.id,
        guncellenecekVeri
      );

      // Listeyi güncelle
      setMalzemeler(prev => prev.map(m => 
        m.id === malzeme.id 
          ? { ...m, ...guncellenecekVeri }
          : m
      ));

      onClose();
    } catch (error) {
      console.error('Malzeme güncellenirken hata:', error);
      alert('Malzeme güncellenirken bir hata oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Malzeme Düzenle</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                autoFocus
                fullWidth
                label="Ürün Adı"
                name="ad"
                value={duzenlenenMalzeme.ad}
                onChange={handleChange}
                required
              />

              <FormControl fullWidth required>
                <InputLabel>Kategori</InputLabel>
                <Select
                  name="kategori"
                  value={duzenlenenMalzeme.kategori}
                  label="Kategori"
                  onChange={handleChange}
                >
                  {MALZEME_KATEGORILERI.map((kategori) => (
                    <MenuItem key={kategori} value={kategori}>
                      {kategori.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <TextField
                  type="number"
                  label="Miktar"
                  name="miktar"
                  value={duzenlenenMalzeme.miktar}
                  onChange={handleChange}
                  required
                />
                <FormControl fullWidth required>
                  <InputLabel>Birim</InputLabel>
                  <Select
                    name="birim"
                    value={duzenlenenMalzeme.birim}
                    label="Birim"
                    onChange={handleChange}
                  >
                    {BIRIM_TIPLERI.map((birim) => (
                      <MenuItem key={birim} value={birim}>
                        {birim}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <FormControl fullWidth required>
                <InputLabel>İşlem Türü</InputLabel>
                <Select
                  name="islemTuru"
                  value={duzenlenenMalzeme.islemTuru}
                  label="İşlem Türü"
                  onChange={handleChange}
                >
                  {ISLEM_TURLERI.map((tur) => (
                    <MenuItem key={tur} value={tur}>
                      {tur}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Açıklama"
                name="aciklama"
                value={duzenlenenMalzeme.aciklama}
                onChange={handleChange}
              />

              <TextField
                fullWidth
                label="Kritik Stok Seviyesi"
                name="kritikStokSeviyesi"
                type="number"
                value={duzenlenenMalzeme.kritikStokSeviyesi}
                onChange={handleChange}
                helperText="Bu seviyenin altına düşünce uyarı verilecek"
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                >
                  Resim Seç
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleResimChange}
                  />
                </Button>
                
                {resimOnizleme && (
                  <Box 
                    sx={{ 
                      ml: 2, 
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                    onClick={() => setBuyukResimDialogAcik(true)}
                  >
                    <img 
                      src={getImageUrl(resimOnizleme)} 
                      alt="Önizleme" 
                      style={{ 
                        width: '50px', 
                        height: '50px', 
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }} 
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} disabled={yukleniyor}>İptal</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={yukleniyor || !duzenlenenMalzeme.ad.trim()}
            >
              {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Büyük resim gösterme dialogu */}
      <Dialog 
        open={buyukResimDialogAcik} 
        onClose={() => setBuyukResimDialogAcik(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {resimOnizleme && (
            <img 
              src={getImageUrl(resimOnizleme)} 
              alt="Büyük Resim" 
              style={{ 
                width: '100%', 
                height: 'auto', 
                display: 'block'
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MalzemeDuzenleDialog; 