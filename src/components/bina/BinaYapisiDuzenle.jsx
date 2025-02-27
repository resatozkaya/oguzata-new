import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const KAT_TIPLERI = [
  { value: 'BODRUM', label: 'Bodrum Kat' },
  { value: 'ZEMIN', label: 'Zemin Kat' },
  { value: 'NORMAL', label: 'Normal Kat' },
  { value: 'CATI', label: 'Çatı Katı' }
];

const BinaYapisiDuzenle = ({ open, onClose, santiye, blok, onUpdate, yenileVerileri }) => {
  const navigate = useNavigate();
  const [katlar, setKatlar] = useState([]);
  const [editingKat, setEditingKat] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  // Mevcut bina yapısını yükle
  useEffect(() => {
    if (open && blok?.katlar) {
      // Katları sıralayarak yükle
      const siraliKatlar = [...blok.katlar].sort((a, b) => {
        const getKatNo = (no) => {
          if (typeof no === 'string' && no.startsWith('B')) return -parseInt(no.slice(1));
          if (no === 0) return 0;
          return parseInt(no);
        };
        return getKatNo(b.no) - getKatNo(a.no);
      });
      setKatlar(siraliKatlar);
    }
  }, [open, blok]);

  // Kat Ekleme
  const handleKatEkle = (tip) => {
    setKatlar(prev => {
      const katlar = prev || [];
      let yeniKatNo;
      const normalKatlar = katlar.filter(k => !k.no.toString().startsWith('B') && k.no !== 0);
      const bodrumKatlar = katlar.filter(k => k.no.toString().startsWith('B'));
      const zeminKatVar = katlar.some(k => k.no === 0);
      const catiKatVar = katlar.some(k => k.tip === 'CATI');

      switch (tip) {
        case 'BODRUM':
          yeniKatNo = `B${bodrumKatlar.length + 1}`;
          break;
        case 'ZEMIN':
          if (zeminKatVar) return prev;
          yeniKatNo = 0;
          break;
        case 'CATI':
          if (catiKatVar) return prev; // Sadece bir çatı katı olabilir
          // En yüksek kat numarasını bul ve bir fazlasını ver
          yeniKatNo = normalKatlar.length > 0 
            ? Math.max(...normalKatlar.map(k => parseInt(k.no))) + 1 
            : 1;
          break;
        case 'NORMAL':
          // Çatı katı varsa, onun altına ekle
          if (catiKatVar) {
            const catiKatNo = katlar.find(k => k.tip === 'CATI').no;
            yeniKatNo = normalKatlar.length > 0 
              ? Math.max(...normalKatlar.filter(k => k !== catiKatNo).map(k => parseInt(k.no))) + 1 
              : 1;
          } else {
            yeniKatNo = normalKatlar.length > 0 
              ? Math.max(...normalKatlar.map(k => parseInt(k.no))) + 1 
              : 1;
          }
          break;
        default:
          return prev;
      }

      const yeniKat = {
        no: yeniKatNo,
        tip,
        daireler: []
      };

      const yeniKatlar = [...katlar, yeniKat];
      return yeniKatlar.sort((a, b) => {
        const getKatNo = (no) => {
          if (typeof no === 'string' && no.startsWith('B')) return -parseInt(no.slice(1));
          if (no === 0) return 0;
          return parseInt(no);
        };

        // Çatı katı her zaman en üstte olsun
        if (a.tip === 'CATI') return -1;
        if (b.tip === 'CATI') return 1;

        return getKatNo(b.no) - getKatNo(a.no);
      });
    });
  };

  // Kat Silme
  const handleKatSil = (katIndex) => {
    if (window.confirm('Bu katı silmek istediğinizden emin misiniz?')) {
      setKatlar(katlar.filter((_, index) => index !== katIndex));
    }
  };

  // Kat Düzenleme
  const handleKatDuzenle = (katIndex, field, value) => {
    const yeniKatlar = [...katlar];
    yeniKatlar[katIndex] = {
      ...yeniKatlar[katIndex],
      [field]: value
    };
    setKatlar(yeniKatlar);
  };

  // Daire Ekleme
  const handleDaireEkle = (katIndex) => {
    setKatlar(prev => {
      const yeniKatlar = [...prev];
      const kat = yeniKatlar[katIndex];
      
      if (!Array.isArray(kat.daireler)) {
        kat.daireler = [];
      }

      // Mevcut daire numaralarını kontrol et
      const mevcutNumaralar = new Set(kat.daireler.map(d => d.no));
      let daireIndex = 1;
      let yeniDaireNo;

      // Önce kat holü var mı kontrol et
      const katHoluSayisi = kat.daireler.filter(d => 
        d.no.toUpperCase().startsWith('KAT HOLÜ')
      ).length;

      if (katHoluSayisi === 0) {
        yeniDaireNo = `KAT HOLÜ 1`;
      } else {
        // Benzersiz bir daire numarası bul
        do {
          yeniDaireNo = `${blok.ad}${kat.no}${daireIndex.toString().padStart(2, '0')}`;
          daireIndex++;
        } while (mevcutNumaralar.has(yeniDaireNo));
      }

      kat.daireler.push({
        no: yeniDaireNo,
        tip: 'DAIRE'
      });

      return yeniKatlar;
    });
  };

  // Daire Silme
  const handleDaireSil = (katIndex, daireIndex) => {
    if (window.confirm('Bu daireyi silmek istediğinizden emin misiniz?')) {
      const yeniKatlar = [...katlar];
      yeniKatlar[katIndex].daireler = yeniKatlar[katIndex].daireler.filter((_, index) => index !== daireIndex);
      setKatlar(yeniKatlar);
    }
  };

  // Daire Düzenleme
  const handleDaireDuzenle = (katIndex, daireIndex, yeniNo) => {
    const yeniKatlar = [...katlar];
    const kat = yeniKatlar[katIndex];

    // Kat holü kontrolü - eğer "KAT HOLÜ" ile başlıyorsa izin ver
    if (yeniNo.toUpperCase().startsWith('KAT HOLÜ')) {
      yeniKatlar[katIndex].daireler[daireIndex].no = yeniNo;
      setKatlar(yeniKatlar);
      return;
    }

    // Aynı numarada başka daire var mı kontrol et
    const daireVarMi = kat.daireler.some((daire, idx) => 
      daire.no === yeniNo && idx !== daireIndex
    );

    if (daireVarMi) {
      alert(`"${yeniNo}" numarası bu katta zaten kullanılıyor!\nFarklı bir numara girin veya kat holü için "KAT HOLÜ 1" gibi bir format kullanın.`);
      return;
    }

    yeniKatlar[katIndex].daireler[daireIndex].no = yeniNo;
    setKatlar(yeniKatlar);
  };

  // Katları Sırala
  const handleKatSirala = () => {
    const siraliKatlar = [...katlar].sort((a, b) => {
      if (a.tip === 'BODRUM' && b.tip !== 'BODRUM') return -1;
      if (a.tip !== 'BODRUM' && b.tip === 'BODRUM') return 1;
      if (a.tip === 'ZEMIN') return -1;
      if (b.tip === 'ZEMIN') return 1;
      if (a.tip === 'CATI') return 1;
      if (b.tip === 'CATI') return -1;
      return parseInt(b.no) - parseInt(a.no);
    });
    setKatlar(siraliKatlar);
  };

  const handleKaydet = async () => {
    try {
      setYukleniyor(true);

      // Boş daire kontrolü
      const hataliDaireler = katlar.some(kat =>
        kat.daireler?.some(daire => !daire.no || !daire.no.trim())
      );

      if (hataliDaireler) {
        alert('Lütfen tüm daire numaralarını doldurun');
        return;
      }

      // Veriyi hazırla
      const binaYapisi = {
        id: blok?.id,
        ad: blok?.ad,
        kod: blok?.kod,
        katlar: katlar.map(kat => ({
          no: kat.no,
          tip: kat.tip || 'NORMAL',
          daireler: kat.daireler?.map(daire => ({
            no: daire.no,
            tip: 'DAIRE'
          })) || []
        }))
      };

      console.log('Kaydedilecek veri:', binaYapisi);

      // Önce güncelleme işlemini yap
      await onUpdate(binaYapisi);
      
      // Dialog'u kapat
      onClose();

      // Kısa bir beklemeden sonra verileri yenile
      setTimeout(async () => {
        if (typeof yenileVerileri === 'function') {
          await yenileVerileri();
        }
      }, 500);

      // Başarılı kayıt mesajı göster
      alert('Bina yapısı başarıyla güncellendi');
      
    } catch (error) {
      console.error('Kayıt hatası:', error);
      alert('Kayıt sırasında bir hata oluştu: ' + error.message);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#121212',
          color: 'white',
          minHeight: '80vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          pb: 2
        }}>
          <Box>
            <Typography variant="h6">
              {blok?.ad} Blok - Bina Yapısını Düzenle
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              {santiye?.ad}
            </Typography>
          </Box>
          <Box>
            {KAT_TIPLERI.map(tip => (
              <Button
                key={tip.value}
                startIcon={<AddIcon />}
                onClick={() => handleKatEkle(tip.value)}
                variant="outlined"
                size="small"
                sx={{ 
                  ml: 1,
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                {tip.label}
              </Button>
            ))}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: '#121212' }}>
        {katlar.map((kat, katIndex) => (
          <Box 
            key={katIndex} 
            sx={{ 
              mb: 3, 
              p: 2, 
              bgcolor: '#1e1e1e', 
              borderRadius: 1,
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                label="Kat No"
                value={kat.no}
                onChange={(e) => handleKatDuzenle(katIndex, 'no', e.target.value)}
                size="small"
                sx={{ 
                  width: 100, 
                  mr: 2,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.7)',
                  }
                }}
              />
              <FormControl 
                size="small" 
                sx={{ 
                  width: 150, 
                  mr: 2,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.7)',
                  }
                }}
              >
                <InputLabel>Kat Tipi</InputLabel>
                <Select
                  value={kat.tip}
                  onChange={(e) => handleKatDuzenle(katIndex, 'tip', e.target.value)}
                  label="Kat Tipi"
                >
                  {KAT_TIPLERI.map(tip => (
                    <MenuItem key={tip.value} value={tip.value}>{tip.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton 
                onClick={() => handleKatSil(katIndex)} 
                color="error"
                sx={{ 
                  '&:hover': {
                    bgcolor: 'rgba(255,0,0,0.1)'
                  }
                }}
              >
                <DeleteIcon />
              </IconButton>
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleDaireEkle(katIndex)}
                variant="contained"
                size="small"
                sx={{ 
                  ml: 'auto',
                  bgcolor: '#2196f3',
                  '&:hover': {
                    bgcolor: '#1976d2'
                  }
                }}
              >
                Daire Ekle
              </Button>
            </Box>

            <Box sx={{ pl: 2 }}>
              {kat.daireler?.map((daire, daireIndex) => (
                <Box key={daireIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TextField
                    label="Daire No"
                    value={daire.no}
                    onChange={(e) => handleDaireDuzenle(katIndex, daireIndex, e.target.value)}
                    size="small"
                    sx={{ 
                      width: 150, 
                      mr: 2,
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255,255,255,0.7)',
                      }
                    }}
                  />
                  <IconButton 
                    onClick={() => handleDaireSil(katIndex, daireIndex)} 
                    color="error"
                    sx={{ 
                      '&:hover': {
                        bgcolor: 'rgba(255,0,0,0.1)'
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </DialogContent>

      <DialogActions sx={{ bgcolor: '#121212', borderTop: '1px solid rgba(255,255,255,0.1)', p: 2 }}>
        <Button onClick={onClose} disabled={yukleniyor}>
          İptal
        </Button>
        <Button onClick={handleKaydet} variant="contained" disabled={yukleniyor}>
          {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BinaYapisiDuzenle; 