import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileUpload as FileUploadIcon,
  Download as DownloadIcon,
  Percent as PercentIcon,
  Money as MoneyIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useSnackbar } from 'notistack';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';

const Kesinti = () => {
  const { isDarkMode, sidebarColor } = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sozlesmeler, setSozlesmeler] = useState([]);
  const [selectedSozlesme, setSelectedSozlesme] = useState('');
  const [kesintiler, setKesintiler] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedKesinti, setSelectedKesinti] = useState(null);
  const [formData, setFormData] = useState({
    ad: '',
    tur: '',
    oran: '',
    tutar: '',
    aciklama: '',
    dosya: null
  });

  useEffect(() => {
    fetchSozlesmeler();
  }, []);

  useEffect(() => {
    if (selectedSozlesme) {
      fetchKesintiler(selectedSozlesme);
    }
  }, [selectedSozlesme]);

  const fetchSozlesmeler = async () => {
    try {
      const sozlesmeRef = collection(db, 'sozlesmeler');
      const q = query(
        sozlesmeRef,
        where('kullaniciId', '==', currentUser.uid),
        where('durum', '==', 'aktif')
      );
      const sozlesmeSnapshot = await getDocs(q);
      const sozlesmeData = sozlesmeSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        baslangicTarihi: doc.data().baslangicTarihi?.toDate?.() || null,
        bitisTarihi: doc.data().bitisTarihi?.toDate?.() || null
      }));
      setSozlesmeler(sozlesmeData);
    } catch (error) {
      console.error('Sözleşmeler yüklenirken hata:', error);
      enqueueSnackbar('Sözleşmeler yüklenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchKesintiler = async (sozlesmeId) => {
    try {
      setLoading(true);
      const kesintiRef = collection(db, 'sozlesmeler', sozlesmeId, 'kesintiler');
      const q = query(
        kesintiRef,
        where('kullaniciId', '==', currentUser.uid),
        orderBy('olusturmaTarihi', 'desc')
      );
      const kesintiSnapshot = await getDocs(q);
      const kesintiData = kesintiSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setKesintiler(kesintiData);
    } catch (error) {
      console.error('Kesintiler yüklenirken hata:', error);
      enqueueSnackbar('Kesintiler yüklenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpen = (kesinti = null) => {
    setSelectedKesinti(kesinti);
    if (kesinti) {
      setFormData({
        ad: kesinti.ad || '',
        tur: kesinti.tur || '',
        oran: kesinti.oran || '',
        tutar: kesinti.tutar || '',
        aciklama: kesinti.aciklama || '',
        dosya: null
      });
    } else {
      setFormData({
        ad: '',
        tur: '',
        oran: '',
        tutar: '',
        aciklama: '',
        dosya: null
      });
    }
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedKesinti(null);
    setFormData({
      ad: '',
      tur: '',
      oran: '',
      tutar: '',
      aciklama: '',
      dosya: null
    });
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'dosya' && files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!selectedSozlesme) return;

    try {
      setLoading(true);
      const kesintiData = {
        ...formData,
        oran: parseFloat(formData.oran) || 0,
        tutar: parseFloat(formData.tutar) || 0,
        olusturmaTarihi: new Date(),
        guncellemeTarihi: new Date(),
        kullaniciId: currentUser.uid,
        kullaniciEmail: currentUser.email
      };

      // Dosya yükleme işlemi
      if (formData.dosya) {
        const fileRef = ref(storage, `kesintiler/${selectedSozlesme}/${formData.dosya.name}`);
        await uploadBytes(fileRef, formData.dosya);
        const downloadURL = await getDownloadURL(fileRef);
        kesintiData.dosyaURL = downloadURL;
        kesintiData.dosyaAdi = formData.dosya.name;
      }

      if (selectedKesinti) {
        // Güncelleme
        const kesintiRef = doc(db, 'sozlesmeler', selectedSozlesme, 'kesintiler', selectedKesinti.id);
        await updateDoc(kesintiRef, kesintiData);
        enqueueSnackbar('Kesinti başarıyla güncellendi', { variant: 'success' });
      } else {
        // Yeni ekleme
        const kesintiRef = collection(db, 'sozlesmeler', selectedSozlesme, 'kesintiler');
        await addDoc(kesintiRef, kesintiData);
        enqueueSnackbar('Kesinti başarıyla eklendi', { variant: 'success' });
      }

      handleDialogClose();
      fetchKesintiler(selectedSozlesme);
    } catch (error) {
      console.error('Kesinti kaydedilirken hata:', error);
      enqueueSnackbar('Kesinti kaydedilirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (kesintiId) => {
    if (!window.confirm('Bu kesintiyi silmek istediğinizden emin misiniz?')) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'sozlesmeler', selectedSozlesme, 'kesintiler', kesintiId));
      enqueueSnackbar('Kesinti başarıyla silindi', { variant: 'success' });
      fetchKesintiler(selectedSozlesme);
    } catch (error) {
      console.error('Kesinti silinirken hata:', error);
      enqueueSnackbar('Kesinti silinirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Başlık */}
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Kesinti Yönetimi
      </Typography>

      {/* Sözleşme Seçimi ve Yeni Kesinti Butonu */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Sözleşme Seçin</InputLabel>
            <Select
              value={selectedSozlesme}
              onChange={(e) => setSelectedSozlesme(e.target.value)}
              label="Sözleşme Seçin"
            >
              <MenuItem value="">
                <em>Seçiniz</em>
              </MenuItem>
              {sozlesmeler.map((sozlesme) => (
                <MenuItem key={sozlesme.id} value={sozlesme.id}>
                  {sozlesme.sozlesmeNo} - {sozlesme.taseron?.unvan} ({sozlesme.santiye?.ad})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleDialogOpen()}
            disabled={!selectedSozlesme}
            sx={{
              bgcolor: sidebarColor,
              '&:hover': {
                bgcolor: alpha(sidebarColor, 0.9)
              }
            }}
          >
            Yeni Kesinti Ekle
          </Button>
        </Grid>
      </Grid>

      {/* Kesinti Listesi */}
      {selectedSozlesme && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Kesinti Adı</TableCell>
                <TableCell>Tür</TableCell>
                <TableCell align="right">Oran (%)</TableCell>
                <TableCell align="right">Tutar</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {kesintiler.map((kesinti) => (
                <TableRow key={kesinti.id}>
                  <TableCell>
                    <Tooltip title={kesinti.aciklama || ''} arrow>
                      <Typography>{kesinti.ad}</Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{kesinti.tur}</TableCell>
                  <TableCell align="right">{kesinti.oran}%</TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: 'TRY'
                    }).format(kesinti.tutar)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleDialogOpen(kesinti)}
                      >
                        <EditIcon />
                      </IconButton>
                      {kesinti.dosyaURL && (
                        <IconButton
                          size="small"
                          onClick={() => window.open(kesinti.dosyaURL, '_blank')}
                        >
                          <DownloadIcon />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(kesinti.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {kesintiler.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" sx={{ py: 2 }}>
                      Bu sözleşmeye ait kesinti bulunamadı
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Kesinti Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedKesinti ? 'Kesinti Düzenle' : 'Yeni Kesinti Ekle'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'grid', gap: 2 }}>
            <TextField
              fullWidth
              label="Kesinti Adı"
              name="ad"
              value={formData.ad}
              onChange={handleInputChange}
            />
            <FormControl fullWidth>
              <InputLabel>Kesinti Türü</InputLabel>
              <Select
                name="tur"
                value={formData.tur}
                onChange={handleInputChange}
                label="Kesinti Türü"
              >
                <MenuItem value="teminat">Teminat</MenuItem>
                <MenuItem value="stopaj">Stopaj</MenuItem>
                <MenuItem value="ceza">Ceza</MenuItem>
                <MenuItem value="avans">Avans Kesintisi</MenuItem>
                <MenuItem value="diger">Diğer</MenuItem>
              </Select>
            </FormControl>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Kesinti Oranı"
                  name="oran"
                  type="number"
                  value={formData.oran}
                  onChange={handleInputChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Kesinti Tutarı"
                  name="tutar"
                  type="number"
                  value={formData.tutar}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₺</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Açıklama"
              name="aciklama"
              value={formData.aciklama}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
            <Button
              component="label"
              variant="outlined"
              startIcon={<FileUploadIcon />}
              sx={{ mt: 1 }}
            >
              Dosya Seç
              <input
                type="file"
                hidden
                name="dosya"
                onChange={handleInputChange}
              />
            </Button>
            {formData.dosya && (
              <Typography variant="body2" color="textSecondary">
                Seçilen dosya: {formData.dosya.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              bgcolor: sidebarColor,
              '&:hover': {
                bgcolor: alpha(sidebarColor, 0.9)
              }
            }}
          >
            {selectedKesinti ? 'Güncelle' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Kesinti; 