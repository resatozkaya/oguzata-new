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

const BinaYapisiDuzenle = ({ open, onClose, santiye, blok, onUpdate, yenileVerileri, isDarkMode }) => {
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
          bgcolor: isDarkMode ? '#1e1e1e' : '#ffffff'
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" sx={{ color: isDarkMode ? '#2196f3' : '#1976d2' }}>
          Bina Yapısını Düzenle
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Kat Tipleri Butonları */}
          <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {KAT_TIPLERI.map((tip) => (
              <Button
                key={tip.value}
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleKatEkle(tip.value)}
                sx={{
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
                  color: isDarkMode ? '#fff' : 'inherit',
                  '&:hover': {
                    borderColor: isDarkMode ? '#2196f3' : '#1976d2',
                    bgcolor: isDarkMode ? 'rgba(33,150,243,0.08)' : 'rgba(25,118,210,0.08)'
                  }
                }}
              >
                {tip.label} Ekle
              </Button>
            ))}
          </Box>

          {/* Katlar Listesi */}
          {katlar.map((kat, katIndex) => (
            <Box
              key={katIndex}
              sx={{
                mb: 2,
                p: 2,
                bgcolor: isDarkMode ? '#263238' : '#f5f5f5',
                borderRadius: 1,
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              }}
            >
              {/* Kat Başlığı */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                pb: 1,
                borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` 
              }}>
                <Typography sx={{ 
                  flex: 1,
                  color: isDarkMode ? '#2196f3' : '#1976d2',
                  fontWeight: 'bold' 
                }}>
                  {kat.no}. Kat ({kat.tip})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    size="small"
                    onClick={() => handleDaireEkle(katIndex)}
                    sx={{ 
                      color: isDarkMode ? '#2196f3' : '#1976d2',
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(33,150,243,0.08)' : 'rgba(25,118,210,0.08)'
                      }
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleKatSil(katIndex)}
                    sx={{ 
                      color: isDarkMode ? '#f44336' : '#d32f2f',
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(244,67,54,0.08)' : 'rgba(211,47,47,0.08)'
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Daireler */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {kat.daireler?.map((daire, daireIndex) => (
                  <Box
                    key={daireIndex}
                    sx={{
                      p: 1,
                      bgcolor: isDarkMode ? '#1e1e1e' : '#ffffff',
                      borderRadius: 1,
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <TextField
                      size="small"
                      value={daire.no}
                      onChange={(e) => handleDaireDuzenle(katIndex, daireIndex, e.target.value)}
                      sx={{
                        '& .MuiInputBase-input': {
                          color: isDarkMode ? '#fff' : 'inherit',
                        },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: isDarkMode ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
                          },
                          '&:hover fieldset': {
                            borderColor: isDarkMode ? '#2196f3' : '#1976d2',
                          },
                        },
                      }}
                    />
                    <IconButton 
                      size="small"
                      onClick={() => handleDaireSil(katIndex, daireIndex)}
                      sx={{ 
                        color: isDarkMode ? '#f44336' : '#d32f2f',
                        '&:hover': {
                          bgcolor: isDarkMode ? 'rgba(244,67,54,0.08)' : 'rgba(211,47,47,0.08)'
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
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: isDarkMode ? '#1e1e1e' : '#ffffff' }}>
        <Button onClick={onClose} sx={{ color: isDarkMode ? '#fff' : 'inherit' }}>
          İptal
        </Button>
        <Button 
          onClick={handleKaydet} 
          variant="contained" 
          color="primary"
          disabled={yukleniyor}
        >
          {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BinaYapisiDuzenle; 