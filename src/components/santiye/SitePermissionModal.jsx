import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import {
  assignSitePermission,
  removeSitePermission,
  getSitePermissionUsers,
  getUserSitePermissions
} from '../../services/sitePermissions';
import { useSnackbar } from 'notistack';
import { PAGE_PERMISSIONS } from '../../constants/permissions';

const SitePermissionModal = ({ open, onClose, siteId, siteName }) => {
  const [users, setUsers] = useState([]);
  const [permissionUsers, setPermissionUsers] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (open) {
      fetchUsers();
      fetchPermissionUsers();
    }
  }, [open, siteId]);

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userData);
    } catch (error) {
      console.error('Kullanıcılar getirilirken hata:', error);
      enqueueSnackbar('Kullanıcılar getirilemedi', { variant: 'error' });
    }
  };

  const fetchPermissionUsers = async () => {
    try {
      const permUsers = await getSitePermissionUsers(siteId);
      setPermissionUsers(permUsers);
    } catch (error) {
      console.error('Yetkili kullanıcılar getirilirken hata:', error);
      enqueueSnackbar('Yetkili kullanıcılar getirilemedi', { variant: 'error' });
    }
  };

  const handlePermissionChange = (permission) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  const handleAssignPermissions = async (userId) => {
    try {
      // Görüntüleme yetkisi her zaman olmalı
      const permissions = [PAGE_PERMISSIONS.SANTIYE.VIEW];
      
      // Seçilen diğer yetkiler eklenir
      if (selectedPermissions.includes(PAGE_PERMISSIONS.SANTIYE.UPDATE)) {
        permissions.push(PAGE_PERMISSIONS.SANTIYE.UPDATE);
      }
      if (selectedPermissions.includes(PAGE_PERMISSIONS.SANTIYE.DELETE)) {
        permissions.push(PAGE_PERMISSIONS.SANTIYE.DELETE);
      }
      if (selectedPermissions.includes(PAGE_PERMISSIONS.SANTIYE.MANAGE)) {
        permissions.push(PAGE_PERMISSIONS.SANTIYE.MANAGE);
      }
      
      await assignSitePermission(userId, siteId, permissions);
      enqueueSnackbar('Yetkiler başarıyla atandı', { variant: 'success' });
      
      // Seçili yetkileri sıfırla
      setSelectedPermissions([]);
      fetchPermissionUsers();
    } catch (error) {
      console.error('Yetki atama hatası:', error);
      enqueueSnackbar('Yetki atama sırasında bir hata oluştu', { variant: 'error' });
    }
  };

  const handleRemovePermission = async (permissionId) => {
    try {
      await removeSitePermission(permissionId);
      enqueueSnackbar('Yetki başarıyla kaldırıldı', { variant: 'success' });
      fetchPermissionUsers();
    } catch (error) {
      console.error('Yetki kaldırılırken hata:', error);
      enqueueSnackbar('Yetki kaldırılamadı', { variant: 'error' });
    }
  };

  const filteredUsers = users.filter(user =>
    (user.name + ' ' + user.surname)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {siteName} - Şantiye Yetkilendirme
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Yetki Seçenekleri
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={true}
                  disabled={true}
                />
              }
              label="Görüntüleme (Varsayılan)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedPermissions.includes(PAGE_PERMISSIONS.SANTIYE.UPDATE)}
                  onChange={() => handlePermissionChange(PAGE_PERMISSIONS.SANTIYE.UPDATE)}
                />
              }
              label="Düzenleme"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedPermissions.includes(PAGE_PERMISSIONS.SANTIYE.DELETE)}
                  onChange={() => handlePermissionChange(PAGE_PERMISSIONS.SANTIYE.DELETE)}
                />
              }
              label="Silme"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedPermissions.includes(PAGE_PERMISSIONS.SANTIYE.MANAGE)}
                  onChange={() => handlePermissionChange(PAGE_PERMISSIONS.SANTIYE.MANAGE)}
                />
              }
              label="Yönetim"
            />
          </FormGroup>
        </Box>

        <TextField
          fullWidth
          label="Kullanıcı Ara"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Typography variant="h6" gutterBottom>
          Kullanıcılar
        </Typography>
        <List>
          {filteredUsers.map(user => {
            const hasPermission = permissionUsers.some(p => p.userId === user.id);
            const permissionData = permissionUsers.find(p => p.userId === user.id);

            return (
              <ListItem key={user.id}>
                <ListItemText
                  primary={`${user.name} ${user.surname}`}
                  secondary={user.email}
                />
                <ListItemSecondaryAction>
                  {hasPermission ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {permissionData.permissions.map(perm => (
                        <Chip
                          key={perm}
                          label={perm.split('.').pop()}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                      <IconButton
                        edge="end"
                        onClick={() => handleRemovePermission(permissionData.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleAssignPermissions(user.id)}
                      disabled={selectedPermissions.length === 0}
                    >
                      Yetki Ver
                    </Button>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Kapat</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SitePermissionModal;
