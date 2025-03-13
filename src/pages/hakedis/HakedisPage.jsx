import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { collection, getDocs, query, orderBy, where, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { alpha } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';

const HakedisPage = () => {
  const [hakedisler, setHakedisler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDarkMode, sidebarColor } = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useAuth();

  useEffect(() => {
    loadHakedisler();
  }, []);

  const loadHakedisler = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const hakedisRef = collection(db, 'hakedisler');
      const q = query(hakedisRef, orderBy('hakedisNo', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const hakedisData = [];
      for (const docSnapshot of querySnapshot.docs) {
        const hakedis = { id: docSnapshot.id, ...docSnapshot.data() };
        console.log('Hakediş verisi:', hakedis); // Veriyi kontrol etmek için log
        console.log('olusturmaTarihi tipi:', typeof hakedis.olusturmaTarihi); // Tarih tipini kontrol
        console.log('olusturmaTarihi değeri:', hakedis.olusturmaTarihi); // Tarih değerini kontrol
        
        // Sözleşme bilgilerini al
        if (hakedis.sozlesmeId) {
          const sozlesmeRef = doc(db, 'sozlesmeler', hakedis.sozlesmeId);
          const sozlesmeDoc = await getDoc(sozlesmeRef);
          if (sozlesmeDoc.exists()) {
            hakedis.sozlesme = sozlesmeDoc.data();
          }
        }
        
        hakedisData.push(hakedis);
      }
      
      setHakedisler(hakedisData);
    } catch (error) {
      console.error('Hakedişler yüklenirken hata:', error);
      setError('Hakedişler yüklenirken bir hata oluştu');
      enqueueSnackbar('Hakedişler yüklenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu hakedişi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'hakedisler', id));
        enqueueSnackbar('Hakediş başarıyla silindi', { variant: 'success' });
        loadHakedisler();
      } catch (error) {
        console.error('Hakediş silinirken hata:', error);
        enqueueSnackbar('Hakediş silinirken bir hata oluştu', { variant: 'error' });
      }
    }
  };

  const getDurumRenk = (durum) => {
    switch (durum?.toLowerCase()) {
      case 'taslak':
        return 'default';
      case 'onaybekliyor':
        return 'warning';
      case 'onaylandi':
        return 'success';
      case 'reddedildi':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (timestamp) => {
    try {
      if (!timestamp) return '-';
      
      // Firestore Timestamp kontrolü
      if (timestamp && typeof timestamp === 'object') {
        // Firestore Timestamp objesi
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          return timestamp.toDate().toLocaleDateString('tr-TR');
        }
        
        // Timestamp benzeri obje (seconds ve nanoseconds içeren)
        if ('seconds' in timestamp) {
          const date = new Date(timestamp.seconds * 1000);
          return date.toLocaleDateString('tr-TR');
        }
      }
      
      return '-';
    } catch (error) {
      console.error('Tarih formatlanırken hata:', error);
      return '-';
    }
  };

  const formatMoney = (amount, currency = 'TRY') => {
    if (!amount) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const renderTableCell = (content, formatter = null) => {
    try {
      if (formatter) {
        return <TableCell>{formatter(content)}</TableCell>;
      }
      return <TableCell>{content || '-'}</TableCell>;
    } catch (error) {
      console.error('Hücre render hatası:', error);
      return <TableCell>-</TableCell>;
    }
  };

  const renderHakedisRow = (hakedis) => {
    try {
      return (
        <TableRow key={hakedis.id}>
          {renderTableCell(hakedis.hakedisNo)}
          {renderTableCell(hakedis.sozlesme?.sozlesmeAdi)}
          {renderTableCell(hakedis.donem, formatDate)}
          {renderTableCell(hakedis.olusturmaTarihi, formatDate)}
          {renderTableCell(hakedis.toplamTutar, formatMoney)}
          {renderTableCell(hakedis.netTutar, formatMoney)}
          <TableCell>
            <Chip
              label={hakedis.durum || 'taslak'}
              color={getDurumRenk(hakedis.durum)}
              size="small"
            />
          </TableCell>
          <TableCell>
            <IconButton
              size="small"
              onClick={() => navigate(`/hakedis/${hakedis.id}`)}
              sx={{ mr: 1 }}
            >
              <VisibilityIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => navigate(`/hakedis/${hakedis.id}/duzenle`)}
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDelete(hakedis.id)}
              sx={{ mr: 1 }}
            >
              <DeleteIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => window.open(`/hakedis/${hakedis.id}/pdf`, '_blank')}
            >
              <PdfIcon />
            </IconButton>
          </TableCell>
        </TableRow>
      );
    } catch (error) {
      console.error('Satır render hatası:', error);
      return null;
    }
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
      {/* Başlık ve Yeni Hakediş Butonu */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Hakediş Yönetimi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/hakedis/yeni')}
          sx={{
            bgcolor: sidebarColor,
            '&:hover': {
              bgcolor: alpha(sidebarColor, 0.9)
            }
          }}
        >
          Yeni Hakediş
        </Button>
      </Box>

      {/* Özet Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">
                Toplam Hakediş
              </Typography>
              <Typography variant="h4">
                {hakedisler.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">
                Onay Bekleyen
              </Typography>
              <Typography variant="h4">
                {hakedisler.filter(h => h.durum === 'onaybekliyor').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">
                Onaylanan
              </Typography>
              <Typography variant="h4">
                {hakedisler.filter(h => h.durum === 'onaylandi').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">
                Toplam Tutar
              </Typography>
              <Typography variant="h4">
                {formatMoney(hakedisler.reduce((sum, h) => sum + (h.toplamTutar || 0), 0))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Hakediş Tablosu */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Hakediş No</TableCell>
              <TableCell>Sözleşme</TableCell>
              <TableCell>Dönem</TableCell>
              <TableCell>Oluşturma Tarihi</TableCell>
              <TableCell>Tutar</TableCell>
              <TableCell>Net Tutar</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hakedisler.map(renderHakedisRow)}
            {hakedisler.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" sx={{ py: 2 }}>
                    Gösterilecek hakediş bulunamadı
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default HakedisPage; 