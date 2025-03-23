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
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../contexts/PermissionContext';
import { PAGE_PERMISSIONS } from '../../constants/permissions';
import { MASRAF_BEYAN_DURUMLARI } from '../../types/masrafBeyan';
import { masrafBeyanService } from '../../services/masrafBeyanService';
import { formatDate, formatCurrency } from '../../utils/format';
import PageTitle from '../../components/PageTitle';

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

  // Yetki kontrolü
  const canOnay = hasPermission(PAGE_PERMISSIONS.MASRAF_BEYAN.ONAY);

  useEffect(() => {
    masrafBeyanlariniYukle();
  }, []);

  const masrafBeyanlariniYukle = async () => {
    try {
      setLoading(true);
      const data = await masrafBeyanService.getOnayBekleyenler();
      setMasrafBeyanlar(data);
    } catch (error) {
      console.error('Masraf beyanları yüklenirken hata:', error);
      enqueueSnackbar('Masraf beyanları yüklenirken hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDetayGoster = (masrafBeyan) => {
    setSeciliMasrafBeyan(masrafBeyan);
    setDetayModalAcik(true);
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
      await masrafBeyanService.reddet(
        seciliMasrafBeyan.id,
        currentUser.uid,
        currentUser.displayName,
        redNedeni
      );
      enqueueSnackbar('Masraf beyanı reddedildi', { variant: 'success' });
      setRedModalAcik(false);
      setRedNedeni('');
      masrafBeyanlariniYukle();
    } catch (error) {
      console.error('Masraf beyanı reddedilirken hata:', error);
      enqueueSnackbar('Masraf beyanı reddedilirken hata oluştu', { variant: 'error' });
    }
  };

  const handleOnayla = async (masrafBeyan) => {
    try {
      await masrafBeyanService.onayla(
        masrafBeyan.id,
        currentUser.uid,
        currentUser.displayName
      );
      enqueueSnackbar('Masraf beyanı onaylandı', { variant: 'success' });
      masrafBeyanlariniYukle();
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
      <PageTitle title="Masraf Beyan Onay" />

      {/* Masraf Beyanları Tablosu */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tarih</TableCell>
              <TableCell>Oluşturan</TableCell>
              <TableCell>Şantiye</TableCell>
              <TableCell>Toplam Tutar</TableCell>
              <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {masrafBeyanlar.map((masrafBeyan) => (
              <TableRow key={masrafBeyan.id}>
                <TableCell>{formatDate(masrafBeyan.tarih)}</TableCell>
                <TableCell>{masrafBeyan.olusturanAdi}</TableCell>
                <TableCell>{masrafBeyan.santiyeAdi}</TableCell>
                <TableCell>
                  {formatCurrency(
                    masrafBeyan.masraflar.reduce((toplam, masraf) => toplam + masraf.tutar, 0),
                    'TL'
                  )}
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
                  <Typography>{seciliMasrafBeyan.olusturanAdi}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Şantiye</Typography>
                  <Typography>{seciliMasrafBeyan.santiyeAdi}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Açıklama</Typography>
                  <Typography>{seciliMasrafBeyan.aciklama || '-'}</Typography>
                </Grid>
              </Grid>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tarih</TableCell>
                      <TableCell>Açıklama</TableCell>
                      <TableCell align="right">Tutar</TableCell>
                      <TableCell>Para Birimi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {seciliMasrafBeyan.masraflar.map((masraf) => (
                      <TableRow key={masraf.id}>
                        <TableCell>{formatDate(masraf.tarih)}</TableCell>
                        <TableCell>{masraf.aciklama}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(masraf.tutar, masraf.paraBirimi)}
                        </TableCell>
                        <TableCell>{masraf.paraBirimi}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Typography variant="h6">
                  Toplam: {formatCurrency(
                    seciliMasrafBeyan.masraflar.reduce((toplam, masraf) => toplam + masraf.tutar, 0),
                    'TL'
                  )}
                </Typography>
              </Box>
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
    </Box>
  );
};

export default MasrafBeyanOnay; 