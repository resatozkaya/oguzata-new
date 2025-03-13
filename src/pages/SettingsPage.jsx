import React, { useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  Paper,
  Button,
  FormGroup,
  FormControlLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from '../components/auth/ChangePasswordModal';

const SettingsPage = () => {
  const { isDarkMode, toggleDarkMode, sidebarColor, changeSidebarColor } = useTheme();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formSettings, setFormSettings] = useState({
    emailNotifications: true,
    instantNotifications: true,
    autoSave: true
  });

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
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Ayarlar</Typography>
          <Button
            variant="contained"
            sx={{ bgcolor: '#3f51b5' }}
            onClick={handleSaveSettings}
          >
            DEĞİŞİKLİKLERİ KAYDET
          </Button>
        </Box>

        <FormGroup>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Tema Rengi</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Uygulamanın ana rengini değiştirin
            </Typography>
            <Select
              value={sidebarColor}
              onChange={(e) => changeSidebarColor(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="#6a1b9a">Mor</MenuItem>
              <MenuItem value="#1a237e">Mavi</MenuItem>
              <MenuItem value="#1b5e20">Yeşil</MenuItem>
              <MenuItem value="#b71c1c">Kırmızı</MenuItem>
            </Select>
          </Box>

          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isDarkMode}
                  onChange={toggleDarkMode}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle1">Karanlık Mod</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Karanlık temayı etkinleştirin
                  </Typography>
                </Box>
              }
            />
          </Box>

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

          <Box sx={{ mt: 4 }}>
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
          </Box>
        </FormGroup>
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
    </Box>
  );
};

export default SettingsPage;
