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
  Payment as PaymentIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../contexts/PermissionContext';
import { PAGE_PERMISSIONS } from '../../constants/permissions';
import { masrafBeyanService } from '../../services/masrafBeyanService';
import { formatDate, formatCurrency } from '../../utils/format';
import PageTitle from '../../components/PageTitle';

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
    masrafBeyanlariniYukle();
  }, []);

  const masrafBeyanlariniYukle = async () => {
    try {
      setLoading(true);
      const data = await masrafBeyanService.getOdenmemisOnaylilar();
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

  const handleYazdir = (masrafBeyan) => {
    setSeciliMasrafBeyan(masrafBeyan);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Masraf Beyanı</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 10mm;
              font-family: Arial, sans-serif;
              font-size: 11px;
              max-height: 277mm;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          <div style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 10px;">
            MASRAF BEYAN FORMU
          </div>

          <table style="width: 100%; margin-bottom: 15px; border: none;">
            <tr>
              <td style="font-weight: bold; width: 100px; border: none;">AÇIKLAMA:</td>
              <td style="border: none;">${masrafBeyan.olusturanAdi || ''}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <tr>
              <th style="border: 1px solid black; padding: 4px; width: 5%;">S.NO</th>
              <th style="border: 1px solid black; padding: 4px; width: 15%;">TARİH</th>
              <th style="border: 1px solid black; padding: 4px; width: 60%;">AÇIKLAMA</th>
              <th style="border: 1px solid black; padding: 4px; width: 10%;">TL</th>
              <th style="border: 1px solid black; padding: 4px; width: 10%;">USD</th>
            </tr>
            ${(masrafBeyan.masraflar || []).map((masraf, index) => `
              <tr>
                <td style="border: 1px solid black; padding: 4px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid black; padding: 4px;">${masraf.tarih ? formatDate(new Date(masraf.tarih)) : '-'}</td>
                <td style="border: 1px solid black; padding: 4px;">${masraf.aciklama || ''}</td>
                <td style="border: 1px solid black; padding: 4px; text-align: right;">${formatCurrency(masraf.tutar || 0)}</td>
                <td style="border: 1px solid black; padding: 4px;"></td>
              </tr>
            `).join('')}
            ${Array(Math.max(0, 20 - (masrafBeyan.masraflar || []).length)).fill(null).map((_, index) => `
              <tr>
                <td style="border: 1px solid black; padding: 4px; text-align: center;">${(masrafBeyan.masraflar || []).length + index + 1}</td>
                <td style="border: 1px solid black; padding: 4px;"></td>
                <td style="border: 1px solid black; padding: 4px;"></td>
                <td style="border: 1px solid black; padding: 4px;"></td>
                <td style="border: 1px solid black; padding: 4px;"></td>
              </tr>
            `).join('')}
            <tr>
              <td colspan="3" style="border: 1px solid black; padding: 4px; text-align: right; font-weight: bold;">TOPLAM:</td>
              <td style="border: 1px solid black; padding: 4px; text-align: right; font-weight: bold;">${formatCurrency((masrafBeyan.masraflar || []).reduce((toplam, masraf) => toplam + (parseFloat(masraf.tutar) || 0), 0))}</td>
              <td style="border: 1px solid black; padding: 4px;"></td>
            </tr>
          </table>

          <div style="margin-top: 30px; display: flex; justify-content: space-between;">
            <div style="width: 45%;">
              <div style="font-size: 11px;">DÜZENLEYEN</div>
              <div style="margin-top: 20px;">
                <div>${masrafBeyan.hazirlayan?.ad || masrafBeyan.olusturanAdi || ''}</div>
                <div style="font-size: 10px; color: #666; margin-top: 4px;">${masrafBeyan.createdAt ? formatDate(masrafBeyan.createdAt) : ''}</div>
                <div style="margin-top: 15px; border-top: 1px solid black;"></div>
              </div>
            </div>
            <div style="width: 45%;">
              <div style="font-size: 11px;">ONAYLAYAN</div>
              <div style="margin-top: 20px;">
                <div>${masrafBeyan.onaylayanAdi || masrafBeyan.onaylayan?.ad || ''}</div>
                <div style="font-size: 10px; color: #666; margin-top: 4px;">${masrafBeyan.onayTarihi ? formatDate(masrafBeyan.onayTarihi) : ''}</div>
                <div style="margin-top: 15px; border-top: 1px solid black;"></div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleOdemeYap = (masrafBeyan) => {
    setSeciliMasrafBeyan(masrafBeyan);
    setOdemeModalAcik(true);
  };

  const handleOdemeOnayla = async () => {
    if (!odemeAciklamasi.trim()) {
      enqueueSnackbar('Lütfen ödeme açıklaması giriniz', { variant: 'error' });
      return;
    }

    try {
      await masrafBeyanService.odemeYap(
        seciliMasrafBeyan.id,
        currentUser.uid,
        currentUser.displayName,
        odemeAciklamasi
      );
      enqueueSnackbar('Ödeme başarıyla kaydedildi', { variant: 'success' });
      setOdemeModalAcik(false);
      setOdemeAciklamasi('');
      masrafBeyanlariniYukle();
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
      <PageTitle title="Masraf Beyan Muhasebe" />

      {/* Masraf Beyanları Tablosu */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tarih</TableCell>
              <TableCell>Oluşturan</TableCell>
              <TableCell>Şantiye</TableCell>
              <TableCell>Toplam Tutar</TableCell>
              <TableCell>Onaylayan</TableCell>
              <TableCell>Onay Tarihi</TableCell>
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
                <TableCell>{masrafBeyan.onaylayanAdi}</TableCell>
                <TableCell>{formatDate(masrafBeyan.onayTarihi)}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleDetayGoster(masrafBeyan)}
                      sx={{ mr: 1 }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleYazdir(masrafBeyan)}
                      sx={{ mr: 1 }}
                    >
                      <PrintIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOdemeYap(masrafBeyan)}
                      title="Ödeme Yap"
                    >
                      <PaymentIcon fontSize="small" />
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
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Onaylayan</Typography>
                  <Typography>{seciliMasrafBeyan.onaylayanAdi}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Onay Tarihi</Typography>
                  <Typography>{formatDate(seciliMasrafBeyan.onayTarihi)}</Typography>
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
                      <TableCell>Açıklama</TableCell>
                      <TableCell align="right">Tutar</TableCell>
                      <TableCell>Para Birimi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {seciliMasrafBeyan.masraflar.map((masraf) => (
                      <TableRow key={masraf.id}>
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
              placeholder="Örn: Havale yapıldı - İş Bankası"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOdemeModalAcik(false)}>İptal</Button>
          <Button
            variant="contained"
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