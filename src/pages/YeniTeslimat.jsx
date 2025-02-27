import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

const YeniTeslimat = () => {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Yeni Teslimat</Typography>
      
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Form içeriği buraya gelecek */}
          <Grid item xs={12}>
            <Typography variant="body1">Yeni teslimat formu yakında eklenecek...</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default YeniTeslimat;
