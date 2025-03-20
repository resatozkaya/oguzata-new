import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Grid,
  Paper,
  Chip,
  Tooltip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogContent
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  PhotoLibrary as PhotoLibraryIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { usePermission } from '../../../contexts/PermissionContext';
import { PAGE_PERMISSIONS } from '../../../constants/permissions';

const EksiklikListesi = ({ eksiklikler, onDuzenle, onSil }) => {
  const { hasPermission } = usePermission();
  const canEdit = hasPermission(PAGE_PERMISSIONS.EKSIKLIK.UPDATE);
  const canDelete = hasPermission(PAGE_PERMISSIONS.EKSIKLIK.DELETE);
  const [buyukResim, setBuyukResim] = useState(null);

  // Duruma göre renk ve icon belirle
  const getDurumBilgisi = (durum) => {
    switch (durum) {
      case 'TAMAMLANDI':
        return { color: 'success', icon: <CheckCircleIcon />, label: 'Tamamlandı' };
      case 'DEVAM_EDIYOR':
        return { color: 'warning', icon: <ScheduleIcon />, label: 'Devam Ediyor' };
      case 'YENI':
        return { color: 'info', icon: <WarningIcon />, label: 'Yeni' };
      default:
        return { color: 'default', icon: <ErrorIcon />, label: durum };
    }
  };

  // Önceliğe göre renk belirle
  const getOncelikRengi = (oncelik) => {
    switch (oncelik) {
      case 'KRITIK':
        return 'error';
      case 'NORMAL':
        return 'warning';
      case 'DUSUK':
        return 'info';
      default:
        return 'default';
    }
  };

  const renderResimler = (eksiklik) => {
    if (!eksiklik.resimler || eksiklik.resimler.length === 0) {
      return null;
    }

    // Mobil ve tablet görünümü için
    if (window.innerWidth < 768) {
      return (
        <Button
          variant="text"
          size="small"
          onClick={() => setBuyukResim(eksiklik.resimler[0])}
          startIcon={<PhotoLibraryIcon />}
        >
          Fotoğrafları Görüntüle ({eksiklik.resimler.length} adet)
        </Button>
      );
    }

    // Masaüstü görünümü için
    return (
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        {eksiklik.resimler.map((resim, index) => (
          <img
            key={index}
            src={resim}
            alt={`Eksiklik ${index + 1}`}
            style={{
              width: '100px',
              height: '100px',
              objectFit: 'cover',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => setBuyukResim(resim)}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Box
        sx={{
          height: 'calc(100vh - 400px)', // Header, filtreler ve diğer alanları çıkarıyoruz
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
            '&:hover': {
              background: '#666',
            },
          },
        }}
      >
        <Grid container spacing={2}>
          {eksiklikler.map((eksiklik) => {
            const durumBilgisi = getDurumBilgisi(eksiklik.durum);
            
            return (
              <Grid item xs={12} sm={6} md={6} lg={4} key={eksiklik.id}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    borderRadius: 2,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  {/* Üst Bilgi Alanı */}
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {eksiklik.daire} Nolu Daire
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {eksiklik.olusturmaTarihi ? format(new Date(eksiklik.olusturmaTarihi), 'dd.MM.yyyy') : '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {canEdit && (
                        <Tooltip title="Düzenle">
                          <IconButton 
                            size="small" 
                            onClick={() => onDuzenle(eksiklik)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Sil">
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              if (window.confirm('Bu eksikliği silmek istediğinizden emin misiniz?')) {
                                onSil(eksiklik.id);
                              }
                            }}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  {/* Eksiklik Detayları */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {eksiklik.aciklama}
                    </Typography>
                    
                    {renderResimler(eksiklik)}
                  </Box>

                  {/* Alt Bilgi Alanı */}
                  <Box sx={{ 
                    mt: 2, 
                    pt: 2, 
                    borderTop: 1, 
                    borderColor: 'divider',
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap'
                  }}>
                    <Chip
                      icon={durumBilgisi.icon}
                      label={durumBilgisi.label}
                      color={durumBilgisi.color}
                      size="small"
                    />
                    <Chip
                      label={eksiklik.oncelik}
                      color={getOncelikRengi(eksiklik.oncelik)}
                      size="small"
                      variant="outlined"
                    />
                    {eksiklik.taseron && (
                      <Chip
                        label={eksiklik.taseron}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Resim Büyütme Modal */}
      <Dialog
        open={Boolean(buyukResim)}
        onClose={() => setBuyukResim(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setBuyukResim(null)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'error.light',
                color: 'white'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          {buyukResim && (
            <img
              src={buyukResim}
              alt="Büyük Resim"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '90vh',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EksiklikListesi;