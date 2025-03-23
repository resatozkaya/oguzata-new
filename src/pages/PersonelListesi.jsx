import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Box,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { personnelService } from '../services/personnelService';
import { usePermission } from '../contexts/PermissionContext';
import { PAGE_PERMISSIONS } from '../constants/permissions';
import PersonelPermissionModal from '../components/personel/PersonelPermissionModal';
import { useSnackbar } from 'notistack';
import PageTitle from '../components/PageTitle';
import { useAuth } from '../contexts/AuthContext';

const PersonelListesi = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = usePermission();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTumu, setFilterTumu] = useState('Tümü');
  const [filterCalismaSekli, setFilterCalismaSekli] = useState('Tümü');
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPersonel, setSelectedPersonel] = useState(null);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);

  // Yetki kontrolleri
  const { hasPermission: canView } = usePermission(PAGE_PERMISSIONS.PERSONEL.VIEW);
  const { hasPermission: canCreate } = usePermission(PAGE_PERMISSIONS.PERSONEL.CREATE);
  const { hasPermission: canUpdate } = usePermission(PAGE_PERMISSIONS.PERSONEL.UPDATE);
  const { hasPermission: canDelete } = usePermission(PAGE_PERMISSIONS.PERSONEL.DELETE);
  const { hasPermission: canManagePermissions } = usePermission(PAGE_PERMISSIONS.PERSONEL.MANAGE_PERMISSIONS);

  useEffect(() => {
    loadPersonnel();
  }, []);

  const loadPersonnel = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await personnelService.getAllPersonnel();
      setPersonnel(data || []);
    } catch (err) {
      console.error('Error loading personnel:', err);
      setError('Personel listesi yüklenirken bir hata oluştu');
      enqueueSnackbar('Personel listesi yüklenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Çalışma şekli sıralama önceliği
  const calismaSekilSirasi = {
    'MAAŞLI ÇALIŞAN': 1,
    'YEVMİYE ÇALIŞAN': 2,
    'TAŞERON': 3,
    'TAŞERON ÇALIŞANI': 4,
    'ESNAF': 5,
    'DİĞER': 6
  };

  // Benzersiz çalışma şekillerini al
  const uniqueCalismaSekilleri = ['Tümü', ...new Set(personnel.map(p => p.calismaSekli).filter(Boolean))];

  // Filtreleme ve sıralama işlemi
  const filteredPersonnel = personnel
    .filter(person => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        person.ad?.toLowerCase().includes(searchLower) ||
        person.soyad?.toLowerCase().includes(searchLower) ||
        person.firmaAdi?.toLowerCase().includes(searchLower) ||
        person.telefon?.toLowerCase().includes(searchLower);

      const matchesStatus = filterTumu === 'Tümü' || 
        (filterTumu === 'Aktif' && person.aktif) ||
        (filterTumu === 'Pasif' && !person.aktif);

      const matchesCalismaSekli = filterCalismaSekli === 'Tümü' || 
        person.calismaSekli === filterCalismaSekli;

      return matchesSearch && matchesStatus && matchesCalismaSekli;
    })
    .sort((a, b) => {
      // Önce çalışma şekline göre sırala
      const calismaSekilFarki = 
        (calismaSekilSirasi[a.calismaSekli] || 999) - 
        (calismaSekilSirasi[b.calismaSekli] || 999);
      
      if (calismaSekilFarki !== 0) return calismaSekilFarki;
      
      // Aynı çalışma şeklindeyse isme göre sırala
      const adA = `${a.ad || ''} ${a.soyad || ''}`.toLowerCase();
      const adB = `${b.ad || ''} ${b.soyad || ''}`.toLowerCase();
      
      return adA.localeCompare(adB, 'tr');
    });

  const handleEdit = (id) => {
    if (!hasPermission('personel_update')) {
      enqueueSnackbar('Bu işlem için yetkiniz bulunmamaktadır.', { variant: 'error' });
      return;
    }
    navigate(`/personel/${id}`);
  };

  const handleDelete = async (id) => {
    if (!hasPermission('personel_delete')) {
      enqueueSnackbar('Bu işlem için yetkiniz bulunmamaktadır.', { variant: 'error' });
      return;
    }
    if (window.confirm('Bu personeli silmek istediğinizden emin misiniz?')) {
      try {
        await personnelService.deletePersonnel(id);
        await loadPersonnel();
        enqueueSnackbar('Personel başarıyla silindi', { variant: 'success' });
      } catch (err) {
        console.error('Error deleting personnel:', err);
        enqueueSnackbar('Personel silinirken bir hata oluştu', { variant: 'error' });
      }
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    if (!hasPermission('personel_update')) {
      enqueueSnackbar('Bu işlem için yetkiniz bulunmamaktadır.', { variant: 'error' });
      return;
    }
    try {
      await personnelService.updatePersonnelStatus(id, !currentStatus);
      await loadPersonnel();
      enqueueSnackbar('Personel durumu güncellendi', { variant: 'success' });
    } catch (err) {
      console.error('Error updating personnel status:', err);
      enqueueSnackbar('Personel durumu güncellenirken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleImageClick = (imageUrl, personName) => {
    setSelectedImage({ url: imageUrl, name: personName });
  };

  const handlePermissions = (id) => {
    setPermissionModalOpen(true);
  };

  const handleAddNew = () => {
    if (!hasPermission('personel_create')) {
      enqueueSnackbar('Bu işlem için yetkiniz bulunmamaktadır.', { variant: 'error' });
      return;
    }
    navigate('/personel/yeni');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageTitle title="Personel Listesi" />
        {hasPermission('personel_create') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
          >
            Yeni Personel
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filtreler */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Arama..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1 }}
        />
        <TextField
          select
          size="small"
          value={filterTumu}
          onChange={(e) => setFilterTumu(e.target.value)}
          sx={{ width: 200 }}
        >
          <MenuItem value="Tümü">Tümü</MenuItem>
          <MenuItem value="Aktif">Aktif</MenuItem>
          <MenuItem value="Pasif">Pasif</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          value={filterCalismaSekli}
          onChange={(e) => setFilterCalismaSekli(e.target.value)}
          sx={{ width: 200 }}
          label="Çalışma Şekli"
        >
          {uniqueCalismaSekilleri.map((sekil) => (
            <MenuItem key={sekil} value={sekil}>
              {sekil}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Tablo */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fotoğraf</TableCell>
              <TableCell>Ad Soyad</TableCell>
              <TableCell>Firma Adı</TableCell>
              <TableCell>Telefon</TableCell>
              <TableCell>Çalışma Şekli</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredPersonnel.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography>Personel bulunamadı</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredPersonnel.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    {person.foto ? (
                      <Avatar
                        src={person.foto}
                        alt={`${person.ad} ${person.soyad}`}
                        sx={{ 
                          width: 40, 
                          height: 40,
                          cursor: 'pointer'
                        }}
                        onClick={() => handleImageClick(person.foto, `${person.ad} ${person.soyad}`)}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: 'primary.main'
                        }}
                      >
                        {person.ad?.[0]}{person.soyad?.[0]}
                      </Avatar>
                    )}
                  </TableCell>
                  <TableCell>{person.ad} {person.soyad}</TableCell>
                  <TableCell>{person.firmaAdi}</TableCell>
                  <TableCell>{person.telefon}</TableCell>
                  <TableCell>{person.calismaSekli}</TableCell>
                  <TableCell>
                    <Chip
                      label={person.aktif ? 'AKTİF' : 'PASİF'}
                      color={person.aktif ? 'success' : 'default'}
                      size="small"
                      onClick={() => hasPermission('personel_update') && handleStatusChange(person.id, person.aktif)}
                      sx={{ cursor: hasPermission('personel_update') ? 'pointer' : 'not-allowed' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      {hasPermission('personel_update') && (
                        <Tooltip title="Düzenle">
                          <IconButton
                            onClick={() => handleEdit(person.id)}
                            color="primary"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {hasPermission('personel_delete') && (
                        <Tooltip title="Sil">
                          <IconButton
                            onClick={() => handleDelete(person.id)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Resim Büyütme Dialog'u */}
      <Dialog 
        open={Boolean(selectedImage)} 
        onClose={() => setSelectedImage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedImage?.name}
          <IconButton
            onClick={() => setSelectedImage(null)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage.url}
              alt={selectedImage.name}
              sx={{
                width: '100%',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Yetkilendirme Modal'ı */}
      <PersonelPermissionModal
        open={permissionModalOpen}
        onClose={() => {
          setPermissionModalOpen(false);
        }}
      />
    </Box>
  );
};

export default PersonelListesi;
