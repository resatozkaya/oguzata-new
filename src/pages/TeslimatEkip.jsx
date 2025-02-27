import React, { useState } from 'react';
import { Box, Grid, Button, Typography } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import BinaYapisiDuzenle from '../components/bina/BinaYapisiDuzenle';
import BinaGorunumu from '../components/bina/BinaGorunumu';
import { useSantiye } from '../contexts/SantiyeContext';

const TeslimatEkip = () => {
  const { seciliSantiye, seciliBlok, yenileVerileri } = useSantiye();

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <BinaGorunumu 
            blok={seciliBlok}
            santiye={seciliSantiye}
            onUpdate={yenileVerileri}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          {/* Eksiklikler listesi */}
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeslimatEkip; 