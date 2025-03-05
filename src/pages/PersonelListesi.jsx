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
  IconButton as MuiIconButton,
  Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { personnelService } from '../services/personnelService';

const PersonelListesi = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTumu, setFilterTumu] = useState('Tümü');
  const [filterCalismaSekli, setFilterCalismaSekli] = useState('Tümü');
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

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
    navigate(`/personel/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      await personnelService.deletePersonnel(id);
      await loadPersonnel();
    } catch (err) {
      console.error('Error deleting personnel:', err);
      setError('Personel silinirken bir hata oluştu');
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    try {
      await personnelService.updatePersonnelStatus(id, !currentStatus);
      await loadPersonnel(); // Listeyi yenile
    } catch (err) {
      console.error('Error updating personnel status:', err);
      setError('Personel durumu güncellenirken bir hata oluştu');
    }
  };

  const handleImageClick = (imageUrl, personName) => {
    setSelectedImage({ url: imageUrl, name: personName });
  };

  return (
    <Box>
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
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/personel/yeni')}
        >
          Yeni Personel
        </Button>
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
              <TableCell>İşlemler</TableCell>
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
                      <Box
                        component="img"
                        src={person.foto}
                        alt={`${person.ad} ${person.soyad}`}
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          objectFit: 'cover',
                          borderRadius: '50%',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleImageClick(person.foto, `${person.ad} ${person.soyad}`)}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.875rem'
                        }}
                      >
                        {person.ad?.[0]}{person.soyad?.[0]}
                      </Box>
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
                      onClick={() => handleStatusChange(person.id, person.aktif)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(person.id)}
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(person.id)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon />
                    </IconButton>
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
    </Box>
  );
};

export default PersonelListesi;
