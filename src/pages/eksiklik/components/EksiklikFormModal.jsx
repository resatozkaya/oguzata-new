import React, { useState, useEffect } from 'react';
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
  Grid,
  Box,
  IconButton,
  Typography,
  Checkbox,
  FormControlLabel,
  Paper,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  PhotoCamera,
  Delete as DeleteIcon,
  PhotoLibrary as PhotoLibraryIcon
} from '@mui/icons-material';

const DURUM_SECENEKLERI = [
  { value: 'YENI', label: 'Yeni' },
  { value: 'DEVAM_EDIYOR', label: 'Devam Ediyor' },
  { value: 'TAMAMLANDI', label: 'Tamamlandı' },
  { value: 'BEKLEMEDE', label: 'Beklemede' }
];

const ONCELIK_SECENEKLERI = [
  { value: 'DUSUK', label: 'Düşük' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'YUKSEK', label: 'Yüksek' },
  { value: 'KRITIK', label: 'Kritik' }
];

const IS_KATEGORILERI = [
  { value: 'KABA_YAPI', label: 'Kaba Yapı' },
  { value: 'INCE_YAPI', label: 'İnce Yapı' },
  { value: 'MEKANIK', label: 'Mekanik' },
  { value: 'ELEKTRIK', label: 'Elektrik' },
  { value: 'PEYZAJ', label: 'Peyzaj' },
  { value: 'DIGER', label: 'Diğer' }
];

const TASERONLAR = [
  { id: 'OGUZATA', ad: 'OĞUZATA' },
  { id: 'ANGORA_DOGRAMA', ad: 'ANGORA DOĞRAMA' },
  { id: 'DEMIR_MEKANIK', ad: 'DEMİR MEKANİK' },
  { id: 'MRT_GUVENLIK', ad: 'MRT GÜVENLİK SİSTEMLERİ' },
  { id: 'KABINET', ad: 'KABİNET' },
  { id: 'DUMAN_DOGRAMA', ad: 'DUMAN DOĞRAMA' },
  { id: 'IVME_ELEKTRIK', ad: 'İVME ELEKTRİK' },
  { id: 'TURK_TELEKOM', ad: 'TÜRK TELEKOM' },
  { id: 'MOTA_MOBILYA', ad: 'MOTA MOBİLYA' },
  { id: 'EGE_PARKE', ad: 'EGE PARKE' },
  { id: 'GEZE_FOTOSELLI', ad: 'GEZE FOTOSELLİ KAPI' },
  { id: 'BETAMER', ad: 'BETAMER' },
  { id: 'DUS_TEKNESI', ad: 'DUŞ TEKNESİ' },
  { id: 'FOTOSELLI_KAPI', ad: 'FOTOSELLİ KAPI' },
  { id: 'LINEA_DEKOR', ad: 'LİNEA DEKOR' },
  { id: 'XXX_FIRMA', ad: 'XXX FİRMA' },
  { id: 'SUR_KAPI', ad: 'SUR KAPI' },
  { id: 'MERMER_ORHAN', ad: 'MERMER ORHAN' }
];

const EksiklikFormModal = ({ open, onClose, eksiklik, onSave, taseronlar = TASERONLAR, binaYapisi }) => {
  const [formData, setFormData] = useState({
    daire: '',
    aciklama: '',
    durum: 'YENI',
    oncelik: 'NORMAL',
    taseron: '',
    kategori: '',
    resimler: [],
    id: ''
  });

  const [topluEklemeModuAktif, setTopluEklemeModuAktif] = useState(false);
  const [seciliDaireler, setSeciliDaireler] = useState([]);
  const [buyukResim, setBuyukResim] = useState(null);

  // Tüm daireleri düz liste halinde al
  const tumDaireler = binaYapisi?.bloklar?.[0]?.katlar?.flatMap(kat => 
    kat.daireler?.map(daire => ({
      no: daire.no,
      katNo: kat.no,
      id: `${kat.no}-${daire.no}`
    }))
  ).sort((a, b) => a.no - b.no) || [];

  useEffect(() => {
    if (eksiklik) {
      setFormData({
        daire: eksiklik.daire || '',
        aciklama: eksiklik.aciklama || '',
        durum: eksiklik.durum || 'YENI',
        oncelik: eksiklik.oncelik || 'NORMAL',
        taseron: eksiklik.taseron || '',
        kategori: eksiklik.kategori || '',
        resimler: eksiklik.resimler || [],
        id: eksiklik.id
      });
      // Düzenleme modunda toplu eksiklik modunu devre dışı bırak
      setTopluEklemeModuAktif(false);
    } else {
      setFormData({
        daire: '',
        aciklama: '',
        durum: 'YENI',
        oncelik: 'NORMAL',
        taseron: '',
        kategori: '',
        resimler: [],
        id: ''
      });
    }
  }, [eksiklik]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDaireSecim = (daireNo) => {
    setSeciliDaireler(prev => 
      prev.includes(daireNo) 
        ? prev.filter(no => no !== daireNo)
        : [...prev, daireNo]
    );
  };

  const handleTopluKaydet = async () => {
    for (const daireNo of seciliDaireler) {
      await onSave({
        ...formData,
        daire: daireNo
      });
    }
    onClose();
  };

  const handleSubmit = () => {
    console.log('Form Data:', formData); // Debug için
    onSave(formData);
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    
    // Dosya boyutu kontrolü
    const oversizedFiles = files.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      alert('Bazı dosyalar 5MB\'tan büyük. Lütfen daha küçük dosyalar seçin.');
      return;
    }

    // Mobil cihazlarda resim sıkıştırma
    const processImage = async (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Maksimum boyutlar
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;

            // Boyut oranını koru
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Kalite ayarı (0.7 = %70 kalite)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(dataUrl);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    };

    // Her dosyayı işle
    const processFiles = async () => {
      try {
        const processedImages = await Promise.all(files.map(processImage));
        setFormData(prev => ({
          ...prev,
          resimler: [...prev.resimler, ...processedImages]
        }));
      } catch (error) {
        console.error('Resim işlenirken hata:', error);
        alert('Resimler yüklenirken hata oluştu');
      }
    };

    processFiles();
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      resimler: prev.resimler.filter((_, i) => i !== index)
    }));
  };

  const handleImageClick = (resim) => {
    setBuyukResim(resim);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {eksiklik ? 'Eksiklik Düzenle' : 'Yeni Eksiklik Ekle'}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {!eksiklik && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={topluEklemeModuAktif}
                    onChange={(e) => setTopluEklemeModuAktif(e.target.checked)}
                  />
                }
                label="Toplu Eksiklik Ekleme Modu"
              />
            </Box>
          )}

          <Grid container spacing={3}>
            {/* Sol Panel */}
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>İş Kategorisi</InputLabel>
                    <Select
                      value={formData.kategori}
                      label="İş Kategorisi"
                      onChange={(e) => handleChange('kategori', e.target.value)}
                    >
                      <MenuItem value="">Seçiniz</MenuItem>
                      {IS_KATEGORILERI.map(kategori => (
                        <MenuItem key={kategori.value} value={kategori.value}>
                          {kategori.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Taşeron</InputLabel>
                    <Select
                      value={formData.taseron}
                      label="Taşeron"
                      onChange={(e) => handleChange('taseron', e.target.value)}
                    >
                      <MenuItem value="">Seçiniz</MenuItem>
                      {taseronlar.map(taseron => (
                        <MenuItem key={taseron.id} value={taseron.id}>
                          {taseron.ad}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Durum</InputLabel>
                    <Select
                      value={formData.durum}
                      label="Durum"
                      onChange={(e) => handleChange('durum', e.target.value)}
                    >
                      {DURUM_SECENEKLERI.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Öncelik</InputLabel>
                    <Select
                      value={formData.oncelik}
                      label="Öncelik"
                      onChange={(e) => handleChange('oncelik', e.target.value)}
                    >
                      {ONCELIK_SECENEKLERI.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Açıklama"
                    value={formData.aciklama}
                    onChange={(e) => handleChange('aciklama', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ 
                    border: '2px dashed #ccc', 
                    borderRadius: 2, 
                    p: 2, 
                    textAlign: 'center',
                    '&:hover': { borderColor: 'primary.main' }
                  }}>
                    <Grid container spacing={2} justifyContent="center">
                      <Grid item xs={12} sm={6}>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="kamera-ile-cek"
                          type="file"
                          onChange={handleImageUpload}
                          capture="environment"
                        />
                        <label htmlFor="kamera-ile-cek">
                          <Button
                            variant="contained"
                            component="span"
                            fullWidth
                            startIcon={<PhotoCamera />}
                            sx={{ mb: { xs: 1, sm: 0 } }}
                          >
                            Kamera ile Çek
                          </Button>
                        </label>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="dosyadan-sec"
                          type="file"
                          onChange={handleImageUpload}
                          multiple
                        />
                        <label htmlFor="dosyadan-sec">
                          <Button
                            variant="outlined"
                            component="span"
                            fullWidth
                            startIcon={<PhotoLibraryIcon />}
                          >
                            Galeriden Seç
                          </Button>
                        </label>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary">
                          Maksimum dosya boyutu: 5MB
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Yüklenen resimlerin önizlemesi */}
                    {formData.resimler.length > 0 && (
                      <Box sx={{ 
                        mt: 2,
                        display: 'flex',
                        gap: 1,
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                      }}>
                        {formData.resimler.map((resim, index) => (
                          <Box
                            key={index}
                            sx={{
                              position: 'relative',
                              width: 100,
                              height: 100
                            }}
                          >
                            <img
                              src={resim}
                              alt={`Önizleme ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveImage(index)}
                              sx={{
                                position: 'absolute',
                                right: -12,
                                top: -12,
                                bgcolor: 'background.paper',
                                boxShadow: 1,
                                '&:hover': {
                                  bgcolor: 'error.light',
                                  color: 'white'
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* Sağ Panel - Daire Seçimi */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%', bgcolor: 'background.paper' }}>
                {!topluEklemeModuAktif ? (
                  <TextField
                    fullWidth
                    label="Daire No"
                    value={formData.daire}
                    onChange={(e) => handleChange('daire', e.target.value)}
                  />
                ) : (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: 'text.primary' }}>Daireler</Typography>
                      <Chip label={`${seciliDaireler.length} daire seçili`} color="primary" />
                    </Box>
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                      <Grid container spacing={1}>
                        {tumDaireler.map(daire => (
                          <Grid item xs={4} key={daire.id}>
                            <FormControlLabel
                              sx={{
                                '& .MuiFormControlLabel-label': {
                                  color: 'text.primary'
                                }
                              }}
                              control={
                                <Checkbox
                                  checked={seciliDaireler.includes(daire.no)}
                                  onChange={() => handleDaireSecim(daire.no)}
                                  sx={{
                                    color: 'primary.main',
                                    '&.Mui-checked': {
                                      color: 'primary.main',
                                    },
                                  }}
                                />
                              }
                              label={`${daire.no} (Kat ${daire.katNo})`}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>İptal</Button>
          <Button
            onClick={topluEklemeModuAktif ? handleTopluKaydet : handleSubmit}
            variant="contained"
            color="primary"
            disabled={topluEklemeModuAktif && seciliDaireler.length === 0}
          >
            {topluEklemeModuAktif 
              ? `${seciliDaireler.length} Daireye Ekle` 
              : eksiklik ? 'Güncelle' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resim Büyütme Modal */}
      <Dialog
        open={Boolean(buyukResim)}
        onClose={() => setBuyukResim(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setBuyukResim(null)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'error.light',
                color: 'white'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          {buyukResim && (
            <img
              src={buyukResim}
              alt="Büyük Resim"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '90vh',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EksiklikFormModal;