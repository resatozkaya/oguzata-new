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

const DepoEkleDialog = ({ open, onClose, santiyeId }) => {
  const { depolar, setDepolar } = useDepo();
  const [depoAdi, setDepoAdi] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!depoAdi.trim() || !santiyeId) return;

    try {
      setYukleniyor(true);
      const yeniDepo = await depoService.depoEkle(santiyeId, {
        ad: depoAdi.trim(),
        olusturmaTarihi: new Date()
      });

      setDepolar([...depolar, yeniDepo]);
      setDepoAdi('');
      onClose();
    } catch (error) {
      console.error('Depo eklenirken hata:', error);
      alert('Depo eklenirken bir hata oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Yeni Depo Ekle</DialogTitle>
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
            Ekle
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DepoEkleDialog; 