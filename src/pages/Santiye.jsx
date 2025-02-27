import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Grid,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Avatar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EngineeringIcon from '@mui/icons-material/Engineering';
import BusinessIcon from '@mui/icons-material/Business';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { useTheme } from '../contexts/ThemeContext';

const Santiye = () => {
  const { isDarkMode } = useTheme();
  const [santiyeler, setSantiyeler] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [formData, setFormData] = useState({
    ad: '',
    adres: '',
    santiyeSefi: '',
    projeMuduru: '',
    durum: 'aktif',
    baslangicTarihi: '',
    bitisTarihi: '',
    notlar: '',
    resimUrl: '',
    kod: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Şantiyeleri getir
  const fetchSantiyeler = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'santiyeler'), orderBy('ad'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSantiyeler(data);
    } catch (error) {
      console.error('Şantiyeler yüklenirken hata:', error);
      showSnackbar('Şantiyeler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSantiyeler();
  }, []);

  // Benzersiz kod oluştur
  const generateUniqueCode = async () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const usedCodes = new Set(santiyeler.map(s => s.kod));
    
    for (let letter of letters) {
      if (!usedCodes.has(letter)) {
        return letter;
      }
    }
    return null;
  };

  // Resim sıkıştırma
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

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
          
          // Sıkıştırılmış base64
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressedBase64);
        };
      };
    });
  };

  // Resim yükleme
  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showSnackbar('Resim boyutu 5MB\'dan küçük olmalıdır', 'error');
        return;
      }

      try {
        setLoading(true);
        const compressedBase64 = await compressImage(file);
        setFormData(prev => ({ ...prev, resimUrl: compressedBase64 }));
        setSelectedImage(file);
      } catch (error) {
        console.error('Resim sıkıştırma hatası:', error);
        showSnackbar('Resim işlenirken hata oluştu', 'error');
      } finally {
        setLoading(false);
      }
    } else {
      showSnackbar('Lütfen geçerli bir resim dosyası seçin', 'error');
    }
  };

  // Snackbar göster
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Dialog kapat
  const handleClose = () => {
    setDialogOpen(false);
    setEditData(null);
    setFormData({
      ad: '',
      adres: '',
      santiyeSefi: '',
      projeMuduru: '',
      durum: 'aktif',
      baslangicTarihi: '',
      bitisTarihi: '',
      notlar: '',
      resimUrl: '',
      kod: ''
    });
  };

  // Düzenleme modunu aç
  const handleEdit = (santiye) => {
    setEditData(santiye);
    setFormData({
      ad: santiye.ad || '',
      adres: santiye.adres || '',
      santiyeSefi: santiye.santiyeSefi || '',
      projeMuduru: santiye.projeMuduru || '',
      durum: santiye.durum || 'aktif',
      baslangicTarihi: santiye.baslangicTarihi || '',
      bitisTarihi: santiye.bitisTarihi || '',
      notlar: santiye.notlar || '',
      resimUrl: santiye.resimUrl || '',
      kod: santiye.kod || ''
    });
    setDialogOpen(true);
  };

  // Şantiye sil
  const handleDelete = async (id) => {
    if (!window.confirm('Bu şantiyeyi silmek istediğinizden emin misiniz?')) return;
    
    try {
      await deleteDoc(doc(db, 'santiyeler', id));
      showSnackbar('Şantiye başarıyla silindi');
      fetchSantiyeler();
    } catch (error) {
      console.error('Şantiye silinirken hata:', error);
      showSnackbar('Şantiye silinirken hata oluştu', 'error');
    }
  };

  // Form gönder
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Form doğrulama
      if (!formData.ad || !formData.adres || !formData.santiyeSefi || !formData.projeMuduru) {
        showSnackbar('Lütfen zorunlu alanları doldurun', 'error');
        setLoading(false);
        return;
      }

      // Yeni şantiye için kod oluştur
      let yeniKod = editData ? editData.kod : await generateUniqueCode();
      if (!yeniKod) {
        showSnackbar('Kullanılabilir kod kalmadı!', 'error');
        setLoading(false);
        return;
      }

      // Şantiye verilerini hazırla
      const santiyeData = {
        ad: formData.ad.trim(),
        adres: formData.adres.trim(),
        santiyeSefi: formData.santiyeSefi.trim(),
        projeMuduru: formData.projeMuduru.trim(),
        durum: formData.durum,
        baslangicTarihi: formData.baslangicTarihi,
        bitisTarihi: formData.bitisTarihi,
        notlar: formData.notlar.trim(),
        resimUrl: formData.resimUrl || '',
        guncellemeTarihi: new Date().toISOString()
      };

      // Firestore'a kaydet
      if (editData) {
        await updateDoc(doc(db, 'santiyeler', editData.id), {
          ...santiyeData,
          kod: editData.kod
        });
        showSnackbar('Şantiye başarıyla güncellendi');
      } else {
        await addDoc(collection(db, 'santiyeler'), {
          ...santiyeData,
          kod: yeniKod,
          olusturmaTarihi: new Date().toISOString()
        });
        showSnackbar('Şantiye başarıyla eklendi');
      }

      // Temizlik ve yenileme
      setSelectedImage(null);
      handleClose();
      fetchSantiyeler();
    } catch (error) {
      console.error('İşlem hatası:', error);
      showSnackbar(error.message || 'İşlem sırasında hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Durum chip'i için renk seç
  const getDurumColor = (durum) => {
    switch (durum) {
      case 'aktif': return 'success';
      case 'tamamlandi': return 'info';
      case 'beklemede': return 'warning';
      case 'iptal': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon /> Şantiye Yönetimi
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setDialogOpen(true)}
          sx={{ bgcolor: isDarkMode ? 'primary.dark' : 'primary.main' }}
        >
          Yeni Şantiye Ekle
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Kod</TableCell>
                <TableCell>Ad</TableCell>
                <TableCell>Adres</TableCell>
                <TableCell>Şantiye Şefi</TableCell>
                <TableCell>Proje Müdürü</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {santiyeler.map((santiye) => (
                <TableRow key={santiye.id}>
                  <TableCell>{santiye.kod}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        src={santiye.resimUrl} 
                        alt={santiye.ad}
                        variant="rounded"
                        sx={{ width: 40, height: 40 }}
                      >
                        <BusinessIcon />
                      </Avatar>
                      {santiye.ad}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      {santiye.adres}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EngineeringIcon fontSize="small" color="action" />
                      {santiye.santiyeSefi}
                    </Box>
                  </TableCell>
                  <TableCell>{santiye.projeMuduru}</TableCell>
                  <TableCell>
                    <Chip 
                      label={santiye.durum || 'aktif'} 
                      size="small"
                      color={getDurumColor(santiye.durum)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(santiye)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(santiye.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editData ? 'Şantiye Düzenle' : 'Yeni Şantiye Ekle'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Şantiye Adı"
                  value={formData.ad}
                  onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                {editData ? (
                  <TextField
                    fullWidth
                    label="Şantiye Kodu"
                    value={formData.kod}
                    onChange={(e) => setFormData({ ...formData, kod: e.target.value.toUpperCase() })}
                    required
                    inputProps={{ maxLength: 1 }}
                  />
                ) : (
                  <TextField
                    fullWidth
                    label="Şantiye Kodu"
                    value="Otomatik oluşturulacak"
                    disabled
                  />
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Adres"
                  value={formData.adres}
                  onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
                  required
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Şantiye Şefi"
                  value={formData.santiyeSefi}
                  onChange={(e) => setFormData({ ...formData, santiyeSefi: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Proje Müdürü"
                  value={formData.projeMuduru}
                  onChange={(e) => setFormData({ ...formData, projeMuduru: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Durum</InputLabel>
                  <Select
                    value={formData.durum}
                    label="Durum"
                    onChange={(e) => setFormData({ ...formData, durum: e.target.value })}
                  >
                    <MenuItem value="aktif">Aktif</MenuItem>
                    <MenuItem value="tamamlandi">Tamamlandı</MenuItem>
                    <MenuItem value="beklemede">Beklemede</MenuItem>
                    <MenuItem value="iptal">İptal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Başlangıç Tarihi"
                  type="date"
                  value={formData.baslangicTarihi}
                  onChange={(e) => setFormData({ ...formData, baslangicTarihi: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bitiş Tarihi"
                  type="date"
                  value={formData.bitisTarihi}
                  onChange={(e) => setFormData({ ...formData, bitisTarihi: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notlar"
                  value={formData.notlar}
                  onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, my: 2 }}>
                  {formData.resimUrl && (
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={formData.resimUrl}
                        alt="Şantiye resmi"
                        variant="rounded"
                        sx={{ width: 200, height: 200 }}
                      />
                      {loading && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                          }}
                        >
                          <CircularProgress />
                        </Box>
                      )}
                    </Box>
                  )}
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AddPhotoAlternateIcon />}
                    disabled={loading}
                  >
                    Şantiye Resmi Seç (Max 5MB)
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editData ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Santiye;
