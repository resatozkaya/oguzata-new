import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { usePermission } from '../../../hooks/usePermission';
import { PAGE_PERMISSIONS } from '../../../constants/permissions';
import { binaService } from '../../../services/binaService';

const BlokYonetimi = ({ santiyeId, onClose, onUpdate }) => {
  const [bloklar, setBloklar] = useState([]);
  const [yeniBlokAdi, setYeniBlokAdi] = useState('');
  const [duzenlemeModu, setDuzenlemeModu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Yetki kontrolü
  const { hasPermission: canManageBloklar } = usePermission(PAGE_PERMISSIONS.EKSIKLIK.BLOK_YONETIMI);

  useEffect(() => {
    const bloklariGetir = async () => {
      if (!santiyeId) return;

      try {
        setLoading(true);
        const data = await binaService.getBloklar(santiyeId);
        setBloklar(data || []);
      } catch (error) {
        console.error('Bloklar yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    bloklariGetir();
  }, [santiyeId]);

  const handleBlokEkle = async () => {
    if (!canManageBloklar || !yeniBlokAdi.trim()) return;

    try {
      setSaving(true);
      const yeniBlok = await binaService.createBlok(santiyeId, {
        ad: yeniBlokAdi.trim()
      });
      setBloklar([...bloklar, yeniBlok]);
      setYeniBlokAdi('');
      onUpdate();
    } catch (error) {
      console.error('Blok eklenirken hata:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBlokSil = async (blokId) => {
    if (!canManageBloklar) return;

    try {
      setSaving(true);
      await binaService.deleteBlok(santiyeId, blokId);
      setBloklar(bloklar.filter(blok => blok.id !== blokId));
      onUpdate();
    } catch (error) {
      console.error('Blok silinirken hata:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBlokGuncelle = async (blokId, yeniAd) => {
    if (!canManageBloklar || !yeniAd.trim()) return;

    try {
      setSaving(true);
      await binaService.updateBlok(santiyeId, blokId, {
        ad: yeniAd.trim()
      });
      setBloklar(bloklar.map(blok => 
        blok.id === blokId ? { ...blok, ad: yeniAd.trim() } : blok
      ));
      setDuzenlemeModu(null);
      onUpdate();
    } catch (error) {
      console.error('Blok güncellenirken hata:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!canManageBloklar) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Blok Yönetimi
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs>
            <TextField
              label="Yeni Blok Adı"
              value={yeniBlokAdi}
              onChange={(e) => setYeniBlokAdi(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleBlokEkle}
              disabled={saving || !yeniBlokAdi.trim()}
            >
              Ekle
            </Button>
          </Grid>
        </Grid>
      </Box>

      <List>
        {bloklar.map((blok) => (
          <ListItem
            key={blok.id}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              mb: 1
            }}
          >
            {duzenlemeModu === blok.id ? (
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <TextField
                    value={blok.ad}
                    onChange={(e) => {
                      setBloklar(bloklar.map(b =>
                        b.id === blok.id ? { ...b, ad: e.target.value } : b
                      ));
                    }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item>
                  <Button
                    startIcon={<SaveIcon />}
                    onClick={() => handleBlokGuncelle(blok.id, blok.ad)}
                    disabled={saving}
                    size="small"
                  >
                    Kaydet
                  </Button>
                </Grid>
              </Grid>
            ) : (
              <>
                <ListItemText primary={blok.ad} />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => setDuzenlemeModu(blok.id)}
                    disabled={saving}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleBlokSil(blok.id)}
                    disabled={saving}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default BlokYonetimi; 