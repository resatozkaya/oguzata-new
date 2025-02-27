import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Chip,
  Divider
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

const RaporCard = ({ rapor, onEdit, onDelete }) => {
  const formatTarih = (tarih) => {
    try {
      // Eğer tarih string ise parseISO ile çevir
      if (typeof tarih === 'string') {
        return format(parseISO(tarih), 'd MMMM yyyy', { locale: tr });
      }
      // Eğer tarih timestamp veya Date objesi ise direkt kullan
      if (tarih instanceof Date || tarih?.toDate) {
        return format(tarih instanceof Date ? tarih : tarih.toDate(), 'd MMMM yyyy', { locale: tr });
      }
      return 'Geçersiz tarih';
    } catch (error) {
      console.error('Tarih formatlanırken hata:', error);
      return 'Geçersiz tarih';
    }
  };

  return (
    <Card sx={{ mb: 2, position: 'relative' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="div" gutterBottom>
              {rapor.personelAdi}
            </Typography>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {formatTarih(rapor.tarih || rapor.createdAt)}
            </Typography>
          </Box>
          <Box>
            <IconButton size="small" onClick={() => onEdit(rapor)} sx={{ mr: 1 }}>
              <EditIcon />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(rapor.id)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip 
            label={rapor.santiye} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
          <Chip 
            label={rapor.firma || 'Firma belirtilmedi'} 
            size="small" 
            color="secondary" 
            variant="outlined"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
          {rapor.yapilanIs}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default RaporCard; 