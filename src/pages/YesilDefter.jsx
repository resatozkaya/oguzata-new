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
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { collection, getDocs, doc, getDoc, updateDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { alpha } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import { formatMoney } from '../utils/format';
import SozlesmeSecici from '../components/SozlesmeSecici';

const YesilDefter = () => {
  const { isDarkMode, sidebarColor } = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sozlesmeler, setSozlesmeler] = useState([]);
  const [selectedSozlesme, setSelectedSozlesme] = useState('');
  const [isKalemleri, setIsKalemleri] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [toplamSozlesmeBedeli, setToplamSozlesmeBedeli] = useState(0);
  const [toplamGerceklesme, setToplamGerceklesme] = useState(0);
  const [openMetrajDialog, setOpenMetrajDialog] = useState(false);
  const [selectedIsKalemi, setSelectedIsKalemi] = useState(null);
  const [yeniMetraj, setYeniMetraj] = useState({
    oncekiAylarToplami: '',
    gecenAy: '',
    buAy: '',
    yuzde: ''
  });
  const [metrajlar, setMetrajlar] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSozlesmeler();
  }, []);

  useEffect(() => {
    if (selectedSozlesme) {
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

  const fetchIsKalemleri = async (sozlesmeId) => {
    if (!sozlesmeId) return;

    try {
      setLoading(true);
      const isKalemleriRef = collection(db, 'sozlesmeler', sozlesmeId, 'isKalemleri');
      const isKalemleriSnapshot = await getDocs(isKalemleriRef);
      
      if (!isKalemleriSnapshot.empty) {
        const isKalemleriData = isKalemleriSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setIsKalemleri(isKalemleriData);

        // Toplam sözleşme bedelini ve gerçekleşmeyi hesapla
        let toplamBedel = 0;
        let toplamGerceklesen = 0;

        isKalemleriData.forEach(isKalemi => {
          const birimFiyat = Number(isKalemi.birimFiyat) || 0;
          const miktar = Number(isKalemi.miktar) || 0;
          const toplamYapilan = (Number(isKalemi.oncekiAylarToplami) || 0) +
                              (Number(isKalemi.gecenAy) || 0) +
                              (Number(isKalemi.buAy) || 0);

          toplamBedel += birimFiyat * miktar;
          toplamGerceklesen += birimFiyat * toplamYapilan;
        });

        setToplamSozlesmeBedeli(toplamBedel);
        setToplamGerceklesme(toplamGerceklesen);
      } else {
        setIsKalemleri([]);
        setToplamSozlesmeBedeli(0);
        setToplamGerceklesme(0);
      }
    } catch (error) {
      console.error('İş kalemleri yüklenirken hata:', error);
      enqueueSnackbar('İş kalemleri yüklenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Sözleşme türü kontrolü için yardımcı fonksiyon
  const isGotureBedel = (sozlesme) => {
    return sozlesme?.sozlesmeTuru === 'goture_bedel';
  };

  const handleMetrajDialogOpen = (isKalemi) => {
    setSelectedIsKalemi(isKalemi);
    setYeniMetraj({
      oncekiAylarToplami: isKalemi.oncekiAylarToplami || '',
      gecenAy: isKalemi.gecenAy || '',
      buAy: isKalemi.buAy || ''
    });
    setOpenMetrajDialog(true);
  };

  const handleMetrajDialogClose = () => {
    setOpenMetrajDialog(false);
    setSelectedIsKalemi(null);
    setYeniMetraj({
      oncekiAylarToplami: '',
      gecenAy: '',
      buAy: '',
      yuzde: ''
    });
  };

  const handleMetrajKaydet = async () => {
    if (!selectedSozlesme || !selectedIsKalemi || !currentUser?.uid) {
      enqueueSnackbar('Gerekli bilgiler eksik', { variant: 'error' });
      return;
    }

    setLoading(true);

    try {
      const isKalemiRef = doc(db, 'sozlesmeler', selectedSozlesme, 'isKalemleri', selectedIsKalemi.id);
      const isKalemiDoc = await getDoc(isKalemiRef);

      if (!isKalemiDoc.exists()) {
        throw new Error('İş kalemi bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.');
      }

      const isKalemiData = isKalemiDoc.data();
      const oncekiAylarToplami = Number(yeniMetraj.oncekiAylarToplami) || 0;
      const gecenAy = Number(yeniMetraj.gecenAy) || 0;
      const buAy = Number(yeniMetraj.buAy) || 0;
      
      if (isNaN(oncekiAylarToplami) || isNaN(gecenAy) || isNaN(buAy)) {
        enqueueSnackbar('Geçerli sayısal değerler giriniz', { variant: 'error' });
        return;
      }

      const toplamYapilan = oncekiAylarToplami + gecenAy + buAy;
      const miktar = Number(isKalemiData.miktar) || 0;

      if (miktar === 0) {
        enqueueSnackbar('İş kalemi miktarı 0 olamaz', { variant: 'error' });
        return;
      }

      if (toplamYapilan > miktar) {
        enqueueSnackbar('Toplam yapılan miktar, sözleşme miktarını aşamaz', { variant: 'error' });
        return;
      }

      const gerceklesmeOrani = (toplamYapilan / miktar) * 100;

      const updateData = {
        oncekiAylarToplami,
        gecenAy,
        buAy,
        toplamYapilan,
        gerceklesmeOrani: Number(gerceklesmeOrani.toFixed(2)),
        guncellemeTarihi: serverTimestamp(),
        guncelleyenKullanici: currentUser.uid
      };

      await updateDoc(isKalemiRef, updateData);
      await fetchIsKalemleri(selectedSozlesme);
      enqueueSnackbar('İmalat miktarları başarıyla güncellendi', { variant: 'success' });
      handleMetrajDialogClose();
    } catch (error) {
      console.error('Metraj kaydedilirken hata:', error);
      enqueueSnackbar('Metraj kaydedilirken hata oluştu: ' + error.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSozlesmeChange = async (event) => {
    const sozlesmeId = event.target.value;
    setSelectedSozlesme(sozlesmeId);
    setIsKalemleri([]);
    
    if (!sozlesmeId) return;

    setLoading(true);
    setError('');
    
    try {
      // Önce sözleşme detaylarını al
      const sozlesmeRef = doc(db, 'sozlesmeler', sozlesmeId);
      const sozlesmeDoc = await getDoc(sozlesmeRef);
      
      if (!sozlesmeDoc.exists()) {
        throw new Error('Sözleşme bulunamadı');
      }

      // İş kalemlerini al
      const isKalemleriRef = collection(db, 'sozlesmeler', sozlesmeId, 'isKalemleri');
      const isKalemleriSnapshot = await getDocs(isKalemleriRef);
      
      const isKalemleriData = isKalemleriSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          oncekiAylarToplami: Number(data.oncekiAylarToplami || 0),
          gecenAy: Number(data.gecenAy || 0),
          buAy: Number(data.buAy || 0),
          toplamYapilan: Number(data.toplamYapilan || 0),
          birimFiyat: Number(data.birimFiyat || 0),
          miktar: Number(data.miktar || 0),
          gerceklesmeOrani: Number(data.gerceklesmeOrani || 0)
        };
      });
      
      console.log('Yüklenen iş kalemleri:', isKalemleriData);
      setIsKalemleri(isKalemleriData);

      // Toplam sözleşme bedelini ve gerçekleşen imalatı hesapla
      const toplamBedel = isKalemleriData.reduce((total, item) => {
        return total + (Number(item.birimFiyat) * Number(item.miktar));
      }, 0);
      setToplamSozlesmeBedeli(toplamBedel);

      const toplamGerceklesen = isKalemleriData.reduce((total, item) => {
        const yapilan = Number(item.toplamYapilan) || 0;
        return total + (Number(item.birimFiyat) * yapilan);
      }, 0);
      setToplamGerceklesme(toplamGerceklesen);

    } catch (err) {
      console.error('İş kalemleri yüklenirken hata:', err);
      setError('İş kalemleri yüklenirken hata oluştu: ' + err.message);
      setIsKalemleri([]);
    } finally {
      setLoading(false);
    }
  };

  // Seçili sözleşmeyi bul
  const selectedSozlesmeData = sozlesmeler.find(s => s.id === selectedSozlesme);

  // Toplam sözleşme bedelini hesapla
  const sozlesmeBedeli = isKalemleri.reduce((toplam, isKalemi) => {
    const miktar = Number(isKalemi.miktar) || 0;
    const birimFiyat = Number(isKalemi.birimFiyat) || 0;
    return toplam + (miktar * birimFiyat);
  }, 0);

  // Toplam gerçekleşen imalatı hesapla
  const gerceklesenImalat = isKalemleri.reduce((toplam, isKalemi) => {
    const yapilan = Number(isKalemi.toplamYapilan) || 0;
    const birimFiyat = Number(isKalemi.birimFiyat) || 0;
    return toplam + (yapilan * birimFiyat);
  }, 0);

  // Gerçekleşme oranını hesapla
  const gerceklesmeOrani = sozlesmeBedeli > 0 ? (gerceklesenImalat / sozlesmeBedeli) * 100 : 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Başlık */}
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Yeşil Defter (İmalat Defteri)
      </Typography>

      {/* Sözleşme Seçimi */}
      <Box sx={{ mb: 4 }}>
        <SozlesmeSecici
          value={selectedSozlesme}
          onChange={(e) => setSelectedSozlesme(e.target.value)}
        />
      </Box>

      {selectedSozlesme && (
        <>
          {/* Özet Kartları */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Toplam Sözleşme Bedeli
                  </Typography>
                  <Typography variant="h4">
                    {formatMoney(toplamSozlesmeBedeli)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Toplam Gerçekleşme
                  </Typography>
                  <Typography variant="h4">
                    {formatMoney(toplamGerceklesme)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ({((toplamGerceklesme / toplamSozlesmeBedeli) * 100).toFixed(2)}%)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* İş Kalemleri Tablosu */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Poz No</TableCell>
                  <TableCell>İş Tanımı</TableCell>
                  <TableCell>Birim</TableCell>
                  <TableCell align="right">Birim Fiyat</TableCell>
                  <TableCell align="right">Önceki Aylar</TableCell>
                  <TableCell align="right">Geçen Ay</TableCell>
                  <TableCell align="right">Bu Ay</TableCell>
                  <TableCell align="right">Toplam Yapılan</TableCell>
                  <TableCell align="right">Kalan Miktar</TableCell>
                  <TableCell align="right">Gerçekleşme</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isKalemleri.map((isKalemi) => {
                  const birimFiyat = Number(isKalemi.birimFiyat) || 0;
                  const miktar = Number(isKalemi.miktar) || 0;
                  const oncekiAylarToplami = Number(isKalemi.oncekiAylarToplami) || 0;
                  const gecenAy = Number(isKalemi.gecenAy) || 0;
                  const buAy = Number(isKalemi.buAy) || 0;
                  const toplamYapilan = oncekiAylarToplami + gecenAy + buAy;
                  const kalanMiktar = miktar - toplamYapilan;
                  const kalemOrani = miktar > 0 ? (toplamYapilan / miktar) * 100 : 0;

                  return (
                    <TableRow key={isKalemi.id}>
                      <TableCell>{isKalemi.pozNo}</TableCell>
                      <TableCell>{isKalemi.tanim}</TableCell>
                      <TableCell>{isKalemi.birim}</TableCell>
                      <TableCell align="right">{formatMoney(birimFiyat)}</TableCell>
                      <TableCell align="right">{oncekiAylarToplami.toFixed(2)}</TableCell>
                      <TableCell align="right">{gecenAy.toFixed(2)}</TableCell>
                      <TableCell align="right">{buAy.toFixed(2)}</TableCell>
                      <TableCell align="right">{toplamYapilan.toFixed(2)}</TableCell>
                      <TableCell align="right">{kalanMiktar.toFixed(2)}</TableCell>
                      <TableCell align="right">%{kalemOrani.toFixed(2)}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => handleMetrajDialogOpen(isKalemi)}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {isKalemleri.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      <Typography variant="body2" sx={{ py: 2 }}>
                        Bu sözleşmeye ait iş kalemi bulunamadı
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Metraj Dialog */}
      <Dialog
        open={openMetrajDialog}
        onClose={handleMetrajDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Aylık İmalat Girişi
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'grid', gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              İş Kalemi
            </Typography>
            <Typography variant="body1" gutterBottom>
              {selectedIsKalemi?.tanim}
            </Typography>
            
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Sözleşme Miktarı
            </Typography>
            <Typography variant="body1" gutterBottom>
              {selectedIsKalemi?.miktar} {selectedIsKalemi?.birim}
            </Typography>

            <TextField
              fullWidth
              label="Önceki Aylar Toplamı"
              type="number"
              value={yeniMetraj.oncekiAylarToplami}
              onChange={(e) => setYeniMetraj(prev => ({
                ...prev,
                oncekiAylarToplami: e.target.value
              }))}
            />

            <TextField
              fullWidth
              label="Geçen Ay"
              type="number"
              value={yeniMetraj.gecenAy}
              onChange={(e) => setYeniMetraj(prev => ({
                ...prev,
                gecenAy: e.target.value
              }))}
            />

            <TextField
              fullWidth
              label="Bu Ay"
              type="number"
              value={yeniMetraj.buAy}
              onChange={(e) => setYeniMetraj(prev => ({
                ...prev,
                buAy: e.target.value
              }))}
            />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Toplam Yapılan İmalat
            </Typography>
            <Typography variant="body1" gutterBottom>
              {((parseFloat(yeniMetraj.oncekiAylarToplami) || 0) + 
                (parseFloat(yeniMetraj.gecenAy) || 0) + 
                (parseFloat(yeniMetraj.buAy) || 0)).toFixed(2)} {selectedIsKalemi?.birim}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMetrajDialogClose}>
            İptal
          </Button>
          <Button
            onClick={handleMetrajKaydet}
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

export default YesilDefter; 