import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { eksiklikService } from '../../services/eksiklikService';
import { useSnackbar } from '../../contexts/SnackbarContext';

const EksiklikListesi = ({ santiyeId, blokId, daireNo }) => {
  const [eksiklikler, setEksiklikler] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useSnackbar();

  // Eksiklikleri yükle
  useEffect(() => {
    const loadEksiklikler = async () => {
      if (!santiyeId || !blokId || !daireNo) return;

      try {
        setLoading(true);
        const data = await eksiklikService.getEksiklikler(santiyeId, blokId, {
          daireNo: daireNo
        });
        setEksiklikler(data);
      } catch (error) {
        console.error('Eksiklikler yüklenirken hata:', error);
        showSnackbar('Eksiklikler yüklenirken hata oluştu', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadEksiklikler();
  }, [santiyeId, blokId, daireNo]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {daireNo} Nolu Daire Eksiklikleri
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {/* Yeni eksiklik ekleme modalını aç */}}
        >
          Yeni Eksiklik
        </Button>
      </Box>

      <Grid container spacing={2}>
        {eksiklikler.map((eksiklik) => (
          <Grid item xs={12} key={eksiklik.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">
                    {eksiklik.baslik}
                  </Typography>
                  <Box>
                    <IconButton>
                      <EditIcon />
                    </IconButton>
                    <IconButton>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Typography color="textSecondary" paragraph>
                  {eksiklik.aciklama}
                </Typography>

                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip 
                    label={eksiklik.durum} 
                    color={
                      eksiklik.durum === 'Tamamlandı' ? 'success' : 
                      eksiklik.durum === 'Yeni' ? 'error' : 
                      'warning'
                    } 
                  />
                  <Chip 
                    label={eksiklik.oncelik} 
                    color={
                      eksiklik.oncelik === 'Yüksek' ? 'error' : 
                      eksiklik.oncelik === 'Düşük' ? 'success' : 
                      'warning'
                    } 
                  />
                  {eksiklik.kategori && (
                    <Chip label={eksiklik.kategori} />
                  )}
                  {eksiklik.taseron && (
                    <Chip label={`Taşeron: ${eksiklik.taseron}`} />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default EksiklikListesi; 