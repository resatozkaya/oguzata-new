import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Box,
  Grid,
  Typography,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useSantiye } from '../../../contexts/SantiyeContext';
import { PARA_BIRIMLERI } from '../../../types/masrafBeyan';
import { formatCurrency } from '../../../utils/format';
import { NumericFormat } from 'react-number-format';

const MasrafBeyanForm = ({ open, masrafBeyan, onClose, onSave }) => {
  const { santiyeler } = useSantiye();
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    santiyeGruplari: []
  });

  useEffect(() => {
    if (masrafBeyan) {
      setFormData({
        santiyeGruplari: [{
          santiyeId: masrafBeyan.santiyeId,
          santiyeAdi: masrafBeyan.santiyeAdi,
          aciklama: masrafBeyan.aciklama || '',
          masraflar: masrafBeyan.masraflar || []
        }]
      });
    } else {
      setFormData({
        santiyeGruplari: [{
          santiyeId: '',
          santiyeAdi: '',
          aciklama: '',
          masraflar: [createEmptyMasrafKalemi()]
        }]
      });
    }
  }, [masrafBeyan]);

  const createEmptyMasrafKalemi = () => ({
    id: Date.now().toString(),
    tarih: new Date().toISOString().split('T')[0],
    aciklama: '',
    tutar: '',
    paraBirimi: 'TL'
  });

  const handleSantiyeChange = (grupIndex, event) => {
    const secilenSantiye = santiyeler.find(s => s.id === event.target.value);
    const yeniGruplar = [...formData.santiyeGruplari];
    yeniGruplar[grupIndex] = {
      ...yeniGruplar[grupIndex],
      santiyeId: secilenSantiye.id,
      santiyeAdi: secilenSantiye.ad
    };
    setFormData(prev => ({ ...prev, santiyeGruplari: yeniGruplar }));
  };

  const handleMasrafChange = (grupIndex, masrafIndex, field, value) => {
    const yeniGruplar = [...formData.santiyeGruplari];
    const yeniMasraflar = [...yeniGruplar[grupIndex].masraflar];
    
    // Tutar alanı için özel işlem
    if (field === 'tutar') {
      value = parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0;
    }
    
    yeniMasraflar[masrafIndex] = {
      ...yeniMasraflar[masrafIndex],
      [field]: value
    };
    
    yeniGruplar[grupIndex] = {
      ...yeniGruplar[grupIndex],
      masraflar: yeniMasraflar
    };
    
    setFormData(prev => ({
      ...prev,
      santiyeGruplari: yeniGruplar
    }));
  };

  const handleMasrafEkle = (grupIndex) => {
    const yeniGruplar = [...formData.santiyeGruplari];
    yeniGruplar[grupIndex].masraflar.push(createEmptyMasrafKalemi());
    setFormData(prev => ({
      ...prev,
      santiyeGruplari: yeniGruplar
    }));
  };

  const handleMasrafSil = (grupIndex, masrafIndex) => {
    const yeniGruplar = [...formData.santiyeGruplari];
    if (yeniGruplar[grupIndex].masraflar.length === 1) {
      enqueueSnackbar('En az bir masraf kalemi olmalıdır', { variant: 'warning' });
      return;
    }
    yeniGruplar[grupIndex].masraflar = yeniGruplar[grupIndex].masraflar.filter((_, i) => i !== masrafIndex);
    setFormData(prev => ({
      ...prev,
      santiyeGruplari: yeniGruplar
    }));
  };

  const handleSantiyeGrubuEkle = () => {
    setFormData(prev => ({
      ...prev,
      santiyeGruplari: [
        ...prev.santiyeGruplari,
        {
          santiyeId: '',
          santiyeAdi: '',
          aciklama: '',
          masraflar: [createEmptyMasrafKalemi()]
        }
      ]
    }));
  };

  const hesaplaSantiyeToplamTutar = (masraflar) => {
    return masraflar.reduce((toplam, masraf) => {
      const tutar = parseFloat(masraf.tutar) || 0;
      return toplam + tutar;
    }, 0);
  };

  const hesaplaGenelToplamTutar = () => {
    return formData.santiyeGruplari.reduce((toplam, grup) => {
      return toplam + hesaplaSantiyeToplamTutar(grup.masraflar);
    }, 0);
  };

  const handleSubmit = () => {
    // Validasyon
    for (const grup of formData.santiyeGruplari) {
      if (!grup.santiyeId) {
        enqueueSnackbar('Lütfen tüm şantiyeleri seçiniz', { variant: 'error' });
        return;
      }

      if (!grup.masraflar.every(m => m.aciklama && m.tutar)) {
        enqueueSnackbar('Lütfen tüm masraf kalemlerini doldurunuz', { variant: 'error' });
        return;
      }
    }

    // Her şantiye için ayrı masraf beyanı oluştur
    formData.santiyeGruplari.forEach(grup => {
      const masraflar = grup.masraflar.map(m => ({
        ...m,
        tutar: parseFloat(m.tutar)
      }));

      onSave({
        santiyeId: grup.santiyeId,
        santiyeAdi: grup.santiyeAdi,
        aciklama: grup.aciklama,
        masraflar
      });
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          '@media print': {
            width: '100%',
            height: 'auto',
            overflow: 'visible'
          }
        }
      }}
    >
      <DialogTitle>
        Masraf Beyanı
        <Box sx={{ position: 'absolute', right: 8, top: 8, display: 'flex', gap: 1 }}>
          <IconButton onClick={handlePrint} title="Yazdır">
            <PrintIcon />
          </IconButton>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {formData.santiyeGruplari.map((grup, grupIndex) => (
            <Box key={grupIndex} sx={{ mb: 4 }}>
              {/* Şantiye Başlığı */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Şantiye</InputLabel>
                    <Select
                      value={grup.santiyeId}
                      onChange={(e) => handleSantiyeChange(grupIndex, e)}
                      label="Şantiye"
                    >
                      {santiyeler.map((santiye) => (
                        <MenuItem key={santiye.id} value={santiye.id}>
                          {santiye.ad}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Açıklama"
                    value={grup.aciklama}
                    onChange={(e) => {
                      const yeniGruplar = [...formData.santiyeGruplari];
                      yeniGruplar[grupIndex].aciklama = e.target.value;
                      setFormData(prev => ({ ...prev, santiyeGruplari: yeniGruplar }));
                    }}
                  />
                </Grid>
              </Grid>

              {/* Masraf Tablosu */}
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tarih</TableCell>
                      <TableCell>Açıklama</TableCell>
                      <TableCell align="right">Tutar</TableCell>
                      <TableCell align="center">Para Birimi</TableCell>
                      <TableCell align="center">İşlem</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {grup.masraflar.map((masraf, masrafIndex) => (
                      <TableRow key={masraf.id}>
                        <TableCell>
                          <TextField
                            type="date"
                            value={masraf.tarih}
                            onChange={(e) => handleMasrafChange(grupIndex, masrafIndex, 'tarih', e.target.value)}
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={masraf.aciklama}
                            onChange={(e) => handleMasrafChange(grupIndex, masrafIndex, 'aciklama', e.target.value)}
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell align="right">
                          <NumericFormat
                            customInput={TextField}
                            value={masraf.tutar}
                            onValueChange={(values) => {
                              handleMasrafChange(grupIndex, masrafIndex, 'tutar', values.value);
                            }}
                            thousandSeparator={true}
                            decimalScale={2}
                            fixedDecimalScale={true}
                            allowNegative={false}
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Select
                            value={masraf.paraBirimi}
                            onChange={(e) => handleMasrafChange(grupIndex, masrafIndex, 'paraBirimi', e.target.value)}
                            size="small"
                            sx={{ minWidth: 80 }}
                          >
                            {Object.entries(PARA_BIRIMLERI).map(([key, value]) => (
                              <MenuItem key={key} value={key}>
                                {value}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            onClick={() => handleMasrafSil(grupIndex, masrafIndex)}
                            size="small"
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

              {/* Masraf Ekle Butonu */}
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleMasrafEkle(grupIndex)}
                sx={{ mb: 2 }}
              >
                Masraf Ekle
              </Button>

              <Divider sx={{ my: 3 }} />
            </Box>
          ))}

          {/* Yeni Şantiye Grubu Ekle */}
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleSantiyeGrubuEkle}
            sx={{ mb: 2 }}
          >
            Yeni Şantiye Ekle
          </Button>

          {/* Genel Toplam */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Typography variant="h6">
              Genel Toplam: {formatCurrency(hesaplaGenelToplamTutar(), 'TL')}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Kaydet
        </Button>
      </DialogActions>

      <style>
        {`
          @media print {
            .masraf-tablosu th, .masraf-tablosu td {
              border: 1px solid #ddd !important;
              padding: 8px !important;
            }
            .MuiDialog-paper {
              box-shadow: none !important;
            }
            .MuiIconButton-root {
              display: none !important;
            }
          }
        `}
      </style>
    </Dialog>
  );
};

export default MasrafBeyanForm; 