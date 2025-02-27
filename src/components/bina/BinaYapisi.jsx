import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Tooltip,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import BinaYapilandirma from './BinaYapilandirma';

// Özel stil tanımlamaları
const KatContainer = styled(Paper)(({ theme }) => ({
  backgroundColor: '#2c2c2c',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
}));

const DaireCard = styled(Paper)(({ tip }) => ({
  padding: '24px',
  textAlign: 'center',
  cursor: 'pointer',
  position: 'relative',
  minHeight: '100px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  transition: 'all 0.3s ease',
  backgroundColor: tip === 'ORTAK_ALAN' ? '#3d3d3d' : '#424242',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
  }
}));

const EksiklikBadge = styled('div')(({ color }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: color,
  position: 'absolute',
  bottom: 4,
  left: '50%',
  transform: 'translateX(-50%)',
}));

const BinaYapisi = ({ data, seciliSantiye, seciliBlok, onDaireSelect, loading }) => {
  const [binaData, setBinaData] = useState(data);
  const [yapilandirmaOpen, setYapilandirmaOpen] = useState(false);

  // Bina verisi değiştiğinde state'i güncelle
  useEffect(() => {
    if (data?.bloklar?.[0]?.katlar) {
      setBinaData(data);
    }
  }, [data]);

  // Daire tipine göre renk belirleme
  const getDaireRenk = (daire) => {
    if (daire.eksiklikler?.length > 0) {
      const kritikEksiklik = daire.eksiklikler.some(e => e.oncelik === 'YUKSEK');
      return kritikEksiklik ? '#ff5252' : '#ffb74d';
    }
    return '#4caf50'; // Eksiklik yoksa yeşil
  };

  // Daire tipi etiketini belirle
  const getDaireTipi = (daire) => {
    switch (daire.tip) {
      case 'ORTAK_ALAN':
        return { label: 'Ortak Alan', color: 'info' };
      case 'DAIRE':
        return { label: 'Daire', color: 'default' };
      default:
        return { label: daire.tip, color: 'default' };
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data?.bloklar?.[0]?.katlar) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography gutterBottom>
          Bu blok için bina yapısı bulunamadı
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3,
      backgroundColor: '#1e1e1e', 
      borderRadius: 3,
      height: '100%',
      minHeight: '600px',
      overflowY: 'auto'
    }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ color: '#fff' }}>
          {seciliBlok?.ad} Blok Görünümü
        </Typography>
        <Button
          variant="contained"
          onClick={() => setYapilandirmaOpen(true)}
          disabled={!seciliSantiye?.id || !seciliBlok?.ad}
          sx={{ 
            backgroundColor: '#388e3c',
            padding: '10px 24px',
            fontSize: '1.1rem'
          }}
        >
          Düzenle
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {data.bloklar[0].katlar.map((kat, katIndex) => (
          <KatContainer key={katIndex}>
            <Typography 
              variant="h6"
              gutterBottom 
              sx={{ 
                color: '#fff', 
                borderBottom: '2px solid #444', 
                pb: 1,
                mb: 2 
              }}
            >
              {kat.no === '0' ? 'Zemin Kat' : 
               kat.no.toString().startsWith('B') ? `${kat.no}. Bodrum` : 
               `${kat.no}. Kat`}
            </Typography>
            
            <Grid container spacing={2}>
              {kat.daireler?.map((daire, daireIndex) => (
                <Grid item xs={6} sm={6} md={4} key={daireIndex}>
                  <Tooltip title={`${daire.eksiklikler?.length || 0} eksiklik`}>
                    <DaireCard
                      tip={daire.tip}
                      onClick={() => onDaireSelect(daire)}
                      sx={{ minHeight: '80px' }}
                    >
                      <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                        {daire.no}
                      </Typography>
                      
                      <Chip
                        label={getDaireTipi(daire).label}
                        color={getDaireTipi(daire).color}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />

                      {daire.eksiklikler?.length > 0 && (
                        <EksiklikBadge color={getDaireRenk(daire)} />
                      )}
                    </DaireCard>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </KatContainer>
        ))}
      </Box>

      <BinaYapilandirma
        open={yapilandirmaOpen}
        onClose={() => setYapilandirmaOpen(false)}
        binaYapisi={binaData}
        setBinaYapisi={setBinaData}
        seciliSantiye={seciliSantiye}
        seciliBlok={seciliBlok}
        onSave={async (yeniYapi) => {
          setBinaData(yeniYapi);
          setYapilandirmaOpen(false);
        }}
      />
    </Box>
  );
};

export default BinaYapisi; 