import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  IconButton,
  Paper,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
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

const BinaYapisiDuzenle = ({ open = false, onClose, santiyeId, blokId, binaYapisi, onUpdate }) => {
  const [yapiData, setYapiData] = useState({
    katlar: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // Kat numarası kontrolü için yardımcı fonksiyon
  const isBodrumKat = (katNo) => {
    if (typeof katNo === 'string') {
      return katNo.toString().startsWith('-');
    }
    return false;
  };

  const handleKatEkle = (tip = 'NORMAL') => {
    setYapiData(prev => {
      const yeniKatlar = [...prev.katlar];
      let yeniKatNo;
      const normalKatlar = yeniKatlar.filter(k => !k.no.toString().startsWith('B') && k.no !== '0');
      const bodrumKatlar = yeniKatlar.filter(k => k.no.toString().startsWith('B'));
      const zeminKatVar = yeniKatlar.some(k => k.no === '0');

      switch (tip) {
        case 'BODRUM':
          yeniKatNo = `B${bodrumKatlar.length + 1}`;
          break;
        case 'ZEMIN':
          if (zeminKatVar) return prev;
          yeniKatNo = '0';
          break;
        case 'NORMAL':
          yeniKatNo = normalKatlar.length > 0
            ? (Math.max(...normalKatlar.map(k => parseInt(k.no))) + 1).toString()
            : '1';
          break;
        case 'CATI':
          if (yeniKatlar.some(k => k.tip === 'CATI')) return prev;
          yeniKatNo = 'CATI';
          break;
        default:
          return prev;
      }

      const yeniKat = {
        no: yeniKatNo,
        tip,
        ad: getKatAdi({ no: yeniKatNo, tip }),
        daireler: []
      };

      yeniKatlar.push(yeniKat);
      return { katlar: siralaKatlar(yeniKatlar) };
    });
  };

  const getKatAdi = (kat) => {
    switch (kat.tip) {
      case 'BODRUM':
        return `${kat.no}. Bodrum Kat`;
      case 'ZEMIN':
        return 'Zemin Kat';
      case 'CATI':
        return 'Çatı Katı';
      case 'NORMAL':
      default:
        return `${kat.no}. Kat`;
    }
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

  const handleDaireEkle = (katIndex) => {
    setYapiData(prev => {
      const yeniKatlar = [...prev.katlar];
      const kat = yeniKatlar[katIndex];
      
      if (!Array.isArray(kat.daireler)) {
        kat.daireler = [];
      }

      const daireIndex = kat.daireler.length + 1;
      const yeniDaireNo = `${kat.no}${daireIndex.toString().padStart(2, '0')}`;

      kat.daireler.push({
        no: yeniDaireNo,
        tip: 'NORMAL'
      });

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

  const handleKatDuzenle = (katIndex, alan, deger) => {
    setYapiData(prev => {
      const yeniKatlar = [...prev.katlar];
      const kat = yeniKatlar[katIndex];

      // Eğer tip değişiyorsa, kat numarasını ve adını da güncelle
      if (alan === 'tip') {
        kat.tip = deger;
        
        // Yeni kat numarasını belirle
        switch (deger) {
          case 'BODRUM':
            const bodrumSayisi = yeniKatlar.filter(k => k.tip === 'BODRUM').length;
            kat.no = `B${bodrumSayisi + 1}`;
            break;
          case 'ZEMIN':
            kat.no = '0';
            break;
          case 'CATI':
            kat.no = 'CATI';
            break;
          case 'NORMAL':
            const normalKatlar = yeniKatlar.filter(k => k.tip === 'NORMAL');
            kat.no = (normalKatlar.length + 1).toString();
            break;
        }
        
        // Kat adını güncelle
        kat.ad = getKatAdi(kat);
      } else if (alan === 'no') {
        kat.no = deger;
        kat.ad = getKatAdi(kat);
      } else if (alan === 'ad') {
        kat.ad = deger;
      }

      return { katlar: siralaKatlar(yeniKatlar) };
    });
  };

  const handleKaydet = async () => {
    if (!canManageBinaYapisi) {
      enqueueSnackbar('Bu işlem için yetkiniz bulunmuyor', { variant: 'error' });
      return;
    }

    try {
      setSaving(true);
      
      // Boş daire kontrolü
      const hataliDaireler = yapiData.katlar.some(kat =>
        kat.daireler?.some(daire => !daire.no || !daire.no.trim())
      );

      if (hataliDaireler) {
        enqueueSnackbar('Lütfen tüm daire numaralarını doldurun', { variant: 'error' });
        return;
      }

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
        await onUpdate();
      }

      // Modal'ı kapat
      onClose();

    } catch (error) {
      console.error('Bina yapısı kaydedilirken hata:', error);
      enqueueSnackbar('Bina yapısı kaydedilirken hata oluştu', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        Bina Yapısı Düzenle
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ py: 2 }}>
          {/* Katlar */}
          {yapiData.katlar.map((kat, katIndex) => (
            <Paper key={katIndex} sx={{ p: 3, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
                  <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Kat Tipi</InputLabel>
                    <Select
                      value={kat.tip || 'NORMAL'}
                      label="Kat Tipi"
                      size="small"
                      onChange={(e) => handleKatDuzenle(katIndex, 'tip', e.target.value)}
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
                    size="small"
                    sx={{ width: 100 }}
                    onChange={(e) => handleKatDuzenle(katIndex, 'no', e.target.value)}
                  />

                  <TextField
                    label="Kat Adı"
                    value={kat.ad || getKatAdi(kat)}
                    size="small"
                    sx={{ flex: 1 }}
                    onChange={(e) => handleKatDuzenle(katIndex, 'ad', e.target.value)}
                  />
                </Box>

                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleDaireEkle(katIndex)}
                    sx={{ mr: 1 }}
                  >
                    Daire Ekle
                  </Button>
                  <IconButton
                    color="error"
                    onClick={() => handleKatSil(katIndex)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>

              <Grid container spacing={2}>
                {kat.daireler?.map((daire, daireIndex) => (
                  <Grid item key={daireIndex} xs={12} sm={6} md={4} lg={3}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        position: 'relative',
                        '&:hover .delete-button': {
                          opacity: 1
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Daire No"
                          value={daire.no}
                          onChange={(e) => handleDaireNoGuncelle(katIndex, daireIndex, e.target.value)}
                        />
                        <FormControl fullWidth size="small">
                          <InputLabel>Daire Tipi</InputLabel>
                          <Select
                            value={daire.tip || 'NORMAL'}
                            label="Daire Tipi"
                            onChange={(e) => {
                              setYapiData(prev => {
                                const yeniKatlar = [...prev.katlar];
                                yeniKatlar[katIndex].daireler[daireIndex].tip = e.target.value;
                                return { katlar: yeniKatlar };
                              });
                            }}
                          >
                            {Object.entries(DAIRE_TIPLERI).map(([key, label]) => (
                              <MenuItem key={key} value={key}>{label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                      <IconButton
                        size="small"
                        className="delete-button"
                        onClick={() => handleDaireSil(katIndex, daireIndex)}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          bgcolor: 'background.paper'
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          ))}

          {/* Kat Ekleme Butonları */}
          <Box sx={{ display: 'flex', gap: 1, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleKatEkle('NORMAL')}
            >
              Normal Kat
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => handleKatEkle('BODRUM')}
            >
              Bodrum Kat
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => handleKatEkle('ZEMIN')}
              disabled={yapiData.katlar.some(k => k.tip === 'ZEMIN')}
            >
              Zemin Kat
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => handleKatEkle('CATI')}
              disabled={yapiData.katlar.some(k => k.tip === 'CATI')}
            >
              Çatı Katı
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleKaydet}
          disabled={saving}
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BinaYapisiDuzenle; 