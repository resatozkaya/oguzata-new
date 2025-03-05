import React, { useState } from 'react';
import { Box, Grid, Button, Typography, Paper } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import BinaYapisiDuzenle from '../components/bina/BinaYapisiDuzenle';
import BinaGorunumu from '../components/bina/BinaGorunumu';
import { useSantiye } from '../contexts/SantiyeContext';
import { useTheme } from '../contexts/ThemeContext';

const TeslimatEkip = () => {
  const { seciliSantiye, seciliBlok, yenileVerileri } = useSantiye();
  const { isDarkMode } = useTheme();

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 2, 
            bgcolor: isDarkMode ? '#1e1e1e' : '#ffffff',
            borderRadius: 1,
            boxShadow: 1
          }}>
            <BinaGorunumu 
              blok={seciliBlok}
              santiye={seciliSantiye}
              onUpdate={yenileVerileri}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          {/* Eksiklikler listesi */}
          <Paper sx={{ 
            p: 2, 
            bgcolor: isDarkMode ? '#1e1e1e' : '#ffffff',
            borderRadius: 1,
            boxShadow: 1,
            minHeight: 400
          }}>
            <Typography variant="h6" sx={{ 
              color: isDarkMode ? '#2196f3' : '#1976d2',
              mb: 2 
            }}>
              Eksiklikler
            </Typography>
            {/* Eksiklikler listesi içeriği buraya gelecek */}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeslimatEkip;