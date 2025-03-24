import { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { 
  Box, 
  Typography, 
  Switch, 
  FormControlLabel,
  Paper,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Container
} from '@mui/material';

const Settings = () => {
  const { darkMode, toggleDarkMode, sidebarColor, changeSidebarColor } = useContext(ThemeContext);

  const colors = [
    { name: 'Mor', value: '#6a1b9a' },
    { name: 'Mavi', value: '#1a237e' },
    { name: 'Yeşil', value: '#1b5e20' },
    { name: 'Kırmızı', value: '#b71c1c' },
  ];

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
            Ayarlar
          </Typography>

          {/* Tema Ayarları */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
              Tema Ayarları
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Tema Rengi</InputLabel>
              <Select
                value={sidebarColor}
                onChange={(e) => changeSidebarColor(e.target.value)}
                label="Tema Rengi"
              >
                {colors.map((color) => (
                  <MenuItem key={color.value} value={color.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: 1, 
                          bgcolor: color.value,
                          border: '2px solid #ddd'
                        }} 
                      />
                      {color.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={toggleDarkMode}
                  color="primary"
                />
              }
              label="Koyu Tema"
            />
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Form Ayarları */}
          <Box>
            <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
              Form Ayarları
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={<Switch defaultChecked color="primary" />}
                label="E-posta Bildirimleri"
              />
              <FormControlLabel
                control={<Switch defaultChecked color="primary" />}
                label="Anlık Bildirimler"
              />
              <FormControlLabel
                control={<Switch defaultChecked color="primary" />}
                label="Otomatik Kaydetme"
              />
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Settings; 