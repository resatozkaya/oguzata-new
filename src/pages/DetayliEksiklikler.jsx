import React, { useState } from 'react';
import { Box, Grid, Button, Typography } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import BinaYapisiDuzenle from '../components/bina/BinaYapisiDuzenle';
import { useSantiye } from '../contexts/SantiyeContext';

const DetayliEksiklikler = () => {
  const { seciliSantiye, seciliBlok, yenileVerileri } = useSantiye();
  const [duzenleDialogAcik, setDuzenleDialogAcik] = useState(false);

  return (
    <Box>
      {/* Bina Görünümü Başlığı ve Düzenleme Butonu */}
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
          {seciliBlok?.ad} Blok - Bina Yapısı
        </Typography>
        <Button
          startIcon={<EditIcon />}
          onClick={() => setDuzenleDialogAcik(true)}
          variant="contained"
          color="secondary"
          sx={{ bgcolor: 'purple' }}
        >
          Bina Yapısını Düzenle
        </Button>
      </Box>

      {/* Bina Görünümü ve Eksiklikler */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          {/* Bina Görünümü */}
          <Box>
            {seciliBlok?.katlar?.map((kat, index) => (
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
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          {/* Eksiklikler Listesi */}
        </Grid>
      </Grid>

      {/* Bina Yapısı Düzenleme Dialog'u */}
      <BinaYapisiDuzenle
        open={duzenleDialogAcik}
        onClose={() => setDuzenleDialogAcik(false)}
        santiye={seciliSantiye}
        blok={seciliBlok}
        onUpdate={() => {
          yenileVerileri();
          setDuzenleDialogAcik(false);
        }}
      />
    </Box>
  );
};

export default DetayliEksiklikler; 