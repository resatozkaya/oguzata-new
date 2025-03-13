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
  Chip,
  LinearProgress,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileUpload as FileUploadIcon,
  Download as DownloadIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useSnackbar } from 'notistack';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';

const Metraj = () => {
  const { isDarkMode, sidebarColor } = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sozlesmeler, setSozlesmeler] = useState([]);
  const [selectedSozlesme, setSelectedSozlesme] = useState('');
  const [metrajlar, setMetrajlar] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMetraj, setSelectedMetraj] = useState(null);
  const [isKalemleri, setIsKalemleri] = useState([]);
  const [selectedIsKalemi, setSelectedIsKalemi] = useState('');
  const [formData, setFormData] = useState({
    isKalemiId: '',
    pozNo: '',
    tanim: '',
    birim: '',
    miktar: '',
    blokAdi: '',
    kat: '',
    daireNo: '',
    mahalAdi: '',
    minha: false,
    minhaEn: '',
    minhaBoy: '',
    minhaAlan: 0,
    aciklama: '',
    olcumTarihi: '',
    dosya: null
  });

  useEffect(() => {
    fetchSozlesmeler();
  }, []);

  useEffect(() => {
    if (selectedSozlesme) {
      fetchMetrajlar(selectedSozlesme);
      fetchIsKalemleri(selectedSozlesme);
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

  const fetchMetrajlar = async (sozlesmeId) => {
    if (!sozlesmeId) {
      console.log('Sözleşme ID belirtilmedi');
      setMetrajlar([]);
      return;
    }

    try {
      setLoading(true);
      console.log('Metrajlar yükleniyor, Sözleşme ID:', sozlesmeId);
      const metrajRef = collection(db, 'sozlesmeler', sozlesmeId, 'metrajlar');
      const q = query(
        metrajRef,
        where('kullaniciId', '==', currentUser.uid),
        orderBy('olcumTarihi', 'desc')
      );
      const metrajSnapshot = await getDocs(q);
      const metrajData = metrajSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        olcumTarihi: doc.data().olcumTarihi?.toDate() || null
      }));
      console.log('Yüklenen metrajlar:', metrajData);
      setMetrajlar(metrajData);
    } catch (error) {
      console.error('Metrajlar yüklenirken hata:', error);
      enqueueSnackbar('Metrajlar yüklenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchIsKalemleri = async (sozlesmeId) => {
    try {
      console.log('Sözleşme ID:', sozlesmeId);
      // İş kalemlerini sozlesmeler/{sozlesmeId}/isKalemleri koleksiyonundan al
      const isKalemleriRef = collection(db, 'sozlesmeler', sozlesmeId, 'isKalemleri');
      const isKalemleriSnapshot = await getDocs(isKalemleriRef);
      
      if (!isKalemleriSnapshot.empty) {
        const isKalemleriData = isKalemleriSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('İş kalemleri yüklendi:', isKalemleriData);
        setIsKalemleri(isKalemleriData);
      } else {
        console.log('İş kalemi bulunamadı');
        setIsKalemleri([]);
      }
    } catch (error) {
      console.error('İş kalemleri yüklenirken hata:', error);
      enqueueSnackbar('İş kalemleri yüklenirken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleIsKalemiChange = (e) => {
    const secilenIsKalemi = isKalemleri.find(item => item.id === e.target.value);
    console.log('Seçilen iş kalemi (handleIsKalemiChange):', secilenIsKalemi);
    if (secilenIsKalemi) {
      setSelectedIsKalemi(secilenIsKalemi.id);
      setFormData(prev => ({
        ...prev,
        isKalemiId: secilenIsKalemi.id,
        pozNo: secilenIsKalemi.pozNo || '',
        tanim: secilenIsKalemi.tanim || '',
        birim: secilenIsKalemi.birim || ''
      }));
    }
  };

  const handleDialogOpen = (metraj) => {
    if (metraj) {
      console.log('Düzenlenecek metraj:', metraj);
      // olcumTarihi bir Timestamp veya Date objesi olabilir
      const tarih = metraj.olcumTarihi instanceof Date 
        ? metraj.olcumTarihi 
        : metraj.olcumTarihi?.toDate?.() || new Date();

      // İş kalemini bul
      const isKalemi = isKalemleri.find(item => item.id === metraj.isKalemiId);
      console.log('Bulunan iş kalemi:', isKalemi);

      setSelectedMetraj(metraj);
      setSelectedIsKalemi(metraj.isKalemiId);
      
      // Form verilerini doldur
      setFormData({
        isKalemiId: metraj.isKalemiId || '',
        pozNo: isKalemi?.pozNo || metraj.pozNo || '',
        tanim: isKalemi?.tanim || metraj.tanim || '',
        birim: isKalemi?.birim || metraj.birim || '',
        miktar: metraj.miktar || '',
        blokAdi: metraj.blokAdi || '',
        kat: metraj.kat || '',
        daireNo: metraj.daireNo || '',
        mahalAdi: metraj.mahalAdi || '',
        minha: metraj.minha || false,
        minhaEn: metraj.minhaEn || '',
        minhaBoy: metraj.minhaBoy || '',
        minhaAlan: metraj.minhaAlan || 0,
        aciklama: metraj.aciklama || '',
        olcumTarihi: tarih.toISOString().split('T')[0],
        dosya: null
      });
    } else {
      // Yeni metraj ekleme durumu
      setSelectedMetraj(null);
      setSelectedIsKalemi('');
      setFormData({
        isKalemiId: '',
        pozNo: '',
        tanim: '',
        birim: '',
        miktar: '',
        blokAdi: '',
        kat: '',
        daireNo: '',
        mahalAdi: '',
        minha: false,
        minhaEn: '',
        minhaBoy: '',
        minhaAlan: 0,
        aciklama: '',
        olcumTarihi: new Date().toISOString().split('T')[0],
        dosya: null
      });
    }
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedMetraj(null);
    setFormData({
      isKalemiId: '',
      pozNo: '',
      tanim: '',
      birim: '',
      miktar: '',
      blokAdi: '',
      kat: '',
      daireNo: '',
      mahalAdi: '',
      minha: false,
      minhaEn: '',
      minhaBoy: '',
      minhaAlan: 0,
      aciklama: '',
      olcumTarihi: '',
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

  const handleMinhaChange = (e) => {
    const isMinha = e.target.checked;
    setFormData(prev => ({
      ...prev,
      minha: isMinha,
      // Minha kapatıldığında en, boy ve alan değerlerini sıfırla
      minhaEn: isMinha ? prev.minhaEn : '',
      minhaBoy: isMinha ? prev.minhaBoy : '',
      minhaAlan: isMinha ? prev.minhaAlan : 0
    }));
  };

  const handleMinhaOlcuChange = (e) => {
    const { name, value } = e.target;
    const numValue = value === '' ? '' : parseFloat(value);
    
    setFormData(prev => {
      const newState = { ...prev, [name]: value };
      
      // En ve boy değerleri girildiğinde alanı otomatik hesapla
      if (name === 'minhaEn' || name === 'minhaBoy') {
        const en = name === 'minhaEn' ? numValue : (prev.minhaEn === '' ? 0 : parseFloat(prev.minhaEn));
        const boy = name === 'minhaBoy' ? numValue : (prev.minhaBoy === '' ? 0 : parseFloat(prev.minhaBoy));
        
        // Eğer her iki değer de girilmişse alanı hesapla
        if (en !== '' && boy !== '') {
          newState.minhaAlan = en * boy;
        } else {
          newState.minhaAlan = 0;
        }
      }
      
      return newState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // İş kalemi kontrolü
      const localIsKalemi = isKalemleri.find(item => item.id === formData.isKalemiId);
      if (!localIsKalemi) {
        console.error('İş kalemi bulunamadı:', formData.isKalemiId);
        throw new Error('İş kalemi bulunamadı');
      }

      // İş kalemini Firestore'dan kontrol et
      const isKalemiRef = doc(db, 'sozlesmeler', selectedSozlesme, 'isKalemleri', formData.isKalemiId);
      const isKalemiDoc = await getDoc(isKalemiRef);
      
      if (!isKalemiDoc.exists()) {
        console.error('İş kalemi Firestore\'da bulunamadı:', {
          sozlesmeId: selectedSozlesme,
          isKalemiId: formData.isKalemiId
        });
        throw new Error('İş kalemi bulunamadı');
      }

      // Metraj verilerini hazırla
      const metrajData = {
        ...formData,
        miktar: parseFloat(formData.miktar) || 0,
        minhaEn: formData.minha ? parseFloat(formData.minhaEn) || 0 : 0,
        minhaBoy: formData.minha ? parseFloat(formData.minhaBoy) || 0 : 0,
        minhaAlan: formData.minha ? parseFloat(formData.minhaAlan) || 0 : 0,
        olcumTarihi: new Date(formData.olcumTarihi),
        olusturmaTarihi: selectedMetraj ? selectedMetraj.olusturmaTarihi : new Date(),
        guncellemeTarihi: new Date(),
        kullaniciId: currentUser.uid,
        kullaniciEmail: currentUser.email
      };

      // Metraj kaydını oluştur/güncelle
      if (selectedMetraj) {
        const metrajRef = doc(db, 'sozlesmeler', selectedSozlesme, 'metrajlar', selectedMetraj.id);
        await updateDoc(metrajRef, metrajData);
      } else {
        const metrajRef = collection(db, 'sozlesmeler', selectedSozlesme, 'metrajlar');
        await addDoc(metrajRef, metrajData);
      }

      handleDialogClose();
      await fetchMetrajlar(selectedSozlesme);
      enqueueSnackbar('Metraj başarıyla kaydedildi', { variant: 'success' });
    } catch (error) {
      console.error('Metraj kaydedilirken hata:', error);
      enqueueSnackbar(error.message || 'Metraj kaydedilirken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleDelete = async (metrajId) => {
    if (!window.confirm('Bu metrajı silmek istediğinizden emin misiniz?')) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'sozlesmeler', selectedSozlesme, 'metrajlar', metrajId));
      enqueueSnackbar('Metraj başarıyla silindi', { variant: 'success' });
      fetchMetrajlar(selectedSozlesme);
    } catch (error) {
      console.error('Metraj silinirken hata:', error);
      enqueueSnackbar('Metraj silinirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleYesilDefterAktar = async () => {
    try {
      setLoading(true);
      const batch = writeBatch(db);

      // İş kalemlerini grupla ve topla
      const metrajGruplari = metrajlar.reduce((acc, metraj) => {
        if (!acc[metraj.isKalemiId]) {
          acc[metraj.isKalemiId] = 0;
        }
        acc[metraj.isKalemiId] += parseFloat(metraj.miktar) || 0;
        return acc;
      }, {});

      console.log('Metraj Grupları:', metrajGruplari);

      // Her iş kalemi için güncelleme yap
      for (const [isKalemiId, yeniMetraj] of Object.entries(metrajGruplari)) {
        const isKalemiRef = doc(db, 'sozlesmeler', selectedSozlesme, 'isKalemleri', isKalemiId);
        const isKalemiDoc = await getDoc(isKalemiRef);
        
        if (isKalemiDoc.exists()) {
          const isKalemiData = isKalemiDoc.data();
          
          // Mevcut değerleri al (undefined ise 0 kullan)
          const mevcutOncekiAylar = parseFloat(isKalemiData.oncekiAylarToplami) || 0;
          const mevcutGecenAy = parseFloat(isKalemiData.buAy) || 0; // Mevcut buAy değeri gecenAy olacak
          const yeniToplamYapilan = mevcutOncekiAylar + mevcutGecenAy + yeniMetraj;
          
          // Gerçekleşme oranını hesapla
          const toplamMiktar = parseFloat(isKalemiData.miktar) || 0;
          const yeniGerceklesmeOrani = toplamMiktar > 0 ? (yeniToplamYapilan / toplamMiktar) * 100 : 0;

          console.log('İş Kalemi Güncelleme:', {
            id: isKalemiId,
            pozNo: isKalemiData.pozNo,
            mevcutDegerler: {
              oncekiAylar: mevcutOncekiAylar,
              gecenAy: mevcutGecenAy,
              yeniMetraj: yeniMetraj
            },
            yeniDegerler: {
              yeniToplamYapilan,
              yeniGerceklesmeOrani
            }
          });

          // Batch update'e ekle
          batch.update(isKalemiRef, {
            oncekiAylarToplami: mevcutOncekiAylar + mevcutGecenAy, // Önceki aylar + geçen ay
            gecenAy: mevcutGecenAy, // Geçen ay değeri korunuyor
            buAy: yeniMetraj, // Yeni metrajlar bu aya yazılıyor
            toplamYapilan: yeniToplamYapilan,
            gerceklesmeOrani: Number(yeniGerceklesmeOrani.toFixed(2)),
            guncellemeTarihi: serverTimestamp(),
            guncelleyenKullanici: currentUser.uid
          });
        }
      }

      // Batch işlemini gerçekleştir
      await batch.commit();
      
      // İş kalemlerini yeniden yükle
      await fetchIsKalemleri(selectedSozlesme);
      
      enqueueSnackbar('İmalatlar yeşil deftere başarıyla aktarıldı', { variant: 'success' });
    } catch (error) {
      console.error('İmalatlar aktarılırken hata:', error);
      enqueueSnackbar('İmalatlar aktarılırken bir hata oluştu', { variant: 'error' });
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
      {/* Başlık ve Butonlar */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Metraj Yönetimi
          </Typography>
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          {selectedSozlesme && (
            <Button
              variant="contained"
              onClick={handleYesilDefterAktar}
              disabled={loading || metrajlar.length === 0}
              sx={{
                bgcolor: 'success.main',
                '&:hover': {
                  bgcolor: 'success.dark'
                }
              }}
            >
              Bu Ay Yapılan İmalatları Yeşil Deftere Aktar
            </Button>
          )}
        </Grid>
      </Grid>

      {/* Sözleşme Seçimi ve Yeni Metraj Butonu */}
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
            Yeni Metraj Ekle
          </Button>
        </Grid>
      </Grid>

      {/* İş Kalemleri Özeti */}
      {selectedSozlesme && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              İş Kalemleri Toplam Metrajları
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Poz No</TableCell>
                    <TableCell>İş Tanımı</TableCell>
                    <TableCell>Birim</TableCell>
                    <TableCell align="right">Toplam Metraj</TableCell>
                    <TableCell align="right">Sözleşme Miktarı</TableCell>
                    <TableCell align="right">Gerçekleşme Oranı</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isKalemleri.map((isKalemi) => {
                    // Her iş kalemi için toplam metrajı hesapla
                    const toplamMetraj = metrajlar
                      .filter(m => m.isKalemiId === isKalemi.id)
                      .reduce((total, metraj) => total + (parseFloat(metraj.miktar) || 0), 0);
                    
                    const gerceklesmeOrani = ((toplamMetraj / (isKalemi.miktar || 1)) * 100).toFixed(2);

                    return (
                      <TableRow key={isKalemi.id}>
                        <TableCell>{isKalemi.pozNo}</TableCell>
                        <TableCell>{isKalemi.tanim}</TableCell>
                        <TableCell>{isKalemi.birim}</TableCell>
                        <TableCell align="right">{toplamMetraj}</TableCell>
                        <TableCell align="right">{isKalemi.miktar}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <Typography sx={{ mr: 1 }}>
                              %{gerceklesmeOrani}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={parseFloat(gerceklesmeOrani)}
                              sx={{
                                width: 100,
                                height: 8,
                                borderRadius: 5,
                                bgcolor: alpha(sidebarColor, 0.1),
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: sidebarColor,
                                  borderRadius: 5
                                }
                              }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Metraj Listesi */}
      {selectedSozlesme && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Blok</TableCell>
                <TableCell>Kat</TableCell>
                <TableCell>Daire No</TableCell>
                <TableCell>Mahal</TableCell>
                <TableCell>İş Tanımı</TableCell>
                <TableCell>Birim</TableCell>
                <TableCell align="right">Miktar</TableCell>
                <TableCell>Minha</TableCell>
                <TableCell>Ölçüm Tarihi</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metrajlar.map((metraj) => (
                <TableRow key={metraj.id}>
                  <TableCell>{metraj.blokAdi || '-'}</TableCell>
                  <TableCell>{metraj.kat || '-'}</TableCell>
                  <TableCell>{metraj.daireNo || '-'}</TableCell>
                  <TableCell>{metraj.mahalAdi || '-'}</TableCell>
                  <TableCell>
                    <Tooltip title={metraj.aciklama || ''} arrow>
                      <Typography>{metraj.tanim}</Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{metraj.birim}</TableCell>
                  <TableCell align="right">{metraj.miktar}</TableCell>
                  <TableCell>
                    {metraj.minha ? (
                      <Tooltip title={`En: ${metraj.minhaEn}m, Boy: ${metraj.minhaBoy}m, Alan: ${metraj.minhaAlan}m²`} arrow>
                        <Chip
                          label={`Minha (${metraj.minhaAlan}m²)`}
                          color="error"
                          size="small"
                        />
                      </Tooltip>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {metraj.olcumTarihi instanceof Date 
                      ? metraj.olcumTarihi.toLocaleDateString('tr-TR')
                      : metraj.olcumTarihi?.toDate?.()?.toLocaleDateString('tr-TR') || '-'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleDialogOpen(metraj)}
                      >
                        <EditIcon />
                      </IconButton>
                      {metraj.dosyaURL && (
                        <IconButton
                          size="small"
                          onClick={() => window.open(metraj.dosyaURL, '_blank')}
                        >
                          <DownloadIcon />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(metraj.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {metrajlar.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography variant="body2" sx={{ py: 2 }}>
                      Bu sözleşmeye ait metraj bulunamadı
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Metraj Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedMetraj ? 'Metraj Düzenle' : 'Yeni Metraj Ekle'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'grid', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>İş Kalemi</InputLabel>
              <Select
                value={selectedIsKalemi}
                onChange={handleIsKalemiChange}
                label="İş Kalemi"
              >
                <MenuItem value="">
                  <em>Seçiniz</em>
                </MenuItem>
                {isKalemleri.map((isKalemi) => (
                  <MenuItem key={isKalemi.id} value={isKalemi.id}>
                    {isKalemi.pozNo} - {isKalemi.tanim} ({isKalemi.birim})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Blok Adı"
                  name="blokAdi"
                  value={formData.blokAdi}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Kat"
                  name="kat"
                  value={formData.kat}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Daire No"
                  name="daireNo"
                  value={formData.daireNo}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Mahal Adı"
                  name="mahalAdi"
                  value={formData.mahalAdi}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Poz No"
                  value={formData.pozNo}
                  disabled
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Birim"
                  value={formData.birim}
                  disabled
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
            </Grid>

            <TextField
              fullWidth
              label="İş Tanımı"
              value={formData.tanim}
              disabled
              multiline
              rows={2}
            />

            <FormControl fullWidth>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.minha}
                    onChange={handleMinhaChange}
                    name="minha"
                  />
                }
                label="Minha (Eksiltme)"
              />
            </FormControl>

            {formData.minha && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Minha En (m)"
                    name="minhaEn"
                    type="number"
                    value={formData.minhaEn}
                    onChange={handleMinhaOlcuChange}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">m</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Minha Boy (m)"
                    name="minhaBoy"
                    type="number"
                    value={formData.minhaBoy}
                    onChange={handleMinhaOlcuChange}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">m</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Minha Alanı"
                    value={formData.minhaAlan === 0 ? '0.00' : formData.minhaAlan.toFixed(2)}
                    disabled
                    InputProps={{
                      endAdornment: <InputAdornment position="end">m²</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            )}

            <TextField
              fullWidth
              label="Ölçüm Tarihi"
              name="olcumTarihi"
              type="date"
              value={formData.olcumTarihi}
              onChange={handleInputChange}
              InputLabelProps={{
                shrink: true,
              }}
            />

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
            {selectedMetraj ? 'Güncelle' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Metraj; 