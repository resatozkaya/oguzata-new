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
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon
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

const EksiklikFormModal = ({ open, onClose, eksiklik, onSave, taseronlar = [], binaYapisi }) => {
  const [formData, setFormData] = useState({
    daire: '',
    aciklama: '',
    durum: 'YENI',
    oncelik: 'NORMAL',
    taseron: '',
    kategori: '',
    fotograflar: [],
    id: ''
  });

  const [topluEklemeModuAktif, setTopluEklemeModuAktif] = useState(false);
  const [seciliDaireler, setSeciliDaireler] = useState([]);

  // Tüm daireleri düz liste halinde al
  const tumDaireler = binaYapisi?.bloklar?.[0]?.katlar?.flatMap(kat => 
    kat.daireler?.map(daire => ({
      no: daire.no,
      katNo: kat.no
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
        fotograflar: eksiklik.fotograflar || [],
        id: eksiklik.id
      });
    } else {
      setFormData({
        daire: '',
        aciklama: '',
        durum: 'YENI',
        oncelik: 'NORMAL',
        taseron: '',
        kategori: '',
        fotograflar: [],
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

  const handleFotografEkle = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Burada fotoğraf yükleme işlemi yapılacak
      // Şimdilik sadece dosya adını ekliyoruz
      setFormData(prev => ({
        ...prev,
        fotograflar: [...prev.fotograflar, file.name]
      }));
    }
  };

  const handleFotografSil = (index) => {
    setFormData(prev => ({
      ...prev,
      fotograflar: prev.fotograflar.filter((_, i) => i !== index)
    }));
  };

  return (
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
                <Box>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="foto-ekle"
                    type="file"
                    onChange={handleFotografEkle}
                  />
                  <label htmlFor="foto-ekle">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<PhotoCameraIcon />}
                    >
                      Fotoğraf Ekle
                    </Button>
                  </label>
                </Box>

                {formData.fotograflar.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Fotoğraflar:
                    </Typography>
                    <Grid container spacing={1}>
                      {formData.fotograflar.map((foto, index) => (
                        <Grid item key={index}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              bgcolor: 'grey.100',
                              p: 1,
                              borderRadius: 1
                            }}
                          >
                            <Typography variant="body2">{foto}</Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleFotografSil(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
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
                        <Grid item xs={4} key={daire.no}>
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
                            label={daire.no}
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
  );
};

export default EksiklikFormModal; 