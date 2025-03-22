import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { usePermission } from '../../../contexts/PermissionContext';
import { PAGE_PERMISSIONS } from '../../../constants/permissions';
import { binaService } from '../../../services/binaService';
import { enqueueSnackbar } from 'notistack';

const DAIRE_TIPLERI = {
  NORMAL: 'Normal',
  DUBLEKS: 'Dubleks',
  TERAS: 'Teras',
  BAHCE: 'Bahçe'
};

const KAT_TIPLERI = {
  BODRUM: 'Bodrum Kat',
  ZEMIN: 'Zemin Kat',
  NORMAL: 'Normal Kat',
  ARA: 'Ara Kat',
  TERAS: 'Teras Kat',
  CATI: 'Çatı Kat'
};

const BinaYapisiDuzenle = ({ santiyeId, blokId, binaYapisi, onClose, onUpdate }) => {
  const [yapiData, setYapiData] = useState({
    katlar: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingKatNo, setEditingKatNo] = useState(null);

  const { hasPermission } = usePermission();
  const canManageBinaYapisi = hasPermission(PAGE_PERMISSIONS.EKSIKLIK.BINA_YAPISI);

  useEffect(() => {
    if (binaYapisi?.bloklar?.[0]) {
      const katlar = binaYapisi.bloklar[0].katlar || [];
      // Katları sırala: Çatı > Normal Katlar > Zemin Kat > Bodrum Katlar
      const siraliKatlar = [...katlar].sort((a, b) => {
        const getKatSira = (kat) => {
          if (kat.tip === 'CATI') return 1000;
          if (kat.tip === 'TERAS') return 900;
          if (kat.no === '0') return 0;
          if (isBodrumKat(kat.no)) return parseInt(kat.no) - 1000;
          return parseInt(kat.no) || 0;
        };
        return getKatSira(b) - getKatSira(a);
      });
      setYapiData({ katlar: siraliKatlar });
    }
  }, [binaYapisi]);

  useEffect(() => {
    // Yetki durumunu logla
    console.log('Bina Yapısı Düzenleme Yetki Durumu:', {
      canManageBinaYapisi,
      permission: PAGE_PERMISSIONS.EKSIKLIK.BINA_YAPISI
    });
  }, [canManageBinaYapisi]);

  // Kat numarası kontrolü için yardımcı fonksiyon
  const isBodrumKat = (katNo) => {
    if (typeof katNo === 'string') {
      return katNo.toString().startsWith('-');
    }
    return false;
  };

  const handleBodrumKatEkle = () => {
    setYapiData(prev => {
      const yeniKatlar = [...prev.katlar];
      const bodrumKatSayisi = yeniKatlar.filter(k => isBodrumKat(k.no)).length;
      const yeniKatNo = -(bodrumKatSayisi + 1);
      
      yeniKatlar.push({
        no: yeniKatNo.toString(),
        tip: 'BODRUM',
        ad: `${yeniKatNo}. Bodrum Kat`,
        daireler: []
      });

      // Katları sırala
      return { katlar: siralaKatlar(yeniKatlar) };
    });
  };

  const handleZeminKatEkle = () => {
    setYapiData(prev => {
      const yeniKatlar = [...prev.katlar];
      const yeniKat = {
        no: '0',
        tip: 'ZEMIN',
        ad: 'Zemin Kat',
        daireler: []
      };
      
      yeniKatlar.push(yeniKat);
      return { katlar: siralaKatlar(yeniKatlar) };
    });
  };

  const handleNormalKatEkle = () => {
    setYapiData(prev => {
      const yeniKatlar = [...prev.katlar];
      const normalKatSayisi = yeniKatlar.filter(k => !isNaN(k.no) && parseInt(k.no) > 0).length;
      
      yeniKatlar.push({
        no: (normalKatSayisi + 1).toString(),
        tip: 'NORMAL',
        ad: `${normalKatSayisi + 1}. Kat`,
        daireler: []
      });
      return { katlar: siralaKatlar(yeniKatlar) };
    });
  };

  const handleCatiKatEkle = () => {
    setYapiData(prev => {
      const yeniKatlar = [...prev.katlar];
      yeniKatlar.push({
        no: 'CATI',
        tip: 'CATI',
        ad: 'Çatı Katı',
        daireler: []
      });
      return { katlar: siralaKatlar(yeniKatlar) };
    });
  };

  const siralaKatlar = (katlar) => {
    return [...katlar].sort((a, b) => {
      const getKatSira = (kat) => {
        if (kat.tip === 'CATI') return 1000;
        if (kat.tip === 'TERAS') return 900;
        if (kat.no === '0') return 0;
        if (isBodrumKat(kat.no)) return parseInt(kat.no) - 1000;
        return parseInt(kat.no) || 0;
      };
      return getKatSira(b) - getKatSira(a);
    });
  };

  const handleKatDuzenle = (katIndex, yeniAd, yeniTip) => {
    setYapiData(prev => {
      const yeniKatlar = [...prev.katlar];
      yeniKatlar[katIndex] = {
        ...yeniKatlar[katIndex],
        ad: yeniAd,
        tip: yeniTip
      };
      return { katlar: yeniKatlar };
    });
    setEditingKatNo(null);
  };

  const handleDaireEkle = (katIndex) => {
    setYapiData(prev => {
      const yeniKatlar = [...prev.katlar];
      const kat = yeniKatlar[katIndex];
      
      const sonDaireNo = kat.daireler.length > 0 
        ? Math.max(...kat.daireler.map(d => parseInt(d.no.replace(/\D/g, '')) || 0)) 
        : 0;
      
      kat.daireler = [
        ...kat.daireler,
        {
          no: `${kat.no}${(sonDaireNo + 1).toString().padStart(2, '0')}`,
          tip: 'NORMAL'
        }
      ];
      return { katlar: yeniKatlar };
    });
  };

  const handleDaireSil = (katIndex, daireIndex) => {
    setYapiData(prev => {
      const yeniKatlar = [...prev.katlar];
      yeniKatlar[katIndex].daireler.splice(daireIndex, 1);
      return { katlar: yeniKatlar };
    });
  };

  const handleKatSil = (katIndex) => {
    setYapiData(prev => {
      const yeniKatlar = [...prev.katlar];
      yeniKatlar.splice(katIndex, 1);
      return { katlar: yeniKatlar };
    });
  };

  const handleDaireNoGuncelle = (katIndex, daireIndex, yeniNo) => {
    setYapiData(prev => {
      const yeniKatlar = [...prev.katlar];
      yeniKatlar[katIndex].daireler[daireIndex].no = yeniNo;
      return { katlar: yeniKatlar };
    });
  };

  const handleKaydet = async () => {
    if (!canManageBinaYapisi) {
      enqueueSnackbar('Bu işlem için yetkiniz bulunmuyor', { variant: 'error' });
      return;
    }

    try {
      setSaving(true);
      
      // Bina yapısını kaydet
      await binaService.setBinaYapisi(santiyeId, blokId, {
        bloklar: [{
          id: blokId,
          katlar: yapiData.katlar
        }]
      });
      
      // Başarı mesajı göster
      enqueueSnackbar('Bina yapısı başarıyla kaydedildi', { variant: 'success' });
      
      // Parent bileşene bildir ve güncelleme yap
      if (onUpdate) {
        // Güncelleme işlemini bekle
        await onUpdate();
      }
    } catch (error) {
      console.error('Bina yapısı kaydedilirken hata:', error);
      enqueueSnackbar('Bina yapısı kaydedilirken hata oluştu', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Kat Ekleme Butonları */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowDownwardIcon />}
          onClick={handleBodrumKatEkle}
        >
          Bodrum Kat Ekle
        </Button>
        <Button
          variant="outlined"
          onClick={handleZeminKatEkle}
        >
          Zemin Kat Ekle
        </Button>
        <Button
          variant="outlined"
          startIcon={<ArrowUpwardIcon />}
          onClick={handleNormalKatEkle}
        >
          Normal Kat Ekle
        </Button>
        <Button
          variant="outlined"
          onClick={handleCatiKatEkle}
        >
          Çatı Katı Ekle
        </Button>
      </Stack>

      {/* Katlar */}
      {yapiData.katlar.map((kat, katIndex) => (
        <Box key={katIndex} sx={{ mb: 4, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            {editingKatNo === katIndex ? (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, mr: 2 }}>
                <TextField
                  label="Kat Adı"
                  value={kat.ad || ''}
                  size="small"
                  onChange={(e) => {
                    const yeniKatlar = [...yapiData.katlar];
                    yeniKatlar[katIndex].ad = e.target.value;
                    setYapiData({ katlar: yeniKatlar });
                  }}
                  sx={{ flex: 1 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Kat Tipi</InputLabel>
                  <Select
                    value={kat.tip || 'NORMAL'}
                    label="Kat Tipi"
                    onChange={(e) => {
                      const yeniKatlar = [...yapiData.katlar];
                      yeniKatlar[katIndex].tip = e.target.value;
                      setYapiData({ katlar: yeniKatlar });
                    }}
                  >
                    {Object.entries(KAT_TIPLERI).map(([key, label]) => (
                      <MenuItem key={key} value={key}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setEditingKatNo(null)}
                >
                  Tamam
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1">
                  {kat.ad || (
                    kat.tip === 'BODRUM' ? `${kat.no}. Bodrum Kat` :
                    kat.tip === 'ZEMIN' ? 'Zemin Kat' :
                    kat.tip === 'CATI' ? 'Çatı Katı' :
                    kat.tip === 'TERAS' ? 'Teras Kat' :
                    kat.tip === 'ARA' ? 'Ara Kat' :
                    `${kat.no}. Kat`
                  )}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setEditingKatNo(katIndex)}
                  sx={{ ml: 1 }}
                >
                  <EditIcon />
                </IconButton>
              </Box>
            )}
            <IconButton onClick={() => handleKatSil(katIndex)} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>

          <Grid container spacing={2}>
            {kat.daireler.map((daire, daireIndex) => (
              <Grid item xs={12} sm={6} md={4} key={daireIndex}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <TextField
                      label="Daire No/Adı"
                      value={daire.no}
                      size="small"
                      fullWidth
                      sx={{ mr: 1 }}
                      onChange={(e) => handleDaireNoGuncelle(katIndex, daireIndex, e.target.value)}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDaireSil(katIndex, daireIndex)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <FormControl fullWidth size="small">
                    <InputLabel>Daire Tipi</InputLabel>
                    <Select
                      value={daire.tip || 'NORMAL'}
                      label="Daire Tipi"
                      onChange={(e) => {
                        const yeniKatlar = [...yapiData.katlar];
                        yeniKatlar[katIndex].daireler[daireIndex].tip = e.target.value;
                        setYapiData({ katlar: yeniKatlar });
                      }}
                    >
                      {Object.entries(DAIRE_TIPLERI).map(([key, label]) => (
                        <MenuItem key={key} value={key}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Button
            startIcon={<AddIcon />}
            onClick={() => handleDaireEkle(katIndex)}
            sx={{ mt: 2 }}
          >
            Daire Ekle
          </Button>
        </Box>
      ))}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onClose}>İptal</Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleKaydet}
          disabled={saving}
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </Box>
    </Box>
  );
};

export default BinaYapisiDuzenle; 