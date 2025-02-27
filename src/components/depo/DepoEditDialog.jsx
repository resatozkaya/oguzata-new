import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box
} from '@mui/material';
import { useDepo } from '../../contexts/DepoContext';
import { depoService } from '../../services/depoService';

const DepoEditDialog = ({ open, onClose, depo }) => {
  const { depolar, setDepolar } = useDepo();
  const [depoAdi, setDepoAdi] = useState(depo?.ad || '');
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!depoAdi.trim() || !depo?.id) return;

    try {
      setYukleniyor(true);
      await depoService.depoGuncelle(depo.id, {
        ad: depoAdi.trim(),
        guncellemeTarihi: new Date()
      });

      // Depolar listesini güncelle
      const yeniDepolar = depolar.map(d => 
        d.id === depo.id ? { ...d, ad: depoAdi.trim() } : d
      );
      setDepolar(yeniDepolar);
      onClose();
    } catch (error) {
      console.error('Depo güncellenirken hata:', error);
      alert('Depo güncellenirken bir hata oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Depo Düzenle</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              label="Depo Adı"
              value={depoAdi}
              onChange={(e) => setDepoAdi(e.target.value)}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>İptal</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={!depoAdi.trim() || yukleniyor}
          >
            Güncelle
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DepoEditDialog; 