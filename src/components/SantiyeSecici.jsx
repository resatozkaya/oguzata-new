import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useSantiye } from '../contexts/SantiyeContext';
import { useTheme } from '@mui/material/styles';

const SantiyeSecici = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const {
    santiyeler,
    seciliSantiye,
    setSeciliSantiye,
    seciliBlok,
    setSeciliBlok,
  } = useSantiye();

  const handleSantiyeChange = (event) => {
    const secilenSantiye = santiyeler.find(s => s.id === event.target.value);
    if (secilenSantiye) {
      setSeciliSantiye(secilenSantiye);
      setSeciliBlok(null);
    }
  };

  const handleBlokChange = (event) => {
    if (!seciliSantiye) return;
    const secilenBlok = seciliSantiye.bloklar?.find(b => b.id === event.target.value);
    if (secilenBlok) {
      setSeciliBlok(secilenBlok);
    }
  };

  const selectStyles = {
    minWidth: 200,
    '& .MuiInputLabel-root': {
      color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
    },
    '& .MuiOutlinedInput-root': {
      color: isDarkMode ? '#fff' : 'inherit',
      '& fieldset': {
        borderColor: isDarkMode ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
      },
      '&:hover fieldset': {
        borderColor: isDarkMode ? '#2196f3' : '#1976d2',
      },
      '&.Mui-focused fieldset': {
        borderColor: isDarkMode ? '#2196f3' : '#1976d2',
      },
    },
    '& .MuiSelect-icon': {
      color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
    },
  };

  const menuProps = {
    PaperProps: {
      sx: {
        bgcolor: isDarkMode ? '#1e1e1e' : '#ffffff',
        '& .MuiMenuItem-root': {
          color: isDarkMode ? '#fff' : 'inherit',
          '&:hover': {
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
          },
          '&.Mui-selected': {
            bgcolor: isDarkMode ? 'rgba(33,150,243,0.16)' : 'rgba(25,118,210,0.08)',
            '&:hover': {
              bgcolor: isDarkMode ? 'rgba(33,150,243,0.24)' : 'rgba(25,118,210,0.12)',
            },
          },
        },
      },
    },
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 2, 
      alignItems: 'center',
      mb: 2,
      p: 2,
      bgcolor: isDarkMode ? '#1e1e1e' : '#ffffff',
      borderRadius: 1,
      boxShadow: 1,
      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
    }}>
      {/* Şantiye Seçici */}
      <FormControl sx={selectStyles}>
        <InputLabel>Şantiye</InputLabel>
        <Select
          value={seciliSantiye?.id || ''}
          onChange={handleSantiyeChange}
          label="Şantiye"
          MenuProps={menuProps}
        >
          {santiyeler.map((santiye) => (
            <MenuItem key={santiye.id} value={santiye.id}>
              {santiye.ad}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Blok Seçici */}
      <FormControl sx={selectStyles}>
        <InputLabel>Blok</InputLabel>
        <Select
          value={seciliBlok?.id || ''}
          onChange={handleBlokChange}
          label="Blok"
          disabled={!seciliSantiye}
          MenuProps={menuProps}
        >
          {seciliSantiye?.bloklar?.filter(blok => blok && (blok.id || blok.ad))?.map((blok) => (
            <MenuItem key={blok.id} value={blok.id}>
              {blok.ad}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default SantiyeSecici;
