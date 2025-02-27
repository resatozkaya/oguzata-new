import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSantiye } from '../../contexts/SantiyeContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import teslimatEkipService from '../../services/teslimatEkipService';

const TeslimatEkipYonetimi = () => {
  const { seciliSantiye } = useSantiye();
  const { showSnackbar } = useSnackbar();
  const [ekipler, setEkipler] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEkip, setEditingEkip] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (seciliSantiye) {
      ekipleriYukle();
    }
  }, [seciliSantiye]);

  const ekipleriYukle = async () => {
    try {
      setLoading(true);
      const data = await teslimatEkipService.ekipleriGetir(seciliSantiye.id);
      setEkipler(data);
    } catch (error) {
      showSnackbar('Ekipler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!seciliSantiye) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Lütfen önce bir şantiye seçin
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Teslimat Ekipleri
      </Typography>
      {/* Ekip listesi ve form kodları buraya gelecek */}
    </Box>
  );
};

export default TeslimatEkipYonetimi; 