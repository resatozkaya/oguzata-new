import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import SozlesmeSecici from '../components/SozlesmeSecici';

const Kesintiler = () => {
  const { isDarkMode, sidebarColor } = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedSozlesme, setSelectedSozlesme] = useState('');
  const [kesintiler, setKesintiler] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedKesinti, setSelectedKesinti] = useState(null);
  const [formData, setFormData] = useState({
    kesintiTuru: '',
    tanim: '',
    tutar: '',
    durum: 'BEKLEMEDE',
    aciklama: ''
  });

  useEffect(() => {
    if (selectedSozlesme) {
      fetchKesintiler(selectedSozlesme);
    }
  }, [selectedSozlesme]);

  const fetchKesintiler = async (sozlesmeId) => {
    try {
      setLoading(true);
      const kesintiRef = collection(db, 'sozlesmeler', sozlesmeId, 'kesintiler');
      const kesintiSnapshot = await getDocs(kesintiRef);
      
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
    if (kesinti) {
      setSelectedKesinti(kesinti);
      setFormData({
        kesintiTuru: kesinti.kesintiTuru || '',
        tanim: kesinti.tanim || '',
        tutar: kesinti.tutar || '',
        durum: kesinti.durum || 'BEKLEMEDE',
        aciklama: kesinti.aciklama || ''
      });
    } else {
      setSelectedKesinti(null);
      setFormData({
        kesintiTuru: '',
        tanim: '',
        tutar: '',
        durum: 'BEKLEMEDE',
        aciklama: ''
      });
    }
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedKesinti(null);
    setFormData({
      kesintiTuru: '',
      tanim: '',
      tutar: '',
      durum: 'BEKLEMEDE',
      aciklama: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSozlesme) {
      enqueueSnackbar('Lütfen bir sözleşme seçin', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      const kesintiData = {
        ...formData,
        tutar: parseFloat(formData.tutar) || 0,
        olusturmaTarihi: selectedKesinti ? selectedKesinti.olusturmaTarihi : serverTimestamp(),
        guncellemeTarihi: serverTimestamp(),
        kullaniciId: currentUser.uid,
        kullaniciEmail: currentUser.email
      };

      if (selectedKesinti) {
        await updateDoc(
          doc(db, 'sozlesmeler', selectedSozlesme, 'kesintiler', selectedKesinti.id),
          kesintiData
        );
        enqueueSnackbar('Kesinti başarıyla güncellendi', { variant: 'success' });
      } else {
        await addDoc(
          collection(db, 'sozlesmeler', selectedSozlesme, 'kesintiler'),
          kesintiData
        );
        enqueueSnackbar('Kesinti başarıyla eklendi', { variant: 'success' });
      }

      handleDialogClose();
      await fetchKesintiler(selectedSozlesme);
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
      await fetchKesintiler(selectedSozlesme);
    } catch (error) {
      console.error('Kesinti silinirken hata:', error);
      enqueueSnackbar('Kesinti silinirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getDurumRenk = (durum) => {
    switch (durum) {
      case 'ONAYLANDI':
        return 'success';
      case 'REDDEDILDI':
        return 'error';
      case 'BEKLEMEDE':
      default:
        return 'warning';
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
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
          <SozlesmeSecici
            value={selectedSozlesme}
            onChange={(e) => setSelectedSozlesme(e.target.value)}
          />
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
                <TableCell>Kesinti Türü</TableCell>
                <TableCell>Tanım</TableCell>
                <TableCell align="right">Tutar</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {kesintiler.map((kesinti) => (
                <TableRow key={kesinti.id}>
                  <TableCell>{kesinti.kesintiTuru}</TableCell>
                  <TableCell>
                    <Typography>{kesinti.tanim}</Typography>
                    {kesinti.aciklama && (
                      <Typography variant="caption" color="text.secondary">
                        {kesinti.aciklama}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">{formatMoney(kesinti.tutar)}</TableCell>
                  <TableCell>
                    <Chip
                      label={kesinti.durum}
                      color={getDurumRenk(kesinti.durum)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleDialogOpen(kesinti)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(kesinti.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
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
            <FormControl fullWidth>
              <InputLabel>Kesinti Türü</InputLabel>
              <Select
                name="kesintiTuru"
                value={formData.kesintiTuru}
                onChange={handleInputChange}
                label="Kesinti Türü"
              >
                <MenuItem value="STOPAJ">Stopaj</MenuItem>
                <MenuItem value="TEMINAT">Teminat</MenuItem>
                <MenuItem value="CEZA">Ceza</MenuItem>
                <MenuItem value="DIGER">Diğer</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Tanım"
              name="tanim"
              value={formData.tanim}
              onChange={handleInputChange}
              multiline
              rows={2}
            />

            <TextField
              fullWidth
              label="Tutar"
              name="tutar"
              type="number"
              value={formData.tutar}
              onChange={handleInputChange}
            />

            <FormControl fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select
                name="durum"
                value={formData.durum}
                onChange={handleInputChange}
                label="Durum"
              >
                <MenuItem value="BEKLEMEDE">Beklemede</MenuItem>
                <MenuItem value="ONAYLANDI">Onaylandı</MenuItem>
                <MenuItem value="REDDEDILDI">Reddedildi</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Açıklama"
              name="aciklama"
              value={formData.aciklama}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
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
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Kesintiler; 