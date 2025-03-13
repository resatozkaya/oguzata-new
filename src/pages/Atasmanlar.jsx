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

const Atasmanlar = () => {
  const { isDarkMode, sidebarColor } = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
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
    tutar: 0,
    durum: 'BEKLEMEDE',
    aciklama: ''
  });

  useEffect(() => {
    if (selectedSozlesme) {
      fetchAtasmanlar(selectedSozlesme);
    }
  }, [selectedSozlesme]);

  const fetchAtasmanlar = async (sozlesmeId) => {
    try {
      setLoading(true);
      const atasmanRef = collection(db, 'sozlesmeler', sozlesmeId, 'atasmanlar');
      const atasmanSnapshot = await getDocs(atasmanRef);
      
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
    if (atasman) {
      setSelectedAtasman(atasman);
      setFormData({
        pozNo: atasman.pozNo || '',
        tanim: atasman.tanim || '',
        birim: atasman.birim || '',
        birimFiyat: atasman.birimFiyat || '',
        miktar: atasman.miktar || '',
        tutar: atasman.tutar || 0,
        durum: atasman.durum || 'BEKLEMEDE',
        aciklama: atasman.aciklama || ''
      });
    } else {
      setSelectedAtasman(null);
      setFormData({
        pozNo: '',
        tanim: '',
        birim: '',
        birimFiyat: '',
        miktar: '',
        tutar: 0,
        durum: 'BEKLEMEDE',
        aciklama: ''
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
      tutar: 0,
      durum: 'BEKLEMEDE',
      aciklama: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Birim fiyat veya miktar değiştiğinde tutarı otomatik hesapla
      if (name === 'birimFiyat' || name === 'miktar') {
        const birimFiyat = parseFloat(name === 'birimFiyat' ? value : newData.birimFiyat) || 0;
        const miktar = parseFloat(name === 'miktar' ? value : newData.miktar) || 0;
        newData.tutar = birimFiyat * miktar;
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSozlesme) {
      enqueueSnackbar('Lütfen bir sözleşme seçin', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      const atasmanData = {
        ...formData,
        birimFiyat: parseFloat(formData.birimFiyat) || 0,
        miktar: parseFloat(formData.miktar) || 0,
        tutar: parseFloat(formData.tutar) || 0,
        olusturmaTarihi: selectedAtasman ? selectedAtasman.olusturmaTarihi : serverTimestamp(),
        guncellemeTarihi: serverTimestamp(),
        kullaniciId: currentUser.uid,
        kullaniciEmail: currentUser.email
      };

      if (selectedAtasman) {
        await updateDoc(
          doc(db, 'sozlesmeler', selectedSozlesme, 'atasmanlar', selectedAtasman.id),
          atasmanData
        );
        enqueueSnackbar('Ataşman başarıyla güncellendi', { variant: 'success' });
      } else {
        await addDoc(
          collection(db, 'sozlesmeler', selectedSozlesme, 'atasmanlar'),
          atasmanData
        );
        enqueueSnackbar('Ataşman başarıyla eklendi', { variant: 'success' });
      }

      handleDialogClose();
      await fetchAtasmanlar(selectedSozlesme);
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
      await fetchAtasmanlar(selectedSozlesme);
    } catch (error) {
      console.error('Ataşman silinirken hata:', error);
      enqueueSnackbar('Ataşman silinirken bir hata oluştu', { variant: 'error' });
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

  const handleSozlesmeChange = (e) => {
    console.log('Sözleşme değişti:', e.target.value);
    setSelectedSozlesme(e.target.value);
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
          <SozlesmeSecici
            value={selectedSozlesme}
            onChange={handleSozlesmeChange}
            label="Sözleşme Seçin"
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
                    <Typography>{atasman.tanim}</Typography>
                  </TableCell>
                  <TableCell>{atasman.birim}</TableCell>
                  <TableCell align="right">{formatMoney(atasman.birimFiyat)}</TableCell>
                  <TableCell align="right">{atasman.miktar}</TableCell>
                  <TableCell align="right">{formatMoney(atasman.tutar)}</TableCell>
                  <TableCell>
                    <Chip
                      label={atasman.durum}
                      color={getDurumRenk(atasman.durum)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleDialogOpen(atasman)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(atasman.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
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
              multiline
              rows={2}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Birim Fiyat"
                  name="birimFiyat"
                  type="number"
                  value={formData.birimFiyat}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Miktar"
                  name="miktar"
                  type="number"
                  value={formData.miktar}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Tutar"
                  value={formatMoney(formData.tutar)}
                  disabled
                />
              </Grid>
            </Grid>

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

export default Atasmanlar; 