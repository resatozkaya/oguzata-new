import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Alert,
  FormGroup,
  Snackbar
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import PageTitle from '../components/PageTitle';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from '../components/auth/ChangePasswordModal';

const SettingsPage = () => {
  const { currentUser, updateUserProfile, updatePassword, error } = useAuth();
  const { darkMode, toggleDarkMode, sidebarColor, changeSidebarColor } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formSettings, setFormSettings] = useState({
    emailNotifications: true,
    instantNotifications: true,
    autoSave: true
  });

  const themeColors = [
    { name: 'Mor', value: '#6a1b9a' },
    { name: 'Lacivert', value: '#1a237e' },
    { name: 'Turkuaz', value: '#00bcd4' },
    { name: 'Yeşil', value: '#1b5e20' },
    { name: 'Kırmızı', value: '#f44336' },
    { name: 'Sarı', value: '#ffd700' },
    { name: 'Amber', value: '#ffc107' },
    { name: 'Turuncu', value: '#e65100' },
    { name: 'Patlıcan', value: '#991199' },
    { name: 'Kahverengi', value: '#795548' },
    { name: 'Gri', value: '#607d8b' },
    { name: 'İndigo', value: '#3f51b5' }
  ];

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData(e.target);
      const updates = {
        displayName: formData.get('displayName'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phone: formData.get('phone'),
        department: formData.get('department'),
        position: formData.get('position'),
      };

      await updateUserProfile(updates);
      setMessage('Profil başarıyla güncellendi');
    } catch (error) {
      setMessage('Profil güncellenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('Yeni şifreler eşleşmiyor');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await updatePassword(passwordData.currentPassword, passwordData.newPassword);
      setMessage('Şifre başarıyla güncellendi');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setMessage('Şifre güncellenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchChange = (name) => {
    setFormSettings(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleSaveSettings = () => {
    // Form ayarlarını localStorage'a kaydet
    localStorage.setItem('formSettings', JSON.stringify(formSettings));
    
    // Başarı mesajını göster
    setShowSuccess(true);
    
    // 1 saniye sonra ana sayfaya yönlendir
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  return (
    <Container maxWidth="md">
      <PageTitle title="Ayarlar" />
      
      {message && (
        <Alert severity={message.includes('hata') ? 'error' : 'success'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tema Ayarları
        </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Tema Rengi</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Uygulamanın ana rengini değiştirin
            </Typography>
            <Select
              value={sidebarColor}
              onChange={(e) => changeSidebarColor(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {themeColors.map((color) => (
              <MenuItem 
                key={color.value} 
                value={color.value}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: color.value,
                    border: '2px solid',
                    borderColor: 'divider'
                  }}
                />
                {color.name}
              </MenuItem>
            ))}
            </Select>
          </Box>

            <FormControlLabel
          control={<Switch checked={darkMode} onChange={toggleDarkMode} />}
          label="Koyu Tema"
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Profil Bilgileri
                  </Typography>
        <Box component="form" onSubmit={handleProfileUpdate} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="displayName"
            label="Görünen Ad"
            name="displayName"
            defaultValue={currentUser?.displayName}
          />
          <TextField
            margin="normal"
            fullWidth
            id="firstName"
            label="Ad"
            name="firstName"
            defaultValue={currentUser?.firstName}
          />
          <TextField
            margin="normal"
            fullWidth
            id="lastName"
            label="Soyad"
            name="lastName"
            defaultValue={currentUser?.lastName}
          />
          <TextField
            margin="normal"
            fullWidth
            id="phone"
            label="Telefon"
            name="phone"
            defaultValue={currentUser?.phone}
          />
          <TextField
            margin="normal"
            fullWidth
            id="department"
            label="Departman"
            name="department"
            defaultValue={currentUser?.department}
          />
          <TextField
            margin="normal"
            fullWidth
            id="position"
            label="Pozisyon"
            name="position"
            defaultValue={currentUser?.position}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            Profili Güncelle
          </Button>
          </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Şifre Değiştir
                  </Typography>
        <Box component="form" onSubmit={handlePasswordChange} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            name="currentPassword"
            label="Mevcut Şifre"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, currentPassword: e.target.value })
            }
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="newPassword"
            label="Yeni Şifre"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, newPassword: e.target.value })
            }
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Yeni Şifre (Tekrar)"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, confirmPassword: e.target.value })
            }
          />
            <Button 
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            Şifreyi Değiştir
            </Button>
          </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Form Ayarları
        </Typography>
        <FormGroup>
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formSettings.emailNotifications}
                  onChange={() => handleSwitchChange('emailNotifications')}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle1">E-posta Bildirimleri</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Önemli güncellemeler ve bildirimler için e-posta al
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formSettings.instantNotifications}
                  onChange={() => handleSwitchChange('instantNotifications')}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle1">Anlık Bildirimler</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Tarayıcı bildirimleri ile anında haberdar ol
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formSettings.autoSave}
                  onChange={() => handleSwitchChange('autoSave')}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle1">Otomatik Kaydetme</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Değişiklikleri otomatik olarak kaydet
                  </Typography>
                </Box>
              }
            />
          </Box>
        </FormGroup>
      </Paper>

      <Paper sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Güvenlik</Typography>
        <Button 
          variant="outlined" 
          onClick={() => setShowPasswordModal(true)}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(63, 81, 181, 0.04)'
            }
          }}
        >
          ŞİFRE DEĞİŞTİR
        </Button>
      </Paper>

      <Snackbar
        open={showSuccess}
        autoHideDuration={1000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Ayarlar başarıyla kaydedildi!
        </Alert>
      </Snackbar>

      <ChangePasswordModal 
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </Container>
  );
};

export default SettingsPage;
