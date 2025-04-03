import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useSantiye } from '../../../contexts/SantiyeContext';

const MasrafBeyanForm = ({ open, onClose }) => {
  const { currentUser } = useAuth();
  const { selectedSantiye } = useSantiye();
  const [loading, setLoading] = useState(false);
  const [kalemler, setKalemler] = useState([
    { aciklama: '', miktar: 1, birimFiyat: 0 }
  ]);

  const handleKalemChange = (index, field, value) => {
    const yeniKalemler = [...kalemler];
    yeniKalemler[index][field] = field === 'aciklama' ? value : Number(value);
    setKalemler(yeniKalemler);
  };

  const handleKalemEkle = () => {
    setKalemler([...kalemler, { aciklama: '', miktar: 1, birimFiyat: 0 }]);
  };

  const handleKalemSil = (index) => {
    const yeniKalemler = kalemler.filter((_, i) => i !== index);
    setKalemler(yeniKalemler);
  };

  const toplamTutar = kalemler.reduce((toplam, kalem) => {
    return toplam + (kalem.miktar * kalem.birimFiyat);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSantiye) {
      alert('Lütfen bir şantiye seçin');
      return;
    }

    if (kalemler.some(kalem => !kalem.aciklama || kalem.birimFiyat <= 0)) {
      alert('Lütfen tüm masraf kalemlerini doldurun');
      return;
    }

    setLoading(true);

    try {
      const masrafData = {
        santiye: selectedSantiye,
        createdAt: serverTimestamp(),
        tarih: serverTimestamp(),
        hazirlayan: {
          id: currentUser.uid,
          ad: currentUser.name ? `${currentUser.name} ${currentUser.surname || ''}` : currentUser.email
        },
        kalemler: kalemler.map(kalem => ({
          ...kalem,
          miktar: Number(kalem.miktar),
          birimFiyat: Number(kalem.birimFiyat),
          tutar: Number(kalem.miktar) * Number(kalem.birimFiyat)
        })),
        toplamTutar: Number(toplamTutar.toFixed(2)),
        durumu: 'BEKLEMEDE',
        odemeDurumu: 'Ödenmedi'
      };

      await addDoc(collection(db, 'masrafBeyanlar'), masrafData);
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Masraf beyanı kaydedilirken hata:', error);
      alert('Masraf beyanı kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Yeni Masraf Beyanı</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Açıklama</TableCell>
                      <TableCell align="right">Miktar</TableCell>
                      <TableCell align="right">Birim Fiyat (₺)</TableCell>
                      <TableCell align="right">Toplam (₺)</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {kalemler.map((kalem, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={kalem.aciklama}
                            onChange={(e) => handleKalemChange(index, 'aciklama', e.target.value)}
                            placeholder="Masraf açıklaması"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={kalem.miktar}
                            onChange={(e) => handleKalemChange(index, 'miktar', e.target.value)}
                            inputProps={{ min: 1, step: 1 }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={kalem.birimFiyat}
                            onChange={(e) => handleKalemChange(index, 'birimFiyat', e.target.value)}
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {(kalem.miktar * kalem.birimFiyat).toLocaleString('tr-TR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleKalemSil(index)}
                            disabled={kalemler.length === 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleKalemEkle}
                >
                  Masraf Kalemi Ekle
                </Button>
                <Typography variant="h6">
                  Toplam: {toplamTutar.toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ₺
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MasrafBeyanForm; 