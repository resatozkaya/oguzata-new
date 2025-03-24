import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../contexts/PermissionContext';
import { PAGE_PERMISSIONS } from '../../constants/permissions';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { formatDate, formatCurrency } from '../../utils/format';
import MasrafBeyanYazdir from './components/MasrafBeyanYazdir';

const MasrafBeyanOnay = () => {
  const { currentUser } = useAuth();
  const { hasPermission } = usePermission();
  const { enqueueSnackbar } = useSnackbar();

  const [masrafBeyanlar, setMasrafBeyanlar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seciliMasrafBeyan, setSeciliMasrafBeyan] = useState(null);
  const [detayModalAcik, setDetayModalAcik] = useState(false);
  const [redModalAcik, setRedModalAcik] = useState(false);
  const [redNedeni, setRedNedeni] = useState('');
  const [yazdirModalAcik, setYazdirModalAcik] = useState(false);

  // Yetki kontrolü
  const canOnay = hasPermission(PAGE_PERMISSIONS.MASRAF_BEYAN.ONAY);

  useEffect(() => {
    if (!canOnay) return;

    const q = query(
      collection(db, 'masrafBeyanlar'),
      where('durumu', '==', 'BEKLEMEDE'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const yeniMasraflar = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          tarih: data.tarih?.toDate?.() || data.tarih,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          onayTarihi: data.onayTarihi?.toDate?.() || data.onayTarihi,
          kalemler: data.kalemler || []
        };
      });
      setMasrafBeyanlar(yeniMasraflar);
    });

    return () => unsubscribe();
  }, [canOnay]);

  const handleDetayGoster = (masrafBeyan) => {
    setSeciliMasrafBeyan(masrafBeyan);
    setDetayModalAcik(true);
  };

  const handlePrint = (masrafBeyan) => {
    setSeciliMasrafBeyan(masrafBeyan);
    setYazdirModalAcik(true);
  };

  const handleReddet = (masrafBeyan) => {
    setSeciliMasrafBeyan(masrafBeyan);
    setRedModalAcik(true);
  };

  const handleReddetOnayla = async () => {
    if (!redNedeni.trim()) {
      enqueueSnackbar('Lütfen red nedeni giriniz', { variant: 'error' });
      return;
    }

    try {
      const docRef = doc(db, 'masrafBeyanlar', seciliMasrafBeyan.id);
      await updateDoc(docRef, {
        durumu: 'REDDEDILDI',
        redNedeni,
        reddedenId: currentUser.uid,
        reddedenAdi: currentUser.displayName || currentUser.email,
        redTarihi: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      enqueueSnackbar('Masraf beyanı reddedildi', { variant: 'success' });
      setRedModalAcik(false);
      setRedNedeni('');
    } catch (error) {
      console.error('Masraf beyanı reddedilirken hata:', error);
      enqueueSnackbar('Masraf beyanı reddedilirken hata oluştu', { variant: 'error' });
    }
  };

  const handleOnayla = async (masrafBeyan) => {
    try {
      const docRef = doc(db, 'masrafBeyanlar', masrafBeyan.id);
      await updateDoc(docRef, {
        durumu: 'ONAYLANDI',
        onaylayanId: currentUser.uid,
        onaylayanAdi: currentUser.displayName || currentUser.email,
        onayTarihi: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      enqueueSnackbar('Masraf beyanı onaylandı', { variant: 'success' });
    } catch (error) {
      console.error('Masraf beyanı onaylanırken hata:', error);
      enqueueSnackbar('Masraf beyanı onaylanırken hata oluştu', { variant: 'error' });
    }
  };

  if (!canOnay) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Masraf Beyan Onay</Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tarih</TableCell>
              <TableCell>Oluşturan</TableCell>
              <TableCell>Şantiye</TableCell>
              <TableCell align="right">Toplam Tutar</TableCell>
              <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {masrafBeyanlar.map((masrafBeyan) => (
              <TableRow key={masrafBeyan.id}>
                <TableCell>{formatDate(masrafBeyan.tarih)}</TableCell>
                <TableCell>{masrafBeyan.hazirlayan?.ad}</TableCell>
                <TableCell>{masrafBeyan.santiye}</TableCell>
                <TableCell align="right">
                  {formatCurrency(masrafBeyan.toplamTutar)}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleDetayGoster(masrafBeyan)}
                      title="Detay Göster"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handlePrint(masrafBeyan)}
                      title="Yazdır"
                    >
                      <PrintIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleOnayla(masrafBeyan)}
                      title="Onayla"
                    >
                      <CheckIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleReddet(masrafBeyan)}
                      title="Reddet"
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {masrafBeyanlar.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Onay bekleyen masraf beyanı bulunmamaktadır
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detay Modal */}
      <Dialog
        open={detayModalAcik}
        onClose={() => setDetayModalAcik(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Masraf Beyanı Detay
          <IconButton
            onClick={() => setDetayModalAcik(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {seciliMasrafBeyan && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Oluşturan</Typography>
                  <Typography>{seciliMasrafBeyan.hazirlayan?.ad}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Şantiye</Typography>
                  <Typography>{seciliMasrafBeyan.santiye}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Oluşturma Tarihi</Typography>
                  <Typography>{formatDate(seciliMasrafBeyan.createdAt)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Masraf Tarihi</Typography>
                  <Typography>{formatDate(seciliMasrafBeyan.tarih)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Durumu</Typography>
                  <Typography>{seciliMasrafBeyan.durumu}</Typography>
                </Grid>
                {seciliMasrafBeyan.onayTarihi && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Onay Tarihi</Typography>
                    <Typography>{formatDate(seciliMasrafBeyan.onayTarihi)}</Typography>
                  </Grid>
                )}
                {seciliMasrafBeyan.redTarihi && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Red Tarihi</Typography>
                    <Typography>{formatDate(seciliMasrafBeyan.redTarihi)}</Typography>
                  </Grid>
                )}
                {seciliMasrafBeyan.redNedeni && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Red Nedeni</Typography>
                    <Typography>{seciliMasrafBeyan.redNedeni}</Typography>
                  </Grid>
                )}
              </Grid>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tarih</TableCell>
                      <TableCell>Açıklama</TableCell>
                      <TableCell align="right">Tutar</TableCell>
                      <TableCell align="right">Para Birimi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {seciliMasrafBeyan.kalemler?.map((kalem, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(seciliMasrafBeyan.tarih)}</TableCell>
                        <TableCell>{kalem.aciklama}</TableCell>
                        <TableCell align="right">{formatCurrency(kalem.tutar)}</TableCell>
                        <TableCell align="right">TL</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} align="right"><strong>TOPLAM:</strong></TableCell>
                      <TableCell align="right">
                        <strong>{formatCurrency(seciliMasrafBeyan.toplamTutar)}</strong>
                      </TableCell>
                      <TableCell align="right">TL</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Red Modal */}
      <Dialog
        open={redModalAcik}
        onClose={() => setRedModalAcik(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Masraf Beyanını Reddet
          <IconButton
            onClick={() => setRedModalAcik(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Red Nedeni"
              multiline
              rows={4}
              value={redNedeni}
              onChange={(e) => setRedNedeni(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRedModalAcik(false)}>İptal</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReddetOnayla}
          >
            Reddet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Yazdır Modal */}
      <MasrafBeyanYazdir
        open={yazdirModalAcik}
        onClose={() => setYazdirModalAcik(false)}
        masrafBeyan={seciliMasrafBeyan}
      />
    </Box>
  );
};

export default MasrafBeyanOnay; 