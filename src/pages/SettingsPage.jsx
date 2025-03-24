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
  Alert,
  FormGroup,
  Snackbar
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import PageTitle from '../components/PageTitle';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const { darkMode, toggleDarkMode, sidebarColor, changeSidebarColor } = useTheme();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [formSettings, setFormSettings] = useState({
    emailNotifications: true,
    instantNotifications: true,
    autoSave: true
  });

  const themeColors = [
    { name: 'Mor', value: '#6a1b9a' },
    { name: 'Lacivert', value: '#1a237e' },
    { name: 'Turkuaz', value: '#00bcd4' },
    { name: 'Koyu Turkuaz', value: '#006064' },
    { name: 'Yeşil', value: '#1b5e20' },
    { name: 'Koyu Yeşil', value: '#1b5e20' },
    { name: 'Koyu Kırmızı', value: '#b71c1c' },
    { name: 'Pembe', value: '#e91e63' },
    { name: 'Koyu Pembe', value: '#880e4f' },
    { name: 'Kahverengi', value: '#795548' },
    { name: 'Koyu Kahverengi', value: '#3e2723' },
    { name: 'Gri', value: '#9e9e9e' },
    { name: 'Koyu Gri', value: '#212121' },
    { name: 'Gece Mavisi', value: '#01579b' },
    { name: 'Orman Yeşili', value: '#2e7d32' },
    { name: 'Zeytin Yeşili', value: '#827717' },
    { name: 'Bordo', value: '#800000' },
    { name: 'Şarap', value: '#722f37' },
    { name: 'Kiremit', value: '#a0522d' },
    { name: 'Tarçın', value: '#d2691e' },
    { name: 'Petrol Mavisi', value: '#004d66' },
    { name: 'Nar', value: '#c41e3a' },
    { name: 'Vişne', value: '#de3163' },
    { name: 'Erik', value: '#660066' },
    { name: 'Mürdüm', value: '#a50b5e' },
    { name: 'Patlıcan', value: '#991199' }
  ];

  const handleSwitchChange = (name) => {
    setFormSettings(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
    setShowSuccess(true);
  };

  return (
    <Container maxWidth="md">
      <PageTitle title="Ayarlar" />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
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
          control={
            <Switch 
              checked={darkMode} 
              onChange={toggleDarkMode}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="subtitle1">Koyu Tema</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Koyu renk modunu aktifleştir
              </Typography>
            </Box>
          }
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          Form Ayarları
        </Typography>
        <FormGroup>
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formSettings.emailNotifications}
                  onChange={() => handleSwitchChange('emailNotifications')}
                  color="primary"
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
                  color="primary"
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
                  color="primary"
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
    </Container>
  );
};

export default SettingsPage;
