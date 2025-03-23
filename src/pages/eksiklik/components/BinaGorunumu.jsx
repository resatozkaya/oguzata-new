import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Badge,
  Tooltip,
  Button,
  IconButton
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import BinaYapisiDuzenle from './BinaYapisiDuzenle';
import { useSantiye } from '../../../contexts/SantiyeContext';

const BinaGorunumu = ({ binaYapisi, eksiklikler, seciliDaire, onDaireClick }) => {
  const [binaYapisiDuzenleOpen, setBinaYapisiDuzenleOpen] = useState(false);
  const { seciliSantiye, seciliBlok, yenileVerileri } = useSantiye();

  // Dairenin eksiklik sayılarını hesapla
  const getEksiklikSayilari = (daireNo) => {
    const daireEksiklikleri = eksiklikler.filter(e => e.daire === daireNo);
    return {
      tamamlanan: daireEksiklikleri.filter(e => e.durum === 'TAMAMLANDI').length,
      devamEden: daireEksiklikleri.filter(e => e.durum !== 'TAMAMLANDI').length
    };
  };

  // Dairenin durumuna göre renk belirle
  const getDaireRengi = (daireNo) => {
    const daireEksiklikleri = eksiklikler.filter(e => e.daire === daireNo);
    if (daireEksiklikleri.length === 0) return 'success.main';
    if (daireEksiklikleri.some(e => e.oncelik === 'KRITIK')) return 'error.main';
    if (daireEksiklikleri.some(e => e.durum === 'DEVAM_EDIYOR')) return 'warning.main';
    return 'info.main';
  };

  // Yapı düzenleme işlemi tamamlandığında
  const handleYapiDuzenleComplete = async () => {
    // Verileri yenile
    await yenileVerileri();
    // Modal'ı kapat
    setBinaYapisiDuzenleOpen(false);
  };

  return (
    <Box>
      {/* Başlık ve Düzenleme Butonu */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        px: 2
      }}>
        <Typography variant="h6">
          Bina Görünümü
        </Typography>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => setBinaYapisiDuzenleOpen(true)}
        >
          Yapıyı Düzenle
        </Button>
      </Box>

      {/* Bina Yapısı */}
      <Box 
        sx={{ 
          px: 2,
          height: 'calc(100vh - 250px)', 
          overflowY: 'auto'
        }}
      >
        {binaYapisi?.bloklar?.[0]?.katlar?.map((kat) => (
          <Box
            key={kat.no}
            sx={{
              mb: 2,
              position: 'relative',
            }}
          >
            {/* Kat Başlığı */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 1,
              borderBottom: '2px solid',
              borderColor: kat.tip === 'ZEMIN' ? 'warning.main' : 'primary.main',
              pb: 0.5
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {kat.ad || `${kat.no}. Kat`}
              </Typography>
            </Box>

            {/* Daireler */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: 2
            }}>
              {kat.daireler?.map((daire) => {
                const { tamamlanan, devamEden } = getEksiklikSayilari(daire.no);
                
                return (
                  <Paper
                    key={daire.no}
                    elevation={1}
                    onClick={() => onDaireClick?.(daire.no)}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      position: 'relative',
                      bgcolor: seciliDaire === daire.no ? 'action.selected' : 'background.paper',
                      borderLeft: 2,
                      borderColor: getDaireRengi(daire.no),
                      minWidth: { xs: '120px', sm: '140px' },
                      maxWidth: { xs: '120px', sm: '140px' },
                      height: { xs: '80px', sm: '90px' },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}
                  >
                    {/* Badge'ler */}
                    <Box sx={{ 
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      display: 'flex',
                      gap: 0.5
                    }}>
                      {devamEden > 0 && (
                        <Box sx={{
                          minWidth: 20,
                          height: 20,
                          bgcolor: 'error.main',
                          color: 'white',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          {devamEden}
                        </Box>
                      )}
                      {tamamlanan > 0 && (
                        <Box sx={{
                          minWidth: 20,
                          height: 20,
                          bgcolor: 'success.main',
                          color: 'white',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          {tamamlanan}
                        </Box>
                      )}
                    </Box>

                    {/* Daire Bilgisi */}
                    <Typography 
                      variant="h6"
                      align="center"
                      sx={{ 
                        fontWeight: 'medium',
                        fontSize: { xs: '1.1rem', sm: '1.2rem' },
                        lineHeight: 1.2
                      }}
                    >
                      {daire.no}
                    </Typography>
                  </Paper>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Bina Yapısı Düzenleme Modal */}
      <BinaYapisiDuzenle
        open={binaYapisiDuzenleOpen}
        onClose={() => setBinaYapisiDuzenleOpen(false)}
        santiyeId={seciliSantiye?.id}
        blokId={seciliBlok?.id}
        binaYapisi={binaYapisi}
        onUpdate={handleYapiDuzenleComplete}
      />
    </Box>
  );
};

export default BinaGorunumu;