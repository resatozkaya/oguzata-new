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
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../contexts/PermissionContext';
import { PAGE_PERMISSIONS } from '../../constants/permissions';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { formatDate, formatCurrency } from '../../utils/format';
import MasrafBeyanDetay from './components/MasrafBeyanDetay';


const MasrafBeyanMuhasebe = () => {
  const { currentUser } = useAuth();
  const { hasPermission } = usePermission();
  const { enqueueSnackbar } = useSnackbar();

  const [masrafBeyanlar, setMasrafBeyanlar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seciliMasrafBeyan, setSeciliMasrafBeyan] = useState(null);
  const [detayModalAcik, setDetayModalAcik] = useState(false);
  const [odemeModalAcik, setOdemeModalAcik] = useState(false);
  const [odemeAciklamasi, setOdemeAciklamasi] = useState('');

  // Yetki kontrolü
  const canMuhasebe = hasPermission(PAGE_PERMISSIONS.MASRAF_BEYAN.MUHASEBE);

  useEffect(() => {
    if (!canMuhasebe) return;

    const q = query(
      collection(db, 'masrafBeyanlar'),
      where('durumu', '==', 'ONAYLANDI'),
      where('odendi', '!=', true),
      orderBy('onayTarihi', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const yeniMasraflar = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          tarih: data.tarih?.toDate?.() || data.tarih,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          onayTarihi: data.onayTarihi?.toDate?.() || data.onayTarihi
        };
      });
      setMasrafBeyanlar(yeniMasraflar);
    });

    return () => unsubscribe();
  }, [canMuhasebe]);

  const handleDetayGoster = (masrafBeyan) => {
    setSeciliMasrafBeyan(masrafBeyan);
    setDetayModalAcik(true);
  };

  const handleOdemeYap = (masrafBeyan) => {
    setSeciliMasrafBeyan(masrafBeyan);
    setOdemeModalAcik(true);
  };

  const handleOdemeOnayla = async () => {
    try {
      const docRef = doc(db, 'masrafBeyanlar', seciliMasrafBeyan.id);
      await updateDoc(docRef, {
        odendi: true,
        odemeDurumu: 'Ödendi',
        odeyenId: currentUser.uid,
        odeyenAdi: currentUser.name ? `${currentUser.name} ${currentUser.surname || ''}` : currentUser.email,
        odemeTarihi: serverTimestamp(),
        odemeAciklamasi,
        updatedAt: serverTimestamp()
      });

      enqueueSnackbar('Ödeme kaydedildi', { variant: 'success' });
      setOdemeModalAcik(false);
      setOdemeAciklamasi('');
    } catch (error) {
      console.error('Ödeme kaydedilirken hata:', error);
      enqueueSnackbar('Ödeme kaydedilirken hata oluştu', { variant: 'error' });
    }
  };

  if (!canMuhasebe) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Masraf Beyan Muhasebe</Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tarih</TableCell>
              <TableCell>Oluşturan</TableCell>
              <TableCell>Şantiye</TableCell>
              <TableCell align="right">Toplam Tutar</TableCell>
              <TableCell>Onaylayan</TableCell>
              <TableCell>Onay Tarihi</TableCell>
              <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {masrafBeyanlar.map((masrafBeyan) => (
              <TableRow key={masrafBeyan.id}>
                <TableCell>{formatDate(masrafBeyan.tarih)}</TableCell>
                <TableCell>{masrafBeyan.hazirlayan?.name ? `${masrafBeyan.hazirlayan.name} ${masrafBeyan.hazirlayan.surname || ''}` : masrafBeyan.hazirlayan?.ad || '-'}</TableCell>
                <TableCell>{masrafBeyan.santiye}</TableCell>
                <TableCell align="right">
                  {formatCurrency(masrafBeyan.toplamTutar)}
                </TableCell>
                <TableCell>{masrafBeyan.onaylayanAdi}</TableCell>
                <TableCell>{formatDate(masrafBeyan.onayTarihi)}</TableCell>
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
                      color="primary"
                      onClick={() => handleOdemeYap(masrafBeyan)}
                      title="Ödeme Yap"
                    >
                      <PaymentIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {masrafBeyanlar.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Ödeme bekleyen onaylı masraf beyanı bulunmamaktadır
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detay Modal */}
      <MasrafBeyanDetay
        open={detayModalAcik}
        onClose={() => setDetayModalAcik(false)}
        masrafBeyan={seciliMasrafBeyan}
      />

      {/* Ödeme Modal */}
      <Dialog
        open={odemeModalAcik}
        onClose={() => setOdemeModalAcik(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Ödeme Yap
          <IconButton
            onClick={() => setOdemeModalAcik(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Ödeme Açıklaması"
              multiline
              rows={4}
              value={odemeAciklamasi}
              onChange={(e) => setOdemeAciklamasi(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOdemeModalAcik(false)}>İptal</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOdemeOnayla}
          >
            Ödemeyi Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MasrafBeyanMuhasebe; 