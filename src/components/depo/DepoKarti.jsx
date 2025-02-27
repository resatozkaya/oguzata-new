import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Card,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useDepo } from '../../contexts/DepoContext';
import { depoService } from '../../services/depoService';
import MalzemeDuzenleDialog from './MalzemeDuzenleDialog';

const DepoKarti = ({ malzeme }) => {
  const { seciliSantiye, seciliDepo, setMalzemeler } = useDepo();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [duzenleDialogAcik, setDuzenleDialogAcik] = useState(false);

  const handleMenuClick = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleDuzenle = () => {
    setDuzenleDialogAcik(true);
    handleMenuClose();
  };

  const handleSil = async () => {
    if (window.confirm('Bu malzemeyi silmek istediğinize emin misiniz?')) {
      try {
        await depoService.malzemeSil(seciliSantiye.id, seciliDepo.id, malzeme.id);
        setMalzemeler(prev => prev.filter(m => m.id !== malzeme.id));
      } catch (error) {
        console.error('Malzeme silinirken hata:', error);
        alert('Malzeme silinirken bir hata oluştu');
      }
    }
    handleMenuClose();
  };

  // Base64 resmi görüntülemek için yardımcı fonksiyon
  const getImageUrl = (base64Data) => {
    if (!base64Data) return null;
    // Eğer zaten tam base64 url ise olduğu gibi döndür
    if (base64Data.startsWith('data:image/')) return base64Data;
    // Değilse base64 header ekle
    return `data:image/jpeg;base64,${base64Data}`;
  };

  // Tarih formatla
  const formatTarih = (tarih) => {
    if (!tarih) return '';
    try {
      if (typeof tarih === 'string') {
        return new Date(tarih).toLocaleDateString('tr-TR');
      }
      // Firestore Timestamp
      if (tarih.toDate) {
        return tarih.toDate().toLocaleDateString('tr-TR');
      }
      // Normal Date objesi
      if (tarih instanceof Date) {
        return tarih.toLocaleDateString('tr-TR');
      }
      return '';
    } catch (error) {
      console.error('Tarih formatlanırken hata:', error);
      return '';
    }
  };

  return (
    <Card>
      <Paper sx={{ p: 2, position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {malzeme.ad}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {malzeme.kategori.replace(/_/g, ' ')}
            </Typography>
            <Typography>
              Miktar: {malzeme.miktar} {malzeme.birim}
            </Typography>
            {malzeme.aciklama && (
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                {malzeme.aciklama}
              </Typography>
            )}
          </Box>
          
          {/* Resim varsa göster */}
          {malzeme.resimUrl && (
            <Box 
              sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: 1,
                overflow: 'hidden',
                ml: 2 
              }}
            >
              <img
                src={getImageUrl(malzeme.resimUrl)}
                alt={malzeme.ad}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  console.error('Resim yüklenirken hata:', e);
                  e.target.style.display = 'none';
                }}
              />
            </Box>
          )}

          <IconButton 
            size="small" 
            sx={{ ml: 'auto' }}
            onClick={handleMenuClick}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            İşlem: {malzeme.islemTuru}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tarih: {formatTarih(malzeme.tarih)}
          </Typography>
        </Box>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleDuzenle}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Düzenle</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleSil}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Sil</ListItemText>
          </MenuItem>
        </Menu>

        <MalzemeDuzenleDialog
          open={duzenleDialogAcik}
          onClose={() => setDuzenleDialogAcik(false)}
          malzeme={malzeme}
        />
      </Paper>
    </Card>
  );
};

export default DepoKarti; 