import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import BinaYapisiDuzenle from './BinaYapisiDuzenle';

const BinaGorunumu = ({ blok, santiye, onUpdate }) => {
  const [duzenleDialogAcik, setDuzenleDialogAcik] = useState(false);

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
        bgcolor: '#1e1e1e',
        borderRadius: 1
      }}>
        <Typography variant="h6" sx={{ color: '#2196f3' }}>
          {blok?.ad} Blok - Bina Yapısı
        </Typography>
        <Button
          startIcon={<EditIcon />}
          onClick={() => setDuzenleDialogAcik(true)}
          variant="contained"
          color="secondary"
          sx={{ bgcolor: 'purple' }}
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
            bgcolor: '#1e1e1e',
            borderRadius: 1,
            borderLeft: '4px solid #2196f3'
          }}
        >
          <Typography sx={{ color: '#2196f3', mb: 1 }}>
            {kat.no}. Kat
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {kat.daireler?.map((daire, i) => (
              <Box
                key={i}
                sx={{
                  p: 1,
                  bgcolor: '#263238',
                  borderRadius: 1,
                  minWidth: 80,
                  textAlign: 'center'
                }}
              >
                <Typography sx={{ color: 'white' }}>
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