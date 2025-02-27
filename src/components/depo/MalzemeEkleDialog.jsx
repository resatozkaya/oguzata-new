import React, { useState } from 'react';
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
  IconButton,
  Autocomplete
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { useDepo } from '../../contexts/DepoContext';
import { depoService } from '../../services/depoService';
import { Dialog as ImageDialog } from '@mui/material';

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

const MalzemeEkleDialog = ({ open, onClose, depoId }) => {
  const { malzemeler, setMalzemeler, seciliSantiye } = useDepo();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [malzeme, setMalzeme] = useState({
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

  // Önceden tanımlı birimler
  const birimListesi = [
    'ADET',
    'KOVA',
    'METRE',
    'M2',
    'M3',
    'KG',
    'TON',
    'TORBA',
    'RULO',
    'KUTU',
    'LİTRE'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMalzeme(prev => ({
      ...prev,
      [name]: name === 'miktar' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleResimChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64 = reader.result;
        setResimOnizleme(base64);
        setMalzeme(prev => ({
          ...prev,
          resim: base64
        }));
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!malzeme.ad.trim() || !malzeme.kategori || !depoId || malzeme.miktar === '' || !seciliSantiye) return;

    try {
      setYukleniyor(true);
      
      const yeniMalzeme = await depoService.malzemeEkle(seciliSantiye.id, depoId, {
        ...malzeme,
        tarih: new Date(),
        islemTuru: malzeme.islemTuru,
        miktar: Number(malzeme.miktar)
      });
      
      setMalzemeler([...malzemeler, yeniMalzeme]);
      
      // Formu temizle
      setMalzeme({
        ad: '',
        kategori: '',
        miktar: '',
        birim: '',
        islemTuru: 'Giriş',
        aciklama: '',
        kritikStokSeviyesi: 10,
        resim: null
      });
      setResimOnizleme(null);
      
      onClose();
    } catch (error) {
      console.error('Malzeme eklenirken hata:', error);
      alert('Malzeme eklenirken bir hata oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Yeni İşlem</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                autoFocus
                fullWidth
                label="Ürün Adı"
                name="ad"
                value={malzeme.ad}
                onChange={handleChange}
                required
              />

              <FormControl fullWidth required>
                <InputLabel>Kategori</InputLabel>
                <Select
                  name="kategori"
                  value={malzeme.kategori}
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
                  value={malzeme.miktar}
                  onChange={handleChange}
                  required
                />
                <Autocomplete
                  freeSolo
                  options={birimListesi}
                  value={malzeme.birim}
                  onChange={(event, newValue) => {
                    setMalzeme(prev => ({
                      ...prev,
                      birim: newValue || ''
                    }));
                  }}
                  onInputChange={(event, newInputValue) => {
                    setMalzeme(prev => ({
                      ...prev,
                      birim: newInputValue
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Birim"
                      required
                      helperText="Listeden seçin veya yeni birim girin"
                    />
                  )}
                />
              </Box>

              <FormControl fullWidth required>
                <InputLabel>İşlem Türü</InputLabel>
                <Select
                  name="islemTuru"
                  value={malzeme.islemTuru}
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
                value={malzeme.aciklama}
                onChange={handleChange}
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
                      src={resimOnizleme} 
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

              <TextField
                fullWidth
                label="Kritik Stok Seviyesi"
                type="number"
                value={malzeme.kritikStokSeviyesi}
                onChange={(e) => setMalzeme(prev => ({
                  ...prev,
                  kritikStokSeviyesi: Number(e.target.value)
                }))}
                helperText="Bu seviyenin altına düşünce uyarı verilecek"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>İptal</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={!malzeme.ad.trim() || !malzeme.kategori || malzeme.miktar === '' || yukleniyor}
            >
              Kaydet
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
              src={resimOnizleme} 
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

export default MalzemeEkleDialog; 