import React, { useState, useEffect } from 'react';
import {
  Box,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
  IconButton,
  Avatar,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { PageTitle } from '../components/PageTitle';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../contexts/PermissionContext';

const SantiyeYonetimi = () => {
  const { currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const [santiyeler, setSantiyeler] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSantiye, setSelectedSantiye] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEdit = (santiye) => {
    if (!hasPermission('santiye_update')) {
      enqueueSnackbar('Bu işlem için yetkiniz bulunmamaktadır.', { variant: 'error' });
      return;
    }
    setSelectedSantiye(santiye);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!hasPermission('santiye_delete')) {
      enqueueSnackbar('Bu işlem için yetkiniz bulunmamaktadır.', { variant: 'error' });
      return;
    }
    if (window.confirm('Bu şantiyeyi silmek istediğinizden emin misiniz?')) {
      try {
        // Silme işlemi burada yapılacak
        enqueueSnackbar('Şantiye başarıyla silindi', { variant: 'success' });
      } catch (error) {
        console.error('Şantiye silinirken hata:', error);
        enqueueSnackbar('Şantiye silinirken bir hata oluştu', { variant: 'error' });
      }
    }
  };

  const handleView = (santiye) => {
    if (!hasPermission('santiye_view')) {
      enqueueSnackbar('Bu işlem için yetkiniz bulunmamaktadır.', { variant: 'error' });
      return;
    }
    navigate(`/santiye/${santiye.id}`);
  };

  const handleOpenDialog = () => {
    if (!hasPermission('santiye_create')) {
      enqueueSnackbar('Bu işlem için yetkiniz bulunmamaktadır.', { variant: 'error' });
      return;
    }
    setSelectedSantiye(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedSantiye(null);
    setOpenDialog(false);
  };

  const getDurumColor = (durum) => {
    switch (durum?.toLowerCase()) {
      case 'aktif':
        return 'success';
      case 'tamamlandı':
        return 'info';
      case 'iptal':
        return 'error';
      case 'beklemede':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <PageTitle title="Şantiye Yönetimi" />
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Kod</TableCell>
              <TableCell>Ad</TableCell>
              <TableCell>Adres</TableCell>
              <TableCell>Şantiye Şefi</TableCell>
              <TableCell>Proje Müdürü</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {santiyeler.map((santiye) => (
              <TableRow key={santiye.id}>
                <TableCell>{santiye.kod}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={santiye.logo} alt={santiye.ad} sx={{ width: 40, height: 40 }} />
                    {santiye.ad}
                  </Box>
                </TableCell>
                <TableCell>{santiye.adres}</TableCell>
                <TableCell>{santiye.santiyeSefi || '***'}</TableCell>
                <TableCell>{santiye.projeMuduru || '***'}</TableCell>
                <TableCell>
                  <Chip
                    label={santiye.durum}
                    color={getDurumColor(santiye.durum)}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    {hasPermission('santiye_update') && (
                      <Tooltip title="Düzenle">
                        <IconButton
                          onClick={() => handleEdit(santiye)}
                          color="primary"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {hasPermission('santiye_delete') && (
                      <Tooltip title="Sil">
                        <IconButton
                          onClick={() => handleDelete(santiye.id)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {hasPermission('santiye_view') && (
                      <Tooltip title="Görüntüle">
                        <IconButton
                          onClick={() => handleView(santiye)}
                          color="info"
                          size="small"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {hasPermission('santiye_create') && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleOpenDialog}
        >
          <AddIcon />
        </Fab>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedSantiye ? 'Şantiye Düzenle' : 'Yeni Şantiye Ekle'}
        </DialogTitle>
        <DialogContent>
          {/* Dialog içeriği buraya gelecek */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button variant="contained" color="primary">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SantiyeYonetimi; 