import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Grid,
  Paper,
  LinearProgress,
  Fade
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { binaService } from '../../services/binaService';
import { useSantiye } from '../../contexts/SantiyeContext';

// EditDialog bileşeni
const EditDialog = ({ open, item, onClose, onSave }) => {
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    if (open && item?.data?.no) {
      setLocalValue(item.data.no);
    }
  }, [open, item]);

  const handleSave = () => {
    if (localValue.trim()) {
      onSave(localValue.trim());
      setLocalValue('');
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={() => {
        setLocalValue('');
        onClose();
      }}
    >
      <DialogTitle>
        {item?.type === 'KAT' ? 'Kat Numarasını Düzenle' : 'Daire Numarasını Düzenle'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={item?.type === 'KAT' ? 'Yeni Kat Numarası' : 'Yeni Daire Numarası'}
          type="text"
          fullWidth
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const BinaYapilandirma = ({ 
  open, 
  onClose, 
  binaYapisi, 
  seciliSantiye, 
  seciliBlok,
  onSave 
}) => {
  const { setSeciliSantiye } = useSantiye();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [yerelYapi, setYerelYapi] = useState({
    bloklar: [{
      ad: seciliBlok?.ad || '',
      katlar: []
    }]
  });
  const [editingItem, setEditingItem] = useState(null);

  // Bina yapısını yükle
  useEffect(() => {
    if (binaYapisi?.bloklar?.[0]) {
      setYerelYapi(binaYapisi);
    }
  }, [binaYapisi]);

  // Kat ekleme fonksiyonu
  const katEkle = (tip) => {
    const yeniKatlar = [...yerelYapi.bloklar[0].katlar];
    
    // Kat numarasını belirle
    let katNo;
    if (tip === 'BODRUM') {
      const bodrumSayisi = yeniKatlar.filter(k => k.no.startsWith('B')).length;
      katNo = `B${bodrumSayisi + 1}`;
    } else if (tip === 'ZEMIN') {
      katNo = '0';
    } else {
      const normalKatSayisi = yeniKatlar.filter(k => !k.no.startsWith('B') && k.no !== '0').length;
      katNo = `${normalKatSayisi + 1}`;
    }

    // Yeni katı ekle
    yeniKatlar.push({
      no: katNo,
      tip: tip,
      daireler: [],
      olusturmaTarihi: new Date().toISOString(),
      guncellemeTarihi: new Date().toISOString()
    });

    // Katları sırala
    const siraliKatlar = yeniKatlar.sort((a, b) => {
      const getKatNo = (no) => {
        if (no.startsWith('B')) return -parseInt(no.slice(1));
        if (no === '0') return 0;
        return parseInt(no);
      };
      return getKatNo(b.no) - getKatNo(a.no);
    });

    setYerelYapi({
      bloklar: [{
        ...yerelYapi.bloklar[0],
        katlar: siraliKatlar
      }]
    });
  };

  // Kat silme fonksiyonu
  const katSil = (katIndex) => {
    const yeniKatlar = yerelYapi.bloklar[0].katlar.filter((_, index) => index !== katIndex);
    setYerelYapi({
      bloklar: [{
        ...yerelYapi.bloklar[0],
        katlar: yeniKatlar
      }]
    });
  };

  // Daireyi ekle
  const daireEkle = (katIndex) => {
    const yeniKatlar = [...yerelYapi.bloklar[0].katlar];
    const kat = yeniKatlar[katIndex];
    
    // Kat numarasını al
    const katNo = kat.no;
    
    // Daire sayısını al
    const daireSayisi = kat.daireler?.length || 0;
    
    // Daire numarasını formatla: BlokAd + KatNo + DaireNo
    // Örnek: A101, A102, B201, B202
    const yeniDaireNo = `${seciliBlok.ad}${katNo}${(daireSayisi + 1).toString().padStart(2, '0')}`;
    
    kat.daireler = [...(kat.daireler || []), {
      no: yeniDaireNo,
      tip: 'DAIRE',
      isim: `${yeniDaireNo} Nolu Daire`
    }];

    setYerelYapi({
      bloklar: [{
        ...yerelYapi.bloklar[0],
        katlar: yeniKatlar
      }]
    });
  };

  // Daire silme
  const daireSil = (katIndex, daireIndex) => {
    const yeniKatlar = [...yerelYapi.bloklar[0].katlar];
    yeniKatlar[katIndex].daireler = yeniKatlar[katIndex].daireler.filter((_, index) => index !== daireIndex);
    
    setYerelYapi({
      bloklar: [{
        ...yerelYapi.bloklar[0],
        katlar: yeniKatlar
      }]
    });
  };

  // Progress simulasyonu
  const simulateProgress = () => {
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer);
          return 100;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
    }, 100);
    return timer;
  };

  // Kaydet
  const kaydet = async () => {
    if (!seciliSantiye?.id || !seciliBlok?.ad) {
      console.error('Santiye veya blok seçili değil');
      return;
    }

    try {
      setYukleniyor(true);
      const timer = simulateProgress();

      await binaService.setBinaYapisi(seciliSantiye.id, seciliBlok.ad, yerelYapi);
      
      clearInterval(timer);
      setProgress(100);
      setShowSuccess(true);

      if (onSave) {
        await onSave(yerelYapi);
      }

      setTimeout(() => {
        setYukleniyor(false);
        setProgress(0);
        setShowSuccess(false);
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Bina yapısı kaydedilirken hata:', error);
      setYukleniyor(false);
      setProgress(0);
    }
  };

  // Düzenleme başlat
  const handleItemClick = (type, data, index, katIndex = null) => {
    console.log('Düzenleme başlatılıyor:', { type, data, index, katIndex });
    setEditingItem({
      type,
      data: { ...data }, // Veriyi kopyalayarak geçir
      index,
      katIndex
    });
  };

  // Değişiklikleri kaydet
  const handleItemKaydet = (yeniDeger) => {
    if (!yeniDeger || !editingItem) return;

    try {
      const yeniKatlar = [...yerelYapi.bloklar[0].katlar];

      if (editingItem.type === 'KAT') {
        yeniKatlar[editingItem.index] = {
          ...yeniKatlar[editingItem.index],
          no: yeniDeger
        };
      } else { // DAIRE
        yeniKatlar[editingItem.katIndex].daireler[editingItem.index] = {
          ...yeniKatlar[editingItem.katIndex].daireler[editingItem.index],
          no: yeniDeger
        };
      }

      setYerelYapi({
        bloklar: [{
          ...yerelYapi.bloklar[0],
          katlar: yeniKatlar
        }]
      });

      // Düzenleme modunu kapat
      setEditingItem(null);
    } catch (error) {
      console.error('Değişiklik kaydedilirken hata:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Bina Yapılandırması - {seciliBlok?.ad} Blok
      </DialogTitle>
      
      <Fade in={yukleniyor} style={{ transitionDelay: yukleniyor ? '0ms' : '0ms' }}>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 4,
            backgroundColor: showSuccess ? 'success.light' : 'primary.light',
            '& .MuiLinearProgress-bar': {
              backgroundColor: showSuccess ? 'success.main' : 'primary.main'
            }
          }} 
        />
      </Fade>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {yerelYapi.bloklar[0].katlar.map((kat, katIndex) => (
            <Paper key={katIndex} elevation={1} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography 
                  variant="h6"
                  sx={{ 
                    cursor: 'pointer', 
                    '&:hover': { color: 'primary.main' },
                    userSelect: 'none'
                  }}
                >
                  {kat.no === '0' ? 'Zemin Kat' : 
                   kat.no.toString().startsWith('B') ? `${kat.no}. Bodrum` : 
                   `${kat.no}. Kat`}
                </Typography>
                <Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => daireEkle(katIndex)}
                    sx={{ mr: 1 }}
                  >
                    Daire Ekle
                  </Button>
                  <IconButton 
                    size="small"
                    color="primary"
                    onClick={() => handleItemClick('KAT', kat, katIndex)}
                    sx={{ mr: 0.5 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small"
                    color="error"
                    onClick={() => katSil(katIndex)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>

              <Grid container spacing={2}>
                {kat.daireler?.map((daire, daireIndex) => (
                  <Grid item xs={6} sm={4} md={3} key={daireIndex}>
                    <Paper 
                      elevation={2}
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        position: 'relative',
                        cursor: 'pointer',
                        userSelect: 'none',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: 'scale(1.02)',
                          transition: 'all 0.2s'
                        }
                      }}
                    >
                      <Box sx={{ 
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        display: 'flex',
                        gap: 0.5
                      }}>
                        <IconButton
                          size="small"
                          sx={{ bgcolor: 'background.paper' }}
                          onClick={() => handleItemClick('DAIRE', daire, daireIndex, katIndex)}
                        >
                          <EditIcon fontSize="small" color="primary" />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{ bgcolor: 'background.paper' }}
                          onClick={() => daireSil(katIndex, daireIndex)}
                        >
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Box>
                      <Typography>{daire.no}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          ))}
        </Box>

        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mt: 2,
          p: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          bgcolor: '#1e1e1e'
        }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => katEkle('NORMAL')}
            sx={{ 
              flex: 1,
              py: 1.5,
              bgcolor: '#2c2c2c',
              '&:hover': {
                bgcolor: '#383838'
              }
            }}
          >
            Normal Kat Ekle
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => katEkle('ZEMIN')}
            sx={{ 
              flex: 1,
              py: 1.5,
              bgcolor: '#2c2c2c',
              '&:hover': {
                bgcolor: '#383838'
              }
            }}
          >
            Zemin Kat Ekle
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => katEkle('BODRUM')}
            sx={{ 
              flex: 1,
              py: 1.5,
              bgcolor: '#2c2c2c',
              '&:hover': {
                bgcolor: '#383838'
              }
            }}
          >
            Bodrum Kat Ekle
          </Button>
        </Box>
      </DialogContent>

      <EditDialog
        open={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleItemKaydet}
      />

      <DialogActions sx={{ 
        p: 2, 
        bgcolor: '#1e1e1e',
        gap: 1
      }}>
        <Button 
          onClick={onClose}
          disabled={yukleniyor}
          variant="contained"
          color="error"
          sx={{ 
            minWidth: 120,
            py: 1
          }}
        >
          İptal
        </Button>
        <Button 
          onClick={kaydet} 
          variant="contained"
          disabled={yukleniyor}
          color={showSuccess ? "success" : "primary"}
          sx={{ 
            minWidth: 120,
            py: 1
          }}
        >
          {yukleniyor ? (
            showSuccess ? 'Tamamlandı!' : 'Kaydediliyor...'
          ) : (
            'Kaydet'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BinaYapilandirma; 