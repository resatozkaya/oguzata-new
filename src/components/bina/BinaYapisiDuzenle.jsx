import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  IconButton,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Divider,
  Tooltip,
  Alert,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTheme } from '@mui/material/styles';

const BinaYapisiDuzenle = ({ open, onClose, blok, onUpdate }) => {
  const [katlar, setKatlar] = useState([]);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Debug için blok verisini logla
  useEffect(() => {
    console.log('Gelen blok verisi:', blok);
  }, [blok]);

  useEffect(() => {
    if (blok?.katlar) {
      const siraliKatlar = [...blok.katlar].sort((a, b) => {
        const getKatNo = (no) => {
          if (typeof no === 'string' && no.startsWith('B')) return -parseInt(no.slice(1));
          if (no === '0') return 0;
          return parseInt(no);
        };
        return getKatNo(b.no) - getKatNo(a.no);
      });
      setKatlar(siraliKatlar);
      console.log('Sıralı katlar:', siraliKatlar);
    }
  }, [blok]);

  const handleKatEkle = (tip) => {
    let yeniNo = '';
    let yeniAd = '';

      switch (tip) {
        case 'BODRUM':
        const bodrumKatlar = katlar.filter(k => k.tip === 'BODRUM').length;
        yeniNo = `B${bodrumKatlar + 1}`;
        yeniAd = `${yeniNo}. Bodrum Kat`;
          break;
        case 'ZEMIN':
        yeniNo = '0';
        yeniAd = 'Zemin Kat';
        break;
      case 'NORMAL':
        const normalKatlar = katlar.filter(k => k.tip === 'NORMAL');
        const enYuksekKatNo = Math.max(...normalKatlar.map(k => parseInt(k.no) || 0), 0);
        yeniNo = `${enYuksekKatNo + 1}`;
        yeniAd = `${yeniNo}. Normal Kat`;
          break;
        case 'CATI':
        yeniNo = 'C';
        yeniAd = 'Çatı Katı';
          break;
      case 'ARA':
        yeniNo = 'A';
        yeniAd = 'Ara Kat';
          break;
      }

      const yeniKat = {
      no: yeniNo,
        tip,
      ad: yeniAd,
        daireler: []
      };

    setKatlar(prev => [...prev, yeniKat]);
  };

  const handleKatDuzenle = (katIndex, field, value) => {
    setKatlar(prev => {
      const yeniKatlar = [...prev];
      const kat = { ...yeniKatlar[katIndex] };
      kat[field] = value;

      // Kat adını otomatik güncelle
      if (field === 'tip' || field === 'no') {
        switch (kat.tip) {
          case 'BODRUM':
            kat.ad = `${kat.no}. Bodrum Kat`;
            break;
          case 'ZEMIN':
            kat.ad = 'Zemin Kat';
            break;
          case 'NORMAL':
            kat.ad = `${kat.no}. Normal Kat`;
            break;
          case 'CATI':
            kat.ad = 'Çatı Katı';
            break;
          case 'ARA':
            kat.ad = 'Ara Kat';
            break;
        }
      }

      yeniKatlar[katIndex] = kat;
      return yeniKatlar;
    });
  };

  const handleKatSil = (katIndex) => {
    setKatlar(prev => prev.filter((_, index) => index !== katIndex));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: isDarkMode ? '#1a1a1a' : '#fff',
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: isDarkMode ? '#2c2c2c' : '#f5f5f5'
      }}>
        <Typography variant="h6">
          Bina Yapısı Düzenle
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Paper sx={{ p: 2, bgcolor: isDarkMode ? '#2c2c2c' : '#f8f9fa' }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                onClick={() => handleKatEkle('BODRUM')}
                startIcon={<AddIcon />}
              >
                Bodrum Kat Ekle
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleKatEkle('ZEMIN')}
                startIcon={<AddIcon />}
                disabled={katlar.some(k => k.tip === 'ZEMIN')}
              >
                Zemin Kat Ekle
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleKatEkle('NORMAL')}
                startIcon={<AddIcon />}
              >
                Normal Kat Ekle
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleKatEkle('CATI')}
                startIcon={<AddIcon />}
                disabled={katlar.some(k => k.tip === 'CATI')}
              >
                Çatı Katı Ekle
              </Button>
            </Stack>
          </Paper>
          </Box>

        <Stack spacing={2}>
          {katlar.map((kat, katIndex) => (
            <Card key={katIndex} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                  <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Kat Tipi</InputLabel>
                    <Select
                      value={kat.tip || 'NORMAL'}
                      label="Kat Tipi"
                      onChange={(e) => handleKatDuzenle(katIndex, 'tip', e.target.value)}
                      size="small"
                    >
                      <MenuItem value="BODRUM">Bodrum Kat</MenuItem>
                      <MenuItem value="ZEMIN">Zemin Kat</MenuItem>
                      <MenuItem value="NORMAL">Normal Kat</MenuItem>
                      <MenuItem value="CATI">Çatı Katı</MenuItem>
                      <MenuItem value="ARA">Ara Kat</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Kat No"
                    value={kat.no || ''}
                    onChange={(e) => handleKatDuzenle(katIndex, 'no', e.target.value)}
                    size="small"
                    sx={{ width: 100 }}
                  />

                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    {kat.ad || `${kat.no}. Kat`}
                  </Typography>

                  <Tooltip title="Katı Sil">
                  <IconButton 
                    size="small" 
                    onClick={() => handleKatSil(katIndex)}
                      color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                  </Tooltip>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {kat.daireler?.map((daire, daireIndex) => (
                    <Paper
                    key={daireIndex}
                      sx={{
                        p: 2,
                        width: 200,
                        bgcolor: isDarkMode ? '#363636' : '#f8f9fa'
                      }}
                    >
                      <Stack spacing={2}>
                        <TextField
                          label="Daire No"
                          value={daire.no}
                          size="small"
                          fullWidth
                        />
                        <FormControl fullWidth size="small">
                          <InputLabel>Daire Tipi</InputLabel>
                          <Select
                            value={daire.tip || 'NORMAL'}
                            label="Daire Tipi"
                          >
                            <MenuItem value="NORMAL">Normal</MenuItem>
                            <MenuItem value="DUBLEKS">Dubleks</MenuItem>
                            <MenuItem value="TERAS">Teras</MenuItem>
                            <MenuItem value="BAHCE">Bahçe</MenuItem>
                          </Select>
                        </FormControl>
                      </Stack>
                    </Paper>
                  ))}
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {}}
                    sx={{ height: 40 }}
                  >
                    Daire Ekle
                  </Button>
              </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {katlar.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Henüz hiç kat eklenmemiş. Yukarıdaki butonları kullanarak kat ekleyebilirsiniz.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose}>İptal</Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => {
            if (onUpdate) {
              onUpdate(katlar);
            }
            onClose();
          }}
        >
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BinaYapisiDuzenle; 