import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';

const TeslimatListesi = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Teslimat Listesi</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/yeni-teslimat')}
        >
          Yeni Teslimat
        </Button>
      </Box>

      {/* Teslimat listesi içeriği buraya gelecek */}
      <Typography variant="body1">Teslimat listesi yakında eklenecek...</Typography>
    </Box>
  );
};

export default TeslimatListesi;
