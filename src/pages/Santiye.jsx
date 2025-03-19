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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Avatar,
  Fab,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EngineeringIcon from '@mui/icons-material/Engineering';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import AddIcon from '@mui/icons-material/Add';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useTheme } from '../contexts/ThemeContext';
import SantiyeRow from '../components/santiye/SantiyeRow';
import SitePermissionModal from '../components/santiye/SitePermissionModal';
import { useSnackbar } from 'notistack';
import { usePermission } from '../contexts/PermissionContext';
import { PAGE_PERMISSIONS } from '../constants/permissions';
import { useAuth } from '../contexts/AuthContext';

const Santiye = () => {
  const { isDarkMode } = useTheme();
  const [santiyeler, setSantiyeler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const [selectedSantiye, setSelectedSantiye] = useState(null);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const { hasPermission } = usePermission();
  const { currentUser } = useAuth();
  
  console.log('Current user in Santiye:', currentUser);
  console.log('Has YÖNETİM role:', currentUser?.roles?.includes('YÖNETİM'));
  
  const canCreate = hasPermission(PAGE_PERMISSIONS.SANTIYE.CREATE);
  console.log('Can create permission:', canCreate);
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
      setError('Şantiyeler yüklenirken hata oluştu');
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
      if (file.size > 5 * 1024 * 1024) {
        enqueueSnackbar('Resim boyutu 5MB\'dan küçük olmalıdır', { variant: 'error' });
        return;
      }

      try {
        setLoading(true);
        const compressedBase64 = await compressImage(file);
        setFormData(prev => ({ ...prev, resimUrl: compressedBase64 }));
        setSelectedImage(file);
      } catch (error) {
        enqueueSnackbar('Resim işlenirken hata oluştu', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    } else {
      enqueueSnackbar('Lütfen geçerli bir resim dosyası seçin', { variant: 'error' });
    }
  };

  // Form gönder
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.ad || !formData.adres || !formData.santiyeSefi || !formData.projeMuduru) {
        enqueueSnackbar('Lütfen zorunlu alanları doldurun', { variant: 'error' });
        setLoading(false);
        return;
      }

      let yeniKod = editData ? editData.kod : await generateUniqueCode();
      if (!yeniKod) {
        enqueueSnackbar('Kullanılabilir kod kalmadı!', { variant: 'error' });
        setLoading(false);
        return;
      }

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

      if (editData) {
        await updateDoc(doc(db, 'santiyeler', editData.id), {
          ...santiyeData,
          kod: editData.kod
        });
        enqueueSnackbar('Şantiye başarıyla güncellendi', { variant: 'success' });
      } else {
        await addDoc(collection(db, 'santiyeler'), {
          ...santiyeData,
          kod: yeniKod,
          olusturmaTarihi: new Date().toISOString()
        });
        enqueueSnackbar('Şantiye başarıyla eklendi', { variant: 'success' });
      }

      setSelectedImage(null);
      setDialogOpen(false);
      fetchSantiyeler();
    } catch (error) {
      enqueueSnackbar('İşlem sırasında hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
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
      enqueueSnackbar('Şantiye başarıyla silindi', { variant: 'success' });
      fetchSantiyeler();
    } catch (error) {
      enqueueSnackbar('Şantiye silinirken hata oluştu', { variant: 'error' });
    }
  };

  // Yetki modalını aç
  const handlePermissionClick = (santiye) => {
    setSelectedSantiye(santiye);
    setPermissionModalOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Şantiye Yönetimi
      </Typography>

      {canCreate && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => {
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
            setDialogOpen(true);
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Kod</TableCell>
                <TableCell>Ad</TableCell>
                <TableCell>Adres</TableCell>
                <TableCell>Şantiye Şefi</TableCell>
                <TableCell>Proje Müdürü</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {santiyeler.map((santiye) => (
                <SantiyeRow
                  key={santiye.id}
                  santiye={santiye}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPermissionClick={handlePermissionClick}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <SitePermissionModal
        open={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
        siteId={selectedSantiye?.id}
        siteName={selectedSantiye?.ad}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, ad: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Adres"
                  value={formData.adres}
                  onChange={(e) => setFormData(prev => ({ ...prev, adres: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Şantiye Şefi"
                  value={formData.santiyeSefi}
                  onChange={(e) => setFormData(prev => ({ ...prev, santiyeSefi: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Proje Müdürü"
                  value={formData.projeMuduru}
                  onChange={(e) => setFormData(prev => ({ ...prev, projeMuduru: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Durum</InputLabel>
                  <Select
                    value={formData.durum}
                    onChange={(e) => setFormData(prev => ({ ...prev, durum: e.target.value }))}
                    label="Durum"
                  >
                    <MenuItem value="aktif">Aktif</MenuItem>
                    <MenuItem value="tamamlandı">Tamamlandı</MenuItem>
                    <MenuItem value="iptal">İptal</MenuItem>
                    <MenuItem value="beklemede">Beklemede</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {formData.resimUrl && (
                    <Avatar
                      src={formData.resimUrl}
                      alt="Şantiye resmi"
                      variant="rounded"
                      sx={{ width: 150, height: 150, mb: 1 }}
                    />
                  )}
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<AddPhotoAlternateIcon />}
                    fullWidth
                  >
                    Resim Seç
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleImageChange}
                    />
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notlar"
                  multiline
                  rows={4}
                  value={formData.notlar}
                  onChange={(e) => setFormData(prev => ({ ...prev, notlar: e.target.value }))}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editData ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Santiye;
