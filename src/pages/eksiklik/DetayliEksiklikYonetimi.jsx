import React, { useState, useEffect } from 'react';
import { Box, Grid } from '@mui/material';
import BinaYapisiContainer from '../../components/bina/BinaYapisiContainer';
import SantiyeSecici from '../../components/SantiyeSecici';
import { useSantiye } from '../../contexts/SantiyeContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { binaService } from '../../services/binaService';

const DetayliEksiklikYonetimi = () => {
  const { showSnackbar } = useSnackbar();
  const { seciliSantiye, seciliBlok, setSantiyeler } = useSantiye();
  const [selectedDaire, setSelectedDaire] = useState(null);

  // Daire seçildiğinde
  const handleDaireSelect = (daire) => {
    setSelectedDaire(daire);
  };

  // Yeni blok ekleme
  const handleYeniBlokEkle = async (yeniBlok) => {
    try {
      await binaService.yeniBlokOlustur(seciliSantiye.id, yeniBlok.ad);
      const data = await binaService.getSantiyeler();
      setSantiyeler(data);
      showSnackbar('Yeni blok başarıyla eklendi', 'success');
    } catch (error) {
      console.error('Blok eklenirken hata:', error);
      showSnackbar('Blok eklenirken hata oluştu', 'error');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <SantiyeSecici
        onYeniBlokEkle={handleYeniBlokEkle}
        setSantiyeler={setSantiyeler}
      />

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          {seciliSantiye && seciliBlok && (
            <BinaYapisiContainer
              santiyeId={seciliSantiye.id}
              blokId={seciliBlok.ad} // Burada blokId olarak blok.ad kullanılmalı
              onDaireSelect={handleDaireSelect}
            />
          )}
        </Grid>

        <Grid item xs={12} md={8}>
          {/* Sağ taraftaki eksiklik listesi buraya gelecek */}
          {selectedDaire && (
            <Box>
              {/* Seçili dairenin eksiklik listesi */}
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DetayliEksiklikYonetimi; 