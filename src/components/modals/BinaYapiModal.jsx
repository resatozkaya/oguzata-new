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
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { binaService } from '../../services/binaService';

const BinaYapiModal = ({ open, onClose, seciliSantiye, seciliBlok, binaYapisi, setBinaYapisi }) => {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [yerelYapi, setYerelYapi] = useState({
    bloklar: [{
      ad: seciliBlok?.ad || '',
      katlar: []
    }]
  });

  // Bina yapısını yükle
  useEffect(() => {
    if (open && seciliSantiye?.id && seciliBlok?.ad) {
      const yukle = async () => {
        try {
          const data = await binaService.getBinaYapisi(seciliSantiye.id, seciliBlok.ad);
          if (data?.bloklar?.[0]) {
            // Katları sıralayarak yükle
            const siraliKatlar = data.bloklar[0].katlar ? 
              [...data.bloklar[0].katlar].sort((a, b) => {
                const getKatNo = (no) => {
                  if (typeof no === 'string' && no.startsWith('B')) return -parseInt(no.slice(1));
                  if (no === 0) return 0;
                  return parseInt(no);
                };
                return getKatNo(b.no) - getKatNo(a.no);
              }) : [];
            
            setYerelYapi({
              ...data,
              bloklar: [{
                ...data.bloklar[0],
                katlar: siraliKatlar
              }]
            });
          }
        } catch (error) {
          console.error('Bina yapısı yükleme hatası:', error);
        }
      };
      yukle();
    }
  }, [open, seciliSantiye?.id, seciliBlok?.ad]);

  // Daire ekleme fonksiyonu
  const daireEkle = (katNo) => {
    setYerelYapi(prev => {
      const yeniYapi = JSON.parse(JSON.stringify(prev));
      const kat = yeniYapi.bloklar[0].katlar.find(k => k.no === katNo);
      
      if (kat) {
        if (!Array.isArray(kat.daireler)) {
          kat.daireler = [];
        }

        // Mevcut dairelerin sayısını al ve bir sonraki numarayı oluştur
        const daireIndex = kat.daireler.length + 1;
        
        // Daire numarasını blok adı + kat no + sıra no şeklinde oluştur
        const yeniDaireNo = `${seciliBlok.ad}${katNo}${daireIndex}`;

        // Yeni daireyi ekle
        kat.daireler.push({
          no: yeniDaireNo,
          tip: 'DAIRE'
        });
      }

      return yeniYapi;
    });
  };

  // Daire sil
  const daireSil = (katNo, daireIndex) => {
    setYerelYapi(prev => {
      const yeniYapi = JSON.parse(JSON.stringify(prev));
      const kat = yeniYapi.bloklar[0].katlar.find(k => k.no === katNo);
      
      if (kat && Array.isArray(kat.daireler)) {
        kat.daireler = kat.daireler.filter((_, index) => index !== daireIndex);
      }
      
      return yeniYapi;
    });
  };

  // Kat sil
  const katSil = (katNo) => {
    setYerelYapi(prev => {
      const yeniYapi = { ...prev };
      const katIndex = yeniYapi.bloklar[0].katlar.findIndex(k => k.no === katNo);
      
      if (katIndex !== -1) {
        yeniYapi.bloklar[0].katlar.splice(katIndex, 1);
      }

      return yeniYapi;
    });
  };

  // Kat ekle
  const katEkle = (tip = 'NORMAL') => {
    setYerelYapi(prev => {
      const yeniYapi = JSON.parse(JSON.stringify(prev));
      const katlar = yeniYapi.bloklar[0].katlar || [];
  
      // Kat numarasını belirle
      let yeniKatNo;
      const normalKatlar = katlar.filter(k => !k.no.toString().startsWith('B') && k.no !== 0);
      const bodrumKatlar = katlar.filter(k => k.no.toString().startsWith('B'));
      const zeminKatVar = katlar.some(k => k.no === 0);
  
      switch (tip) {
        case 'BODRUM':
          yeniKatNo = `B${bodrumKatlar.length + 1}`;
          break;
        case 'ZEMIN':
          if (zeminKatVar) return yeniYapi; // Zemin kat varsa ekleme yapma
          yeniKatNo = 0;
          break;
        case 'NORMAL':
          yeniKatNo = normalKatlar.length > 0 
            ? Math.max(...normalKatlar.map(k => parseInt(k.no))) + 1 
            : 1;
          break;
        default:
          return yeniYapi;
      }
  
      // Yeni katı ekle
      const yeniKat = {
        no: yeniKatNo,
        tip,
        daireler: []
      };
  
      // Katlar dizisine ekle ve sırala
      yeniYapi.bloklar[0].katlar = [...katlar, yeniKat].sort((a, b) => {
        const getKatNo = (no) => {
          if (typeof no === 'string' && no.startsWith('B')) return -parseInt(no.slice(1));
          if (no === 0) return 0;
          return parseInt(no);
        };
        return getKatNo(b.no) - getKatNo(a.no);
      });
  
      return yeniYapi;
    });
  };

  // Daire numarası güncelle
  const daireNoGuncelle = (katNo, daireIndex, yeniNo) => {
    setYerelYapi(prev => {
      const yeniYapi = { ...prev };
      const kat = yeniYapi.bloklar[0].katlar.find(k => k.no === katNo);
      
      if (kat && kat.daireler[daireIndex]) {
        kat.daireler[daireIndex].no = yeniNo;
      }

      return yeniYapi;
    });
  };

  // Kaydet
  const kaydet = async () => {
    if (!seciliSantiye?.id || !seciliBlok?.ad) {
      console.error('Santiye veya blok seçili değil');
      return;
    }

    try {
      setYukleniyor(true);

      // Boş daire kontrolü
      const hataliDaireler = yerelYapi.bloklar[0].katlar.some(kat =>
        kat.daireler?.some(daire => !daire.no || !daire.no.trim())
      );

      if (hataliDaireler) {
        alert('Lütfen tüm daire numaralarını doldurun');
        return;
      }

      // Firebase'e kaydet
      await binaService.setBinaYapisi(seciliSantiye.id, seciliBlok.ad, yerelYapi);
      
      // Context'teki bina yapısını güncelle
      setBinaYapisi(yerelYapi);
      
      alert('Bina yapısı başarıyla kaydedildi');
      onClose();
    } catch (error) {
      console.error('Kayıt hatası:', error);
      alert('Kayıt sırasında bir hata oluştu: ' + error.message);
    } finally {
      setYukleniyor(false);
    }
  };

  const getKatIsmi = (katNo) => {
    if (katNo === 0) return 'Zemin Kat';
    if (typeof katNo === 'string' && katNo.startsWith('B')) {
      return `${katNo}. Bodrum Kat`;
    }
    return `${katNo}. Kat`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Bina Yapılandırması - {seciliBlok?.ad} Blok
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ py: 2 }}>
          {/* Katlar */}
          {yerelYapi.bloklar[0]?.katlar.map((kat) => (
            <Paper key={kat.no} sx={{ p: 3, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {getKatIsmi(kat.no)}
                </Typography>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => daireEkle(kat.no)}
                    sx={{ mr: 1 }}
                  >
                    Daire Ekle
                  </Button>
                  <IconButton
                    color="error"
                    onClick={() => katSil(kat.no)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>

              <Grid container spacing={2}>
                {kat.daireler?.map((daire, index) => (
                  <Grid item key={index} xs={12} sm={6} md={4} lg={2}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        position: 'relative',
                        '&:hover .delete-button': {
                          opacity: 1
                        }
                      }}
                    >
                      <TextField
                        fullWidth
                        value={daire.no}
                        onChange={(e) => daireNoGuncelle(kat.no, index, e.target.value)}
                        placeholder="Daire No"
                      />
                      <IconButton
                        size="small"
                        className="delete-button"
                        onClick={() => daireSil(kat.no, index)}
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
              onClick={() => katEkle('NORMAL')}
            >
              Normal Kat
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => katEkle('BODRUM')}
            >
              Bodrum Kat
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => katEkle('ZEMIN')}
            >
              Zemin Kat
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button
          variant="contained"
          onClick={kaydet}
          disabled={yukleniyor}
        >
          {yukleniyor ? <CircularProgress size={24} /> : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BinaYapiModal;
