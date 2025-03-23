import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import BinaYapisiDuzenle from './BinaYapisiDuzenle';
import { useTheme } from '../../contexts/ThemeContext';

const BinaGorunumu = ({ blok, santiye, onUpdate }) => {
  const [duzenleDialogAcik, setDuzenleDialogAcik] = useState(false);
  const { isDarkMode } = useTheme();
  const [katlar, setKatlar] = useState([]);

  useEffect(() => {
    if (blok?.katlar) {
      const siraliKatlar = [...blok.katlar].sort((a, b) => {
        const getKatNo = (no) => {
          if (typeof no === 'string' && no.startsWith('B')) return -parseInt(no.slice(1));
          if (no === '0') return 0;
          return parseInt(no);
        };
        return getKatNo(b.no) - getKatNo(a.no);
      });
      setKatlar(siraliKatlar);
    }
  }, [blok?.katlar]);

  if (!blok?.katlar) return (
    <Paper sx={{ p: 2, textAlign: 'center' }}>
      <Typography>Lütfen bir şantiye ve blok seçin</Typography>
    </Paper>
  );

  const getKatAdi = (kat) => {
    // Önce Firebase'den gelen özel adı kontrol et
    if (kat.ad && kat.ad.trim() !== '') {
      return kat.ad;
    }

    // Özel ad yoksa, tip ve numaraya göre varsayılan ad oluştur
    switch (kat.tip) {
      case 'BODRUM':
        return `${kat.no}. Bodrum Kat`;
      case 'ZEMIN':
        return 'Zemin Kat';
      case 'CATI':
        return 'Çatı Katı';
      case 'ARA':
        return 'Ara Kat';
      default:
        return `${kat.no}. Normal Kat`;
    }
  };

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
      {katlar.map((kat) => (
        <Box
          key={kat.no}
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
            {getKatAdi(kat)}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {kat.daireler?.map((daire) => (
              <Box
                key={daire.no}
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