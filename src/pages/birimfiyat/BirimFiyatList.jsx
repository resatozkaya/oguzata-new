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

const BirimFiyatList = () => {
  const [birimFiyatlar, setBirimFiyatlar] = useState([]);
  const [silmeDialog, setSilmeDialog] = useState({ open: false, id: null });
  const navigate = useNavigate();

  useEffect(() => {
    fetchBirimFiyatlar();
  }, []);

  const fetchBirimFiyatlar = async () => {
    try {
      const q = query(collection(db, 'birimFiyatlar'), orderBy('olusturmaTarihi', 'desc'));
      const querySnapshot = await getDocs(q);
      const birimFiyatList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBirimFiyatlar(birimFiyatList);
    } catch (error) {
      console.error('Birim fiyatlar yüklenirken hata:', error);
    }
  };

  const handleYeniBirimFiyat = () => {
    navigate('/birim-fiyatlar/yeni');
  };

  const handleEdit = (id) => {
    navigate(`/birim-fiyatlar/duzenle/${id}`);
  };

  const handleDelete = async () => {
    if (!silmeDialog.id) return;

    try {
      await deleteDoc(doc(db, 'birimFiyatlar', silmeDialog.id));
      setSilmeDialog({ open: false, id: null });
      // Listeyi yenile
      fetchBirimFiyatlar();
    } catch (error) {
      console.error('Birim fiyat silinirken hata:', error);
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
          Birim Fiyat Listesi
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleYeniBirimFiyat}
        >
          Yeni Birim Fiyat
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Poz No</TableCell>
              <TableCell>İş Kalemi</TableCell>
              <TableCell>Birim</TableCell>
              <TableCell>Birim Fiyat</TableCell>
              <TableCell>Şantiye</TableCell>
              <TableCell>Taşeron</TableCell>
              <TableCell>Geçerlilik Tarihi</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {birimFiyatlar.map((birimFiyat) => (
              <TableRow key={birimFiyat.id}>
                <TableCell>{birimFiyat.pozNo}</TableCell>
                <TableCell>{birimFiyat.isKalemi}</TableCell>
                <TableCell>{birimFiyat.birim}</TableCell>
                <TableCell>{birimFiyat.birimFiyat} TL</TableCell>
                <TableCell>{birimFiyat.santiyeAdi || '-'}</TableCell>
                <TableCell>{birimFiyat.taseronAdi || '-'}</TableCell>
                <TableCell>{formatTarih(birimFiyat.gecerlilikTarihi)}</TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    onClick={() => handleEdit(birimFiyat.id)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => setSilmeDialog({ open: true, id: birimFiyat.id })}
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
        <DialogTitle>Birim Fiyat Silme</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bu birim fiyatı silmek istediğinizden emin misiniz?
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

export default BirimFiyatList;
