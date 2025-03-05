import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

const DURUM_SECENEKLERI = [
  { value: 'YENI', label: 'Yeni' },
  { value: 'DEVAM_EDIYOR', label: 'Devam Ediyor' },
  { value: 'TAMAMLANDI', label: 'Tamamlandı' },
  { value: 'BEKLEMEDE', label: 'Beklemede' }
];

const ONCELIK_SECENEKLERI = [
  { value: 'DUSUK', label: 'Düşük' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'YUKSEK', label: 'Yüksek' },
  { value: 'KRITIK', label: 'Kritik' }
];

const EksiklikFiltrele = ({ filtreler, setFiltreler, taseronlar = [] }) => {
  const handleChange = (field, value) => {
    setFiltreler(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTemizle = () => {
    setFiltreler({
      kategori: '',
      taseron: '',
      durum: '',
      oncelik: '',
      daire: ''
    });
  };

  const aktifFiltreSayisi = Object.values(filtreler).filter(Boolean).length;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon />
          <Box>Filtrele</Box>
          {aktifFiltreSayisi > 0 && (
            <Chip 
              size="small" 
              label={`${aktifFiltreSayisi} aktif filtre`}
              color="primary"
            />
          )}
        </Box>
        {aktifFiltreSayisi > 0 && (
          <Tooltip title="Filtreleri Temizle">
            <IconButton onClick={handleTemizle} size="small">
              <ClearIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Durum</InputLabel>
            <Select
              value={filtreler.durum}
              label="Durum"
              onChange={(e) => handleChange('durum', e.target.value)}
            >
              <MenuItem value="">Tümü</MenuItem>
              {DURUM_SECENEKLERI.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Öncelik</InputLabel>
            <Select
              value={filtreler.oncelik}
              label="Öncelik"
              onChange={(e) => handleChange('oncelik', e.target.value)}
            >
              <MenuItem value="">Tümü</MenuItem>
              {ONCELIK_SECENEKLERI.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Taşeron</InputLabel>
            <Select
              value={filtreler.taseron}
              label="Taşeron"
              onChange={(e) => handleChange('taseron', e.target.value)}
            >
              <MenuItem value="">Tümü</MenuItem>
              {taseronlar.map(taseron => (
                <MenuItem key={taseron.id} value={taseron.id}>
                  {taseron.id.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            size="small"
            label="Daire No"
            value={filtreler.daire}
            onChange={(e) => handleChange('daire', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default EksiklikFiltrele;