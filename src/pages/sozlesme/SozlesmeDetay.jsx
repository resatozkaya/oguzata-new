import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { alpha } from '@mui/material/styles';
import { useSnackbar } from 'notistack';

const SozlesmeDetay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode, sidebarColor } = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sozlesme, setSozlesme] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchSozlesme = async () => {
      try {
        setLoading(true);
        const sozlesmeDoc = await getDoc(doc(db, 'sozlesmeler', id));
        if (sozlesmeDoc.exists()) {
          setSozlesme({
            id: sozlesmeDoc.id,
            ...sozlesmeDoc.data()
          });
        } else {
          setError('Sözleşme bulunamadı');
        }
      } catch (error) {
        console.error('Sözleşme yüklenirken hata:', error);
        setError('Sözleşme yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchSozlesme();
  }, [id]);

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'sozlesmeler', id));
      enqueueSnackbar('Sözleşme başarıyla silindi', { variant: 'success' });
      navigate('/sozlesme');
    } catch (error) {
      console.error('Sözleşme silinirken hata:', error);
      enqueueSnackbar('Sözleşme silinirken bir hata oluştu', { variant: 'error' });
    }
  };

  const getDurumRenk = (durum) => {
    switch (durum?.toLowerCase()) {
      case 'aktif':
        return 'success';
      case 'tamamlandi':
        return 'info';
      case 'iptal':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatTarih = (tarih) => {
    if (!tarih) return '-';
    return tarih.toDate().toLocaleDateString('tr-TR');
  };

  const formatParaBirimi = (tutar) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(tutar || 0);
  };

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
      {/* Üst Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/sozlesme')}
        >
          Geri
        </Button>
        <Stack direction="row" spacing={2}>
          {sozlesme?.dosyaUrl && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => window.open(sozlesme.dosyaUrl, '_blank')}
            >
              Sözleşme Dosyası
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/sozlesme/${id}/duzenle`)}
            sx={{
              bgcolor: sidebarColor,
              '&:hover': {
                bgcolor: alpha(sidebarColor, 0.9)
              }
            }}
          >
            Düzenle
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Sil
          </Button>
        </Stack>
      </Box>

      {/* Sözleşme Detayları */}
      <Grid container spacing={3}>
        {/* Ana Bilgiler */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Sözleşme Bilgileri</Typography>
                <Chip
                  label={sozlesme?.durum}
                  color={getDurumRenk(sozlesme?.durum)}
                />
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Sözleşme No
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {sozlesme?.sozlesmeNo}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Sözleşme Tipi
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {sozlesme?.tip === 'birim_fiyat' ? 'Birim Fiyat' :
                     sozlesme?.tip === 'goturu' ? 'Götürü' :
                     sozlesme?.tip === 'yuzdelik' ? 'Yüzdelik' : '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Şantiye
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {sozlesme?.santiye?.ad || '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Taşeron
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {sozlesme?.taseron?.unvan || '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Başlangıç Tarihi
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {formatTarih(sozlesme?.baslangicTarihi)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Bitiş Tarihi
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {formatTarih(sozlesme?.bitisTarihi)}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Toplam Tutar
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                    {formatParaBirimi(sozlesme?.toplamTutar)}
                  </Typography>
                </Grid>

                {sozlesme?.aciklama && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Açıklama
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                      {sozlesme.aciklama}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Yan Panel */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Tarih Bilgileri */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Kayıt Bilgileri
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Oluşturma Tarihi
                    </Typography>
                    <Typography variant="body1">
                      {formatTarih(sozlesme?.olusturmaTarihi)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Son Güncelleme
                    </Typography>
                    <Typography variant="body1">
                      {formatTarih(sozlesme?.guncellemeTarihi)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Dosya Bilgileri */}
            {sozlesme?.dosyaAdi && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Dosya Bilgileri
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Dosya Adı
                      </Typography>
                      <Typography variant="body1">
                        {sozlesme.dosyaAdi}
                      </Typography>
                    </Box>
                    {sozlesme.dosyaUrl && (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => window.open(sozlesme.dosyaUrl, '_blank')}
                      >
                        İndir
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* Silme Onay Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Sözleşmeyi Sil
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bu sözleşmeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            İptal
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SozlesmeDetay; 