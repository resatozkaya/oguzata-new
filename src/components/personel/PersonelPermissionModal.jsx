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
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { PAGE_PERMISSIONS } from '../../constants/permissions';
import { useSnackbar } from 'notistack';

const PersonelPermissionModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const { enqueueSnackbar } = useSnackbar();

  // Kullanıcıları getir
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Kullanıcılar yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [open]);

  // Kullanıcı seçildiğinde mevcut yetkilerini getir
  useEffect(() => {
    const fetchExistingPermissions = async () => {
      if (!selectedUser) return;

      try {
        setLoading(true);
        const permissionsRef = collection(db, 'user_permissions');
        const q = query(
          permissionsRef,
          where('userId', '==', selectedUser.id)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setSelectedPermissions(doc.data().permissions || []);
        } else {
          // Varsayılan olarak görüntüleme yetkisi
          setSelectedPermissions([PAGE_PERMISSIONS.PERSONEL.VIEW]);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setError('Yetkiler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchExistingPermissions();
  }, [selectedUser]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
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

  const handleSave = async () => {
    if (!selectedUser) {
      enqueueSnackbar('Lütfen bir kullanıcı seçin', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      
      // Yeni yetkileri kaydet
      await setDoc(doc(db, 'user_permissions', selectedUser.id), {
        userId: selectedUser.id,
        permissions: selectedPermissions,
        updatedAt: new Date().toISOString()
      });

      enqueueSnackbar('Yetkiler başarıyla kaydedildi', { variant: 'success' });
      onClose();
    } catch (error) {
      console.error('Error saving permissions:', error);
      setError('Yetkiler kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setSelectedPermissions([]);
    setSearchTerm('');
    setError('');
    onClose();
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availablePermissions = [
    { value: PAGE_PERMISSIONS.PERSONEL.VIEW, label: 'Görüntüleme (Varsayılan)', disabled: true },
    { value: PAGE_PERMISSIONS.PERSONEL.CREATE, label: 'Ekleme' },
    { value: PAGE_PERMISSIONS.PERSONEL.UPDATE, label: 'Düzenleme' },
    { value: PAGE_PERMISSIONS.PERSONEL.DELETE, label: 'Silme' }
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Personel Yetkilendirme
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Kullanıcı Ara"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <List sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                {filteredUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <ListItem
                      button
                      selected={selectedUser?.id === user.id}
                      onClick={() => handleUserSelect(user)}
                    >
                      <ListItemText
                        primary={user.email}
                        secondary={user.name}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>

              {selectedUser && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 3, mb: 2 }}>
                    Yetki Seçenekleri - {selectedUser.email}
                  </Typography>

                  <FormGroup>
                    {availablePermissions.map((permission) => (
                      <FormControlLabel
                        key={permission.value}
                        control={
                          <Checkbox
                            checked={selectedPermissions.includes(permission.value)}
                            onChange={() => !permission.disabled && handlePermissionChange(permission.value)}
                            disabled={permission.disabled}
                          />
                        }
                        label={permission.label}
                      />
                    ))}
                  </FormGroup>
                </>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>İptal</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !selectedUser}
        >
          {loading ? <CircularProgress size={24} /> : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PersonelPermissionModal;
