import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Divider,
  CircularProgress,
  Grid
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { getRoles, updateRolePermissions } from '../../../services/roles';
import { PAGE_PERMISSIONS } from '../../../constants/permissions';

const PERMISSION_LABELS = {
  eksiklik_view: 'Görüntüleme',
  eksiklik_create: 'Oluşturma',
  eksiklik_update: 'Düzenleme',
  eksiklik_delete: 'Silme',
  eksiklik_manage: 'Yetki Yönetimi',
  eksiklik_view_all: 'Tümünü Görüntüleme',
  eksiklik_bina_yapisi: 'Bina Yapısı Düzenleme',
  eksiklik_blok_yonetimi: 'Blok Yönetimi'
};

const RolYetkilendirme = ({ open, onClose, modul, santiyeId, showTeslimatEkip = false }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoading(true);
        const data = await getRoles(santiyeId, showTeslimatEkip);
        setRoles(data);
      } catch (error) {
        console.error('Roller yüklenirken hata:', error);
        enqueueSnackbar('Roller yüklenirken bir hata oluştu', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadRoles();
    }
  }, [open, santiyeId, showTeslimatEkip]);

  const handlePermissionChange = async (roleId, permission, checked) => {
    try {
      setSaving(true);
      
      const updatedRoles = roles.map(role => {
        if (role.id === roleId) {
          const permissions = new Set(role.permissions || []);
          if (checked) {
            permissions.add(permission);
          } else {
            permissions.delete(permission);
          }
          return { ...role, permissions: Array.from(permissions) };
        }
        return role;
      });

      await updateRolePermissions(roleId, updatedRoles.find(r => r.id === roleId).permissions, showTeslimatEkip);
      setRoles(updatedRoles);
      enqueueSnackbar('Yetkiler güncellendi', { variant: 'success' });
    } catch (error) {
      console.error('Yetkiler güncellenirken hata:', error);
      enqueueSnackbar('Yetkiler güncellenirken bir hata oluştu', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const getModulePermissions = () => {
    const permissions = [];
    const modulePermissions = PAGE_PERMISSIONS[modul] || {};
    
    Object.entries(modulePermissions).forEach(([key, value]) => {
      permissions.push({
        key: value,
        label: PERMISSION_LABELS[value] || key
      });
    });

    return permissions;
  };

  const getTitle = () => {
    if (showTeslimatEkip) {
      return 'Eksiklik Yetkilendirme';
    }
    return 'Şantiye Yetkileri';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6">{getTitle()}</Typography>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {roles.map((role) => (
              <React.Fragment key={role.id}>
                <ListItem>
                  <ListItemText 
                    primary={role.displayName || role.email} 
                    sx={{ fontWeight: 'bold' }}
                  />
                </ListItem>
                <Box sx={{ pl: 2, mb: 2 }}>
                  <Grid container spacing={2}>
                    {getModulePermissions().map((permission) => (
                      <Grid item xs={12} sm={6} md={4} key={permission.key}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={Boolean((role.permissions || []).includes(permission.key))}
                              onChange={(e) => handlePermissionChange(role.id, permission.key, e.target.checked)}
                              disabled={saving}
                            />
                          }
                          label={permission.label}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          KAPAT
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RolYetkilendirme;
