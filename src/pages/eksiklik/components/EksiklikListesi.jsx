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
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem
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
  PhotoLibrary as PhotoLibraryIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  NewReleases as NewReleasesIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { usePermission } from '../../../contexts/PermissionContext';
import { PAGE_PERMISSIONS } from '../../../constants/permissions';

const EksiklikListesi = ({ eksiklikler, onDuzenle, onSil, onDurumDegistir }) => {
  const { hasPermission } = usePermission();
  const canEdit = hasPermission(PAGE_PERMISSIONS.EKSIKLIK.UPDATE);
  const canDelete = hasPermission(PAGE_PERMISSIONS.EKSIKLIK.DELETE);
  const [buyukResim, setBuyukResim] = useState(null);
  const [durumMenu, setDurumMenu] = useState({ open: false, anchorEl: null, eksiklik: null });

  const durumlar = [
    { value: 'YENI', label: 'Yeni', icon: <NewReleasesIcon /> },
    { value: 'DEVAM_EDIYOR', label: 'Devam Ediyor', icon: <PendingIcon /> },
    { value: 'TAMAMLANDI', label: 'Tamamlandı', icon: <CheckCircleIcon /> },
    { value: 'IPTAL', label: 'İptal', icon: <CancelIcon /> }
  ];

  const handleDurumClick = (event, eksiklik) => {
    if (canEdit) {
      setDurumMenu({
        open: true,
        anchorEl: event.currentTarget,
        eksiklik
      });
    }
  };

  const handleDurumMenuClose = () => {
    setDurumMenu({ open: false, anchorEl: null, eksiklik: null });
  };

  const handleDurumDegistir = (yeniDurum) => {
    if (durumMenu.eksiklik && onDurumDegistir) {
      onDurumDegistir(durumMenu.eksiklik.id, yeniDurum);
    }
    handleDurumMenuClose();
  };

  // Duruma göre renk ve icon belirle
  const getDurumBilgisi = (durum) => {
    switch (durum) {
      case 'TAMAMLANDI':
        return { color: 'success', label: 'Tamamlandı', icon: <CheckCircleIcon /> };
      case 'DEVAM_EDIYOR':
        return { color: 'warning', label: 'Devam Ediyor', icon: <PendingIcon /> };
      case 'IPTAL':
        return { color: 'error', label: 'İptal', icon: <CancelIcon /> };
      default:
        return { color: 'info', label: 'Yeni', icon: <NewReleasesIcon /> };
    }
  };

  const getOncelikRengi = (oncelik) => {
    switch (oncelik) {
      case 'YUKSEK':
        return 'error';
      case 'ORTA':
        return 'warning';
      default:
        return 'info';
    }
  };

  const renderResimler = (eksiklik) => {
    if (!eksiklik.resimler || eksiklik.resimler.length === 0) {
      return null;
    }

    // Ekran boyutu kontrolü
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1200;

    if (isMobile) {
      return (
        <Box sx={{ mt: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setBuyukResim(eksiklik.resimler[0])}
            startIcon={<PhotoLibraryIcon />}
            fullWidth
          >
            Fotoğrafları Görüntüle ({eksiklik.resimler.length} adet)
          </Button>
        </Box>
      );
    }

    if (isTablet) {
      return (
        <Box sx={{ 
          mt: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              position: 'relative',
              borderRadius: 1,
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <img
              src={eksiklik.resimler[0]}
              alt="Önizleme"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onClick={() => setBuyukResim(eksiklik.resimler[0])}
            />
            {eksiklik.resimler.length > 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  fontSize: '12px',
                  padding: '4px',
                  textAlign: 'center'
                }}
              >
                +{eksiklik.resimler.length - 1} Fotoğraf
              </Box>
            )}
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setBuyukResim(eksiklik.resimler[0])}
            sx={{ flexGrow: 1 }}
          >
            Tüm Fotoğrafları Gör
          </Button>
        </Box>
      );
    }

    return (
      <Box sx={{ 
        display: 'flex', 
        gap: '8px', 
        mt: 1,
        flexWrap: 'wrap'
      }}>
        {eksiklik.resimler.map((resim, index) => (
          <Box
            key={index}
            sx={{
              width: 100,
              height: 100,
              position: 'relative',
              borderRadius: 1,
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid',
              borderColor: 'divider',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
            onClick={() => setBuyukResim(resim)}
          >
            <img
              src={resim}
              alt={`Eksiklik ${index + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <>
      <Box
        sx={{
          height: 'calc(100vh - 400px)',
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
                            sx={{
                              color: 'primary.main',
                              '&:hover': {
                                color: 'primary.dark',
                                backgroundColor: 'action.hover'
                              }
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Sil">
                          <IconButton
                            size="small"
                            onClick={() => onSil(eksiklik.id)}
                            sx={{
                              color: 'error.main',
                              '&:hover': {
                                color: 'error.dark',
                                backgroundColor: 'action.hover'
                              }
                            }}
                          >
                            <DeleteIcon />
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
                      onClick={(e) => handleDurumClick(e, eksiklik)}
                      sx={{
                        cursor: canEdit ? 'pointer' : 'default',
                        '&:hover': canEdit ? {
                          opacity: 0.9,
                          transform: 'scale(1.02)'
                        } : {}
                      }}
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

      {/* Durum Değiştirme Menüsü */}
      <Menu
        anchorEl={durumMenu.anchorEl}
        open={durumMenu.open}
        onClose={handleDurumMenuClose}
      >
        {durumlar.map((durum) => (
          <MenuItem
            key={durum.value}
            onClick={() => handleDurumDegistir(durum.value)}
            sx={{
              gap: 1,
              minWidth: 200,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {React.cloneElement(durum.icon, {
              sx: { color: getDurumBilgisi(durum.value).color + '.main' }
            })}
            {durum.label}
          </MenuItem>
        ))}
      </Menu>

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