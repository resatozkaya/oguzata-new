import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useDepo } from '../../contexts/DepoContext';
import { usePermission } from '../../contexts/PermissionContext';
import { enqueueSnackbar } from 'notistack';
import DepoEditDialog from './DepoEditDialog';

const DepoSecici = ({ onDepoSil }) => {
  const { depolar, seciliDepo, setSeciliDepo } = useDepo();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const { hasPermission } = usePermission();
  
  // Yetki kontrolleri
  const canEdit = hasPermission('depo_update');
  const canDelete = hasPermission('depo_delete');
  const isYonetim = hasPermission('YONETIM');

  // Depo yetki kontrolü için yardımcı fonksiyon
  const canManageDepo = (depo) => {
    if (isYonetim) return true; // YÖNETİM rolü tüm depoları yönetebilir
    return depo?.createdBy === currentUser?.email; // Diğer kullanıcılar sadece kendi depolarını
  };

  const handleMenuClick = (event) => {
    event.stopPropagation();
    if (!canEdit && !canDelete) {
      enqueueSnackbar('Bu işlem için yetkiniz bulunmamaktadır.', { variant: 'error' });
      return;
    }
    if (!canManageDepo(seciliDepo)) {
      enqueueSnackbar('Sadece kendi oluşturduğunuz depoları düzenleyebilirsiniz.', { variant: 'error' });
      return;
    }
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleDepoSil = () => {
    handleMenuClose();
    onDepoSil();
  };

  // Depo değiştiğinde çağrılır
  const handleDepoChange = (e) => {
    const secilenDepoId = e.target.value;
    const secilenDepo = depolar.find(d => d.id === secilenDepoId);
    setSeciliDepo(secilenDepo || null);
  };

  if (!depolar.length) {
    return (
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Henüz depo bulunmuyor...
      </Typography>
    );
  }

  return (
    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
      <FormControl fullWidth variant="outlined">
        <InputLabel id="depo-secici-label">Depo Seçin</InputLabel>
        <Select
          labelId="depo-secici-label"
          id="depo-secici"
          value={seciliDepo?.id || ''}
          label="Depo Seçin"
          onChange={handleDepoChange}
          endAdornment={
            seciliDepo && (canEdit || canDelete) && canManageDepo(seciliDepo) ? (
              <IconButton
                size="small"
                sx={{ mr: 2 }}
                onClick={handleMenuClick}
              >
                <MoreVertIcon />
              </IconButton>
            ) : null
          }
        >
          <MenuItem value="">
            <em>Depo seçin</em>
          </MenuItem>
          {depolar.map((depo) => (
            <MenuItem key={depo.id} value={depo.id}>
              {depo.ad}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {seciliDepo && (
        <>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            {canEdit && (
              <MenuItem onClick={() => {
                handleMenuClose();
                // Depo düzenleme işlemi
              }}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Depo Düzenle</ListItemText>
              </MenuItem>
            )}
            {canDelete && (
              <MenuItem onClick={handleDepoSil}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText sx={{ color: 'error.main' }}>Depoyu Sil</ListItemText>
              </MenuItem>
            )}
          </Menu>

          <DepoEditDialog
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            depo={seciliDepo}
          />
        </>
      )}
    </Box>
  );
};

export default DepoSecici; 