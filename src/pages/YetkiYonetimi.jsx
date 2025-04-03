import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Tabs,
  Tab,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import { roleService } from '../services/roleService';
import { PAGE_PERMISSIONS } from '../constants/permissions';
import PageTitle from '../components/PageTitle';

// Tüm yetkileri listele
const allPermissions = Object.entries(PAGE_PERMISSIONS).reduce((acc, [module, permissions]) => {
  Object.entries(permissions).forEach(([action, permission]) => {
    acc.push({
      module,
      action,
      permission
    });
  });
  return acc;
}, []);

// Tab Panel bileşeni
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const YetkiYonetimi = () => {
  const { currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: []
  });

  // Kullanıcılar için state'ler
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoleDialogOpen, setUserRoleDialogOpen] = useState(false);
  const [selectedUserRoles, setSelectedUserRoles] = useState([]);
  const [openPermissionsDialog, setOpenPermissionsDialog] = useState(false);

  // İzin değiştirme işleyicisi
  const handlePermissionToggle = (permission) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  // Verileri yükle
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Varsayılan roller oluşturuluyor...');
      await roleService.initializeDefaultRoles();
      console.log('Roller ve kullanıcılar getiriliyor...');
      const [rolesData, usersData] = await Promise.all([
        roleService.getRoles(),
        roleService.getUsersWithRoles()
      ]);
      console.log('Roller:', rolesData);
      console.log('Kullanıcılar:', usersData);
      setRoles(rolesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
      enqueueSnackbar('Veriler yüklenirken bir hata oluştu: ' + error.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Rol işlemleri
  const handleOpenRoleDialog = (role = null) => {
    if (role) {
      setRoleForm({
        name: role.name,
        description: role.description,
        permissions: role.permissions || []
      });
      setSelectedRole(role);
    } else {
      setRoleForm({
        name: '',
        description: '',
        permissions: []
      });
      setSelectedRole(null);
    }
    setOpenRoleDialog(true);
  };

  const handleCloseRoleDialog = () => {
    setSelectedRole(null);
    setOpenRoleDialog(false);
    setRoleForm({
      name: '',
      description: '',
      permissions: []
    });
  };

  const handleRoleSave = async () => {
    try {
      if (selectedRole) {
        await roleService.updateRole(selectedRole.id, roleForm);
        enqueueSnackbar('Rol başarıyla güncellendi', { variant: 'success' });
      } else {
        await roleService.createRole(roleForm);
        enqueueSnackbar('Rol başarıyla oluşturuldu', { variant: 'success' });
      }
      handleCloseRoleDialog();
      loadData();
    } catch (error) {
      console.error('Rol kaydedilirken hata:', error);
      enqueueSnackbar('Rol kaydedilirken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleRoleDelete = async (roleId) => {
    if (window.confirm('Bu rolü silmek istediğinizden emin misiniz?')) {
      try {
        await roleService.deleteRole(roleId);
        enqueueSnackbar('Rol başarıyla silindi', { variant: 'success' });
        loadData();
      } catch (error) {
        console.error('Rol silinirken hata:', error);
        enqueueSnackbar('Rol silinirken bir hata oluştu', { variant: 'error' });
      }
    }
  };

  // Kullanıcı rol işlemleri
  const handleUserRoleDialogOpen = (user) => {
    setSelectedUser(user);
    setSelectedUserRoles(user.roles?.map(r => r.roleId) || []);
    setUserRoleDialogOpen(true);
  };

  const handleUserRoleDialogClose = () => {
    setUserRoleDialogOpen(false);
    setSelectedUser(null);
    setSelectedUserRoles([]);
  };

  const handleUserRoleSave = async () => {
    try {
      // Seçili kullanıcının rollerini güncelle
      await roleService.updateUserRole(selectedUser.id, selectedUserRoles[0]);
      enqueueSnackbar('Kullanıcı rolleri başarıyla güncellendi', { variant: 'success' });
      handleUserRoleDialogClose();
      loadData();
    } catch (error) {
      console.error('Kullanıcı rolleri güncellenirken hata:', error);
      enqueueSnackbar('Kullanıcı rolleri güncellenirken bir hata oluştu', { variant: 'error' });
    }
  };

  // Kullanıcı rolünü güncelle
  const handleUserRoleUpdate = async (userId, newRole) => {
    try {
      await roleService.updateUserRole(userId, newRole);
      enqueueSnackbar('Kullanıcı rolü başarıyla güncellendi', { variant: 'success' });
      loadData();
    } catch (error) {
      console.error('Kullanıcı rolü güncellenirken hata:', error);
      enqueueSnackbar('Kullanıcı rolü güncellenirken bir hata oluştu', { variant: 'error' });
    }
  };

  // Kullanıcı yetkilerini güncelle
  const handleUserPermissionsUpdate = async (userId, permissions) => {
    try {
      await roleService.updateUserPermissions(userId, permissions);
      enqueueSnackbar('Kullanıcı yetkileri başarıyla güncellendi', { variant: 'success' });
      loadData();
    } catch (error) {
      console.error('Kullanıcı yetkileri güncellenirken hata:', error);
      enqueueSnackbar('Kullanıcı yetkileri güncellenirken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleOpenPermissionsDialog = (user) => {
    setSelectedUser(user);
    setOpenPermissionsDialog(true);
  };

  const handleClosePermissionsDialog = () => {
    setOpenPermissionsDialog(false);
    setSelectedUser(null);
  };

  // Roller sekmesi içeriği
  const RolesTab = () => (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Roller</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenRoleDialog()}
        >
          Yeni Rol Ekle
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rol Adı</TableCell>
              <TableCell>Açıklama</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenRoleDialog(role)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleRoleDelete(role.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Rol Yetkileri sekmesi içeriği
  const RolePermissionsTab = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Rol Yetkileri</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rol</TableCell>
              <TableCell>Yetkiler</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {Array.isArray(role.permissions) && role.permissions.map((permission, index) => (
                      <Chip
                        key={`${role.id}_${permission}_${index}`}
                        label={permission}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => {
                    setSelectedRole(role);
                    setRoleForm({
                      ...role,
                      permissions: Array.isArray(role.permissions) ? role.permissions : []
                    });
                    setOpenRoleDialog(true);
                  }}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Kullanıcı Rolleri sekmesi içeriği
  const UserRolesTab = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Kullanıcı Rolleri</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Kullanıcı</TableCell>
              <TableCell>E-posta</TableCell>
              <TableCell>Rol</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.role || ''}
                    onChange={(e) => handleUserRoleUpdate(user.id, e.target.value)}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="">
                      <em>Rol Seçin</em>
                    </MenuItem>
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.name}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageTitle title="Yetki Yönetimi" />

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Roller" />
          <Tab label="Rol Yetkileri" />
          <Tab label="Kullanıcı Rolleri" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <RolesTab />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <RolePermissionsTab />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <UserRolesTab />
      </TabPanel>

      {/* Rol Düzenleme/Ekleme Dialog */}
      <Dialog
        open={openRoleDialog}
        onClose={handleCloseRoleDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedRole ? 'Rol Düzenle' : 'Yeni Rol Ekle'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Rol Adı"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Açıklama"
                  multiline
                  rows={2}
                  value={roleForm.description}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>
              {tabValue === 1 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>İzinler</Typography>
                  {Object.entries(PAGE_PERMISSIONS).map(([module, permissions]) => (
                    <Box key={module} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">{module}</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {Object.entries(permissions).map(([permission, value], index) => (
                          <FormControlLabel
                            key={`${module}_${value}_role_${index}`}
                            control={
                              <Checkbox
                                checked={Boolean(roleForm.permissions?.includes(value))}
                                onChange={(e) => {
                                  const newPermissions = e.target.checked
                                    ? [...(roleForm.permissions || []), value]
                                    : (roleForm.permissions || []).filter(p => p !== value);
                                  setRoleForm(prev => ({ ...prev, permissions: newPermissions }));
                                }}
                              />
                            }
                            label={permission}
                          />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoleDialog}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleRoleSave}
            startIcon={<SaveIcon />}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Kullanıcı Rolleri Dialog */}
      <Dialog
        open={userRoleDialogOpen}
        onClose={handleUserRoleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Kullanıcı Rolleri - {selectedUser?.displayName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <List>
              {roles.map((role) => (
                <ListItem
                  key={role.id}
                  dense
                  disableGutters
                  secondaryAction={
                    <Checkbox
                      edge="end"
                      checked={selectedUserRoles.includes(role.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUserRoles(prev => [...prev, role.id]);
                        } else {
                          setSelectedUserRoles(prev => prev.filter(id => id !== role.id));
                        }
                      }}
                    />
                  }
                >
                  <ListItemText
                    primary={role.name}
                    secondary={role.description}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUserRoleDialogClose}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleUserRoleSave}
            startIcon={<SaveIcon />}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default YetkiYonetimi; 