import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  IconButton
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import { binaService } from '../../services/binaService';
import { enqueueSnackbar } from 'notistack';

const BlokYonetimDialog = ({ open, onClose, santiye, onUpdate }) => {
  const [editingBlok, setEditingBlok] = useState(null);
  const [yeniAd, setYeniAd] = useState('');

  const handleEditClick = (blok) => {
    setEditingBlok(blok);
    setYeniAd(blok.ad);
  };

  const handleSave = async (blok) => {
    try {
      await binaService.blokGuncelle(santiye.id, blok.id, yeniAd);
      enqueueSnackbar('Blok başarıyla güncellendi', { variant: 'success' });
      setEditingBlok(null);
      setYeniAd('');
      onClose(); // Dialog'u kapat
      onUpdate(); // Listeyi yenile
    } catch (error) {
      console.error('Blok güncellenirken hata:', error);
      enqueueSnackbar('Blok güncellenirken hata oluştu: ' + error.message, { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Blok Yönetimi</DialogTitle>
      <DialogContent>
        <List>
          {santiye?.bloklar?.map((blok) => (
            <ListItem key={blok.id}>
              {editingBlok?.id === blok.id ? (
                <TextField
                  fullWidth
                  value={yeniAd}
                  onChange={(e) => setYeniAd(e.target.value)}
                  size="small"
                />
              ) : (
                <ListItemText primary={blok.ad} />
              )}
              <ListItemSecondaryAction>
                {editingBlok?.id === blok.id ? (
                  <IconButton onClick={() => handleSave(blok)} color="primary">
                    <SaveIcon />
                  </IconButton>
                ) : (
                  <IconButton onClick={() => handleEditClick(blok)} color="primary">
                    <EditIcon />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Kapat</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BlokYonetimDialog; 