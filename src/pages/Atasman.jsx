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
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useSnackbar } from 'notistack';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';

const Atasman = () => {
  const { isDarkMode, sidebarColor } = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sozlesmeler, setSozlesmeler] = useState([]);
  const [selectedSozlesme, setSelectedSozlesme] = useState('');
  const [atasmanlar, setAtasmanlar] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAtasman, setSelectedAtasman] = useState(null);
  const [formData, setFormData] = useState({
    pozNo: '',
    tanim: '',
    birim: '',
    birimFiyat: '',
    miktar: '',
    aciklama: '',
    dosya: null
  });

  useEffect(() => {
    fetchSozlesmeler();
  }, []);

  useEffect(() => {
    if (selectedSozlesme) {
      fetchAtasmanlar(selectedSozlesme);
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

  const fetchAtasmanlar = async (sozlesmeId) => {
    try {
      setLoading(true);
      const atasmanRef = collection(db, 'sozlesmeler', sozlesmeId, 'atasmanlar');
      const q = query(
        atasmanRef,
        where('kullaniciId', '==', currentUser.uid),
        orderBy('olusturmaTarihi', 'desc')
      );
      const atasmanSnapshot = await getDocs(q);
      const atasmanData = atasmanSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAtasmanlar(atasmanData);
    } catch (error) {
      console.error('Ataşmanlar yüklenirken hata:', error);
      enqueueSnackbar('Ataşmanlar yüklenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpen = (atasman = null) => {
    setSelectedAtasman(atasman);
    if (atasman) {
      setFormData({
        pozNo: atasman.pozNo || '',
        tanim: atasman.tanim || '',
        birim: atasman.birim || '',
        birimFiyat: atasman.birimFiyat || '',
        miktar: atasman.miktar || '',
        aciklama: atasman.aciklama || '',
        dosya: null
      });
    } else {
      setFormData({
        pozNo: '',
        tanim: '',
        birim: '',
        birimFiyat: '',
        miktar: '',
        aciklama: '',
        dosya: null
      });
    }
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedAtasman(null);
    setFormData({
      pozNo: '',
      tanim: '',
      birim: '',
      birimFiyat: '',
      miktar: '',
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
      const atasmanData = {
        ...formData,
        birimFiyat: parseFloat(formData.birimFiyat) || 0,
        miktar: parseFloat(formData.miktar) || 0,
        tutar: (parseFloat(formData.birimFiyat) || 0) * (parseFloat(formData.miktar) || 0),
        durum: 'beklemede',
        olusturmaTarihi: new Date(),
        guncellemeTarihi: new Date(),
        kullaniciId: currentUser.uid,
        kullaniciEmail: currentUser.email
      };

      // Dosya yükleme işlemi
      if (formData.dosya) {
        const fileRef = ref(storage, `atasmanlar/${selectedSozlesme}/${formData.dosya.name}`);
        await uploadBytes(fileRef, formData.dosya);
        const downloadURL = await getDownloadURL(fileRef);
        atasmanData.dosyaURL = downloadURL;
        atasmanData.dosyaAdi = formData.dosya.name;
      }

      if (selectedAtasman) {
        // Güncelleme
        const atasmanRef = doc(db, 'sozlesmeler', selectedSozlesme, 'atasmanlar', selectedAtasman.id);
        await updateDoc(atasmanRef, atasmanData);
        enqueueSnackbar('Ataşman başarıyla güncellendi', { variant: 'success' });
      } else {
        // Yeni ekleme
        const atasmanRef = collection(db, 'sozlesmeler', selectedSozlesme, 'atasmanlar');
        await addDoc(atasmanRef, atasmanData);
        enqueueSnackbar('Ataşman başarıyla eklendi', { variant: 'success' });
      }

      handleDialogClose();
      fetchAtasmanlar(selectedSozlesme);
    } catch (error) {
      console.error('Ataşman kaydedilirken hata:', error);
      enqueueSnackbar('Ataşman kaydedilirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (atasmanId) => {
    if (!window.confirm('Bu ataşmanı silmek istediğinizden emin misiniz?')) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'sozlesmeler', selectedSozlesme, 'atasmanlar', atasmanId));
      enqueueSnackbar('Ataşman başarıyla silindi', { variant: 'success' });
      fetchAtasmanlar(selectedSozlesme);
    } catch (error) {
      console.error('Ataşman silinirken hata:', error);
      enqueueSnackbar('Ataşman silinirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (atasmanId, yeniDurum) => {
    try {
      setLoading(true);
      const atasmanRef = doc(db, 'sozlesmeler', selectedSozlesme, 'atasmanlar', atasmanId);
      await updateDoc(atasmanRef, {
        durum: yeniDurum,
        guncellemeTarihi: new Date()
      });
      enqueueSnackbar('Ataşman durumu güncellendi', { variant: 'success' });
      fetchAtasmanlar(selectedSozlesme);
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
      enqueueSnackbar('Durum güncellenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getDurumRenk = (durum) => {
    switch (durum) {
      case 'onaylandi':
        return 'success';
      case 'beklemede':
        return 'warning';
      case 'reddedildi':
        return 'error';
      default:
        return 'default';
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
        Ataşman Yönetimi
      </Typography>

      {/* Sözleşme Seçimi ve Yeni Ataşman Butonu */}
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
            Yeni Ataşman Ekle
          </Button>
        </Grid>
      </Grid>

      {/* Ataşman Listesi */}
      {selectedSozlesme && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Poz No</TableCell>
                <TableCell>İş Tanımı</TableCell>
                <TableCell>Birim</TableCell>
                <TableCell align="right">Birim Fiyat</TableCell>
                <TableCell align="right">Miktar</TableCell>
                <TableCell align="right">Tutar</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {atasmanlar.map((atasman) => (
                <TableRow key={atasman.id}>
                  <TableCell>{atasman.pozNo}</TableCell>
                  <TableCell>
                    <Tooltip title={atasman.aciklama || ''} arrow>
                      <Typography>{atasman.tanim}</Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{atasman.birim}</TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: 'TRY'
                    }).format(atasman.birimFiyat)}
                  </TableCell>
                  <TableCell align="right">{atasman.miktar}</TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: 'TRY'
                    }).format(atasman.tutar)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={atasman.durum}
                      color={getDurumRenk(atasman.durum)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleDialogOpen(atasman)}
                        disabled={atasman.durum === 'onaylandi'}
                      >
                        <EditIcon />
                      </IconButton>
                      {atasman.dosyaURL && (
                        <IconButton
                          size="small"
                          onClick={() => window.open(atasman.dosyaURL, '_blank')}
                        >
                          <DownloadIcon />
                        </IconButton>
                      )}
                      {atasman.durum === 'beklemede' && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleStatusChange(atasman.id, 'onaylandi')}
                          >
                            <CheckCircleIcon color="success" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleStatusChange(atasman.id, 'reddedildi')}
                          >
                            <CancelIcon color="error" />
                          </IconButton>
                        </>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(atasman.id)}
                        disabled={atasman.durum === 'onaylandi'}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {atasmanlar.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" sx={{ py: 2 }}>
                      Bu sözleşmeye ait ataşman bulunamadı
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Ataşman Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedAtasman ? 'Ataşman Düzenle' : 'Yeni Ataşman Ekle'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'grid', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Poz No"
                  name="pozNo"
                  value={formData.pozNo}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Birim"
                  name="birim"
                  value={formData.birim}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="İş Tanımı"
              name="tanim"
              value={formData.tanim}
              onChange={handleInputChange}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Birim Fiyat"
                  name="birimFiyat"
                  type="number"
                  value={formData.birimFiyat}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₺</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Miktar"
                  name="miktar"
                  type="number"
                  value={formData.miktar}
                  onChange={handleInputChange}
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
            {selectedAtasman ? 'Güncelle' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Atasman; 