import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const SozlesmeList = () => {
  const [sozlesmeler, setSozlesmeler] = useState([]);
  const [silmeDialog, setSilmeDialog] = useState({ open: false, id: null });
  const navigate = useNavigate();

  useEffect(() => {
    fetchSozlesmeler();
  }, []);

  const fetchSozlesmeler = async () => {
    try {
      const q = query(collection(db, 'sozlesmeler'), orderBy('olusturmaTarihi', 'desc'));
      const querySnapshot = await getDocs(q);
      const sozlesmeList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSozlesmeler(sozlesmeList);
    } catch (error) {
      console.error('Sözleşmeler yüklenirken hata:', error);
    }
  };

  const handleYeniSozlesme = () => {
    navigate('/sozlesme/yeni');
  };

  const handleEdit = (id) => {
    navigate(`/sozlesme/duzenle/${id}`);
  };

  const handleDelete = async () => {
    if (!silmeDialog.id) return;

    try {
      await deleteDoc(doc(db, 'sozlesmeler', silmeDialog.id));
      setSilmeDialog({ open: false, id: null });
      // Listeyi yenile
      fetchSozlesmeler();
    } catch (error) {
      console.error('Sözleşme silinirken hata:', error);
    }
  };

  const getDurumChipColor = (durum) => {
    switch (durum) {
      case 'aktif':
        return 'success';
      case 'pasif':
        return 'error';
      case 'beklemede':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatTarih = (tarih) => {
    if (!tarih) return '-';
    try {
      return new Date(tarih.toDate()).toLocaleDateString('tr-TR');
    } catch (error) {
      return '-';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Sözleşme Listesi
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleYeniSozlesme}
        >
          Yeni Sözleşme
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sözleşme No</TableCell>
              <TableCell>Şantiye</TableCell>
              <TableCell>Taşeron</TableCell>
              <TableCell>İş Tanımı</TableCell>
              <TableCell>Sözleşme Tipi</TableCell>
              <TableCell>Tutar</TableCell>
              <TableCell>Başlangıç Tarihi</TableCell>
              <TableCell>Bitiş Tarihi</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sozlesmeler.map((sozlesme) => (
              <TableRow key={sozlesme.id}>
                <TableCell>{sozlesme.sozlesmeNo}</TableCell>
                <TableCell>{sozlesme.santiyeAdi || '-'}</TableCell>
                <TableCell>{sozlesme.taseronAdi || '-'}</TableCell>
                <TableCell>{sozlesme.isTanimi}</TableCell>
                <TableCell>{sozlesme.sozlesmeTipi}</TableCell>
                <TableCell>{sozlesme.tutar} TL</TableCell>
                <TableCell>{formatTarih(sozlesme.baslangicTarihi)}</TableCell>
                <TableCell>{formatTarih(sozlesme.bitisTarihi)}</TableCell>
                <TableCell>
                  <Chip 
                    label={sozlesme.durum} 
                    color={getDurumChipColor(sozlesme.durum)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    onClick={() => handleEdit(sozlesme.id)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => setSilmeDialog({ open: true, id: sozlesme.id })}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Silme Onay Dialog */}
      <Dialog
        open={silmeDialog.open}
        onClose={() => setSilmeDialog({ open: false, id: null })}
      >
        <DialogTitle>Sözleşme Silme</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bu sözleşmeyi silmek istediğinizden emin misiniz?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSilmeDialog({ open: false, id: null })}>İptal</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SozlesmeList;
