import React, { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import BinaYapisiDuzenle from './BinaYapisiDuzenle';
import { useTheme } from '../../contexts/ThemeContext';

const BinaGorunumu = ({ blok, santiye, onUpdate }) => {
  const [duzenleDialogAcik, setDuzenleDialogAcik] = useState(false);
  const { isDarkMode } = useTheme();

  if (!blok?.katlar) return (
    <Paper sx={{ p: 2, textAlign: 'center' }}>
      <Typography>Lütfen bir şantiye ve blok seçin</Typography>
    </Paper>
  );

  return (
    <Box>
      {/* Başlık ve Düzenleme Butonu */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        p: 2,
        bgcolor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
        borderRadius: 1,
        boxShadow: 1
      }}>
        <Typography variant="h6" sx={{ color: isDarkMode ? '#2196f3' : '#1976d2' }}>
          {blok?.ad} Blok - Bina Yapısı
        </Typography>
        <Button
          startIcon={<EditIcon />}
          onClick={() => setDuzenleDialogAcik(true)}
          variant="contained"
          color="secondary"
        >
          Yapıyı Düzenle
        </Button>
      </Box>

      {/* Katlar */}
      {blok?.katlar?.map((kat, index) => (
        <Box
          key={index}
          sx={{
            mb: 2,
            p: 2,
            bgcolor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
            borderRadius: 1,
            borderLeft: `4px solid ${isDarkMode ? '#2196f3' : '#1976d2'}`,
            boxShadow: 1
          }}
        >
          <Typography sx={{ color: isDarkMode ? '#2196f3' : '#1976d2', mb: 1 }}>
            {kat.no}. Kat
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {kat.daireler?.map((daire, i) => (
              <Box
                key={i}
                sx={{
                  p: 1,
                  bgcolor: isDarkMode ? '#263238' : '#e3f2fd',
                  borderRadius: 1,
                  minWidth: 80,
                  textAlign: 'center',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                }}
              >
                <Typography sx={{ color: isDarkMode ? 'white' : 'rgba(0,0,0,0.87)' }}>
                  {daire.no}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ))}

      {/* Düzenleme Dialog'u */}
      <BinaYapisiDuzenle
        open={duzenleDialogAcik}
        onClose={() => setDuzenleDialogAcik(false)}
        santiye={santiye}
        blok={blok}
        onUpdate={() => {
          onUpdate?.();
          setDuzenleDialogAcik(false);
        }}
      />
    </Box>
  );
};

export default BinaGorunumu;