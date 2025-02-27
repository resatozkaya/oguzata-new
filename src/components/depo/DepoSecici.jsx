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
import DepoEditDialog from './DepoEditDialog';

const DepoSecici = ({ onDepoSil }) => {
  const { depolar, seciliDepo, setSeciliDepo } = useDepo();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleMenuClick = (event) => {
    event.stopPropagation();
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
        >
          {depolar.map((depo) => (
            <MenuItem key={depo.id} value={depo.id}>
              {depo.ad}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {seciliDepo && (
        <>
          <IconButton size="small" onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>

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
            <MenuItem onClick={() => {
              handleMenuClose();
              setEditDialogOpen(true);
            }}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Depo Düzenle</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDepoSil}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText sx={{ color: 'error.main' }}>Depoyu Sil</ListItemText>
            </MenuItem>
          </Menu>

          <DepoEditDialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            depo={seciliDepo}
          />
        </>
      )}
    </Box>
  );
};

export default DepoSecici; 