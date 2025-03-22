import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  FormControlLabel,
  FormControl,
  FormGroup,
  Checkbox,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { PAGE_PERMISSIONS } from '../../../constants/permissions';

const RolYetkilendirme = ({ open, onClose, modul, santiyeId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissions, setPermissions] = useState({});

  // Eksiklik modülü için yetki seçenekleri
  const YETKI_SECENEKLERI = {
    EKSIKLIK: [
      { id: 'eksiklik_goruntuleme', label: 'Eksiklik Görüntüleme', permission: PAGE_PERMISSIONS.EKSIKLIK.VIEW },
      { id: 'eksiklik_olusturma', label: 'Eksiklik Oluşturma', permission: PAGE_PERMISSIONS.EKSIKLIK.CREATE },
      { id: 'eksiklik_guncelleme', label: 'Eksiklik Güncelleme', permission: PAGE_PERMISSIONS.EKSIKLIK.UPDATE },
      { id: 'eksiklik_silme', label: 'Eksiklik Silme', permission: PAGE_PERMISSIONS.EKSIKLIK.DELETE },
      { id: 'eksiklik_yonetimi', label: 'Eksiklik Yönetimi', permission: PAGE_PERMISSIONS.EKSIKLIK.MANAGE },
      { id: 'bina_yapisi_yonetimi', label: 'Bina Yapısı Yönetimi', permission: PAGE_PERMISSIONS.EKSIKLIK.BINA_YAPISI },
      { id: 'blok_yonetimi', label: 'Blok Yönetimi', permission: PAGE_PERMISSIONS.EKSIKLIK.BLOK_YONETIMI },
      { id: 'yetki_yonetimi', label: 'Yetki Yönetimi Butonu', permission: PAGE_PERMISSIONS.EKSIKLIK.MANAGE_PERMISSIONS }
    ]
  };

  // Kullanıcıları getir
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
      } catch (error) {
        console.error('Kullanıcılar yüklenirken hata:', error);
        enqueueSnackbar('Kullanıcılar yüklenirken hata oluştu', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [open]);

  // Seçili kullanıcının yetkilerini getir
  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!selectedUser) return;

      try {
        setLoading(true);
        const permissionsRef = doc(db, 'users', selectedUser.id);
        const permissionsDoc = await getDoc(permissionsRef);
        
        if (permissionsDoc.exists()) {
          const userPermissions = permissionsDoc.data().permissions || [];
          const newPermissions = {};

          // Yetkileri işle
          YETKI_SECENEKLERI.EKSIKLIK.forEach(yetki => {
            newPermissions[yetki.id] = userPermissions.includes(yetki.permission);
          });

          setPermissions(newPermissions);
        }
      } catch (error) {
        console.error('Yetkiler yüklenirken hata:', error);
        enqueueSnackbar('Yetkiler yüklenirken hata oluştu', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, [selectedUser]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handlePermissionChange = async (yetkiId) => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      const newPermissions = { ...permissions };
      newPermissions[yetkiId] = !newPermissions[yetkiId];
      setPermissions(newPermissions);

      // Kullanıcının mevcut yetkilerini al
      const userRef = doc(db, 'users', selectedUser.id);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() || {};
      let userPermissions = userData.permissions || [];

      // Seçilen yetkinin PAGE_PERMISSIONS karşılığını bul
      const yetkiOption = YETKI_SECENEKLERI.EKSIKLIK.find(y => y.id === yetkiId);
      if (!yetkiOption) return;

      // Yetki değişikliğini uygula
      if (newPermissions[yetkiId]) {
        if (!userPermissions.includes(yetkiOption.permission)) {
          userPermissions.push(yetkiOption.permission);
        }
      } else {
        userPermissions = userPermissions.filter(p => p !== yetkiOption.permission);
      }

      // Yetkileri güncelle
      await setDoc(userRef, {
        ...userData,
        permissions: userPermissions
      }, { merge: true });

      enqueueSnackbar('Yetki başarıyla güncellendi', { variant: 'success' });
    } catch (error) {
      console.error('Yetki güncellenirken hata:', error);
      enqueueSnackbar('Yetki güncellenirken hata oluştu', { variant: 'error' });
      // Hata durumunda önceki duruma geri dön
      const newPermissions = { ...permissions };
      newPermissions[yetkiId] = !newPermissions[yetkiId];
      setPermissions(newPermissions);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedUser) {
      enqueueSnackbar('Lütfen bir kullanıcı seçin', { variant: 'warning' });
      return;
    }

    try {
      setSaving(true);

      // Kullanıcının mevcut bilgilerini al
      const userRef = doc(db, 'users', selectedUser.id);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() || {};

      // Aktif yetkileri topla
      const activePermissions = [];
      Object.entries(permissions).forEach(([yetkiId, value]) => {
        if (value) {
          const yetkiOption = YETKI_SECENEKLERI.EKSIKLIK.find(y => y.id === yetkiId);
          if (yetkiOption) {
            activePermissions.push(yetkiOption.permission);
          }
        }
      });

      // Firestore'a kaydet
      await setDoc(userRef, {
        ...userData,
        permissions: activePermissions
      }, { merge: true });

      enqueueSnackbar('Yetkiler başarıyla kaydedildi', { variant: 'success' });
      onClose();
    } catch (error) {
      console.error('Yetkiler kaydedilirken hata:', error);
      enqueueSnackbar('Yetkiler kaydedilirken hata oluştu', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Rol Yetkilendirme
        <IconButton
          onClick={onClose}
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
        <Box sx={{ display: 'flex', height: '500px' }}>
          {/* Sol Panel - Kullanıcı Listesi */}
          <Box sx={{ width: '300px', borderRight: '1px solid #e0e0e0', pr: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Kullanıcı Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
              {filteredUsers.map((user) => (
                <React.Fragment key={user.id}>
                  <ListItem
                    button
                    selected={selectedUser?.id === user.id}
                    onClick={() => handleUserSelect(user)}
                  >
                    <ListItemText
                      primary={user.displayName}
                      secondary={user.email}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Box>

          {/* Sağ Panel - Yetkiler */}
          <Box sx={{ flex: 1, pl: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : selectedUser ? (
              <>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {selectedUser.displayName} - Yetkiler
                </Typography>

                <FormControl component="fieldset">
                  <FormGroup>
                    {YETKI_SECENEKLERI.EKSIKLIK.map((yetki) => (
                      <FormControlLabel
                        key={yetki.id}
                        control={
                          <Checkbox
                            checked={permissions[yetki.id] || false}
                            onChange={() => handlePermissionChange(yetki.id)}
                          />
                        }
                        label={yetki.label}
                      />
                    ))}
                  </FormGroup>
                </FormControl>

                {/* Kaydet Butonu */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography color="textSecondary">
                  Lütfen sol panelden bir kullanıcı seçin
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default RolYetkilendirme;
