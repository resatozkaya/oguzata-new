import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
  Menu,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Description as DescriptionIcon,
  AccountBalance as AccountBalanceIcon,
  Business as BusinessIcon,
  Engineering as EngineeringIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { collection, getDocs, query, orderBy, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { alpha } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import sozlesmeService from '../../services/sozlesmeService';

const SozlesmePage = () => {
  const [sozlesmeler, setSozlesmeler] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode, sidebarColor } = useTheme();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedSozlesme, setSelectedSozlesme] = useState(null);
  const { currentUser } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSozlesmeler();
  }, []);

  const loadSozlesmeler = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sozlesmeService.getSozlesmeler();
      setSozlesmeler(data);
    } catch (error) {
      console.error('Sözleşmeler yüklenirken hata:', error);
      setError('Sözleşmeler yüklenirken bir hata oluştu');
      enqueueSnackbar('Sözleşmeler yüklenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    handleMenuClose();
    if (window.confirm('Bu sözleşmeyi silmek istediğinizden emin misiniz?')) {
      try {
        await sozlesmeService.deleteSozlesme(id);
        enqueueSnackbar('Sözleşme başarıyla silindi', { variant: 'success' });
        loadSozlesmeler();
      } catch (error) {
        console.error('Sözleşme silinirken hata:', error);
        enqueueSnackbar('Sözleşme silinirken bir hata oluştu', { variant: 'error' });
      }
    }
  };

  const SozlesmeOzetCard = ({ title, value, icon: Icon }) => (
    <Card sx={{
      height: '100%',
      bgcolor: isDarkMode ? 'background.paper' : '#fff',
      boxShadow: 3,
      '&:hover': {
        boxShadow: 6,
        transform: 'translateY(-2px)',
        transition: 'all 0.3s'
      }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Icon sx={{ color: sidebarColor, mr: 1, fontSize: 28 }} />
          <Typography variant="h6">{title}</Typography>
        </Box>
        <Typography variant="h4" sx={{ color: sidebarColor, fontWeight: 'bold' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  const istatistikler = [
    {
      title: 'Toplam Sözleşme',
      value: sozlesmeler.length,
      icon: DescriptionIcon
    },
    {
      title: 'Aktif Sözleşme',
      value: sozlesmeler.filter(s => s.durum === 'aktif').length,
      icon: AccountBalanceIcon
    },
    {
      title: 'Toplam Şantiye',
      value: new Set(sozlesmeler.map(s => s.santiye?.id)).size,
      icon: BusinessIcon
    },
    {
      title: 'Toplam Taşeron',
      value: new Set(sozlesmeler.map(s => s.taseron?.id)).size,
      icon: EngineeringIcon
    }
  ];

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleMenuClick = (event, sozlesme) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedSozlesme(sozlesme);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedSozlesme(null);
  };

  const filteredSozlesmeler = () => {
    switch (selectedTab) {
      case 1: // Aktif
        return sozlesmeler.filter(s => s.durum === 'aktif');
      case 2: // Tamamlanan
        return sozlesmeler.filter(s => s.durum === 'tamamlandi');
      case 3: // İptal Edilen
        return sozlesmeler.filter(s => s.durum === 'iptal');
      default: // Tümü
        return sozlesmeler;
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

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('tr-TR').format(date);
  };

  const formatMoney = (amount, currency = 'TRY') => {
    if (!amount) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency
    }).format(amount);
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
      {/* Başlık ve Yeni Sözleşme Butonu */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Sözleşme Yönetimi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/sozlesme/yeni')}
          sx={{
            bgcolor: sidebarColor,
            '&:hover': {
              bgcolor: alpha(sidebarColor, 0.9)
            }
          }}
        >
          Yeni Sözleşme
        </Button>
      </Box>

      {/* İstatistik Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {istatistikler.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <SozlesmeOzetCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="Tüm Sözleşmeler" />
          <Tab label="Aktif" />
          <Tab label="Tamamlanan" />
          <Tab label="İptal Edilen" />
        </Tabs>
      </Box>

      {/* Sözleşme Tablosu */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sözleşme No</TableCell>
              <TableCell>Sözleşme Adı</TableCell>
              <TableCell>Şantiye</TableCell>
              <TableCell>Taşeron</TableCell>
              <TableCell>Başlangıç</TableCell>
              <TableCell>Bitiş</TableCell>
              <TableCell>Toplam Bedel</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSozlesmeler().map((sozlesme) => (
              <TableRow 
                key={sozlesme.id}
                sx={{
                  '&:hover': {
                    bgcolor: alpha(sidebarColor, 0.05),
                    cursor: 'pointer'
                  }
                }}
                onClick={() => navigate(`/sozlesme/${sozlesme.id}`)}
              >
                <TableCell>{sozlesme.sozlesmeNo}</TableCell>
                <TableCell>{sozlesme.sozlesmeAdi}</TableCell>
                <TableCell>{sozlesme.santiye?.ad || '-'}</TableCell>
                <TableCell>{sozlesme.taseron?.unvan || '-'}</TableCell>
                <TableCell>{formatDate(sozlesme.baslangicTarihi)}</TableCell>
                <TableCell>{formatDate(sozlesme.bitisTarihi)}</TableCell>
                <TableCell>{formatMoney(sozlesme.toplamBedel, sozlesme.paraBirimi)}</TableCell>
                <TableCell>
                  <Chip
                    label={sozlesme.durum}
                    color={getDurumRenk(sozlesme.durum)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, sozlesme)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredSozlesmeler().length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" sx={{ py: 2 }}>
                    Gösterilecek sözleşme bulunamadı
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* İşlem Menüsü */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={(e) => {
          e.stopPropagation();
          navigate(`/sozlesme/${selectedSozlesme?.id}`);
          handleMenuClose();
        }}>
          <VisibilityIcon sx={{ mr: 1 }} /> Görüntüle
        </MenuItem>
        <MenuItem onClick={(e) => {
          e.stopPropagation();
          navigate(`/sozlesme/${selectedSozlesme?.id}/duzenle`);
          handleMenuClose();
        }}>
          <EditIcon sx={{ mr: 1 }} /> Düzenle
        </MenuItem>
        {selectedSozlesme?.dosyaUrl && (
          <MenuItem onClick={(e) => {
            e.stopPropagation();
            window.open(selectedSozlesme.dosyaUrl, '_blank');
            handleMenuClose();
          }}>
            <DownloadIcon sx={{ mr: 1 }} /> İndir
          </MenuItem>
        )}
        <MenuItem 
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(selectedSozlesme?.id);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> Sil
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SozlesmePage; 