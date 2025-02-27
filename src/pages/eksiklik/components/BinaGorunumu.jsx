import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Badge,
  Tooltip
} from '@mui/material';

const BinaGorunumu = ({ binaYapisi, eksiklikler, seciliDaire, onDaireClick }) => {
  // Dairenin eksiklik sayısını hesapla
  const getEksiklikSayisi = (daireNo) => {
    return eksiklikler.filter(e => e.daire === daireNo).length;
  };

  // Dairenin durumuna göre renk belirle
  const getDaireRengi = (daireNo) => {
    const daireEksiklikleri = eksiklikler.filter(e => e.daire === daireNo);
    if (daireEksiklikleri.length === 0) return 'success.main';
    if (daireEksiklikleri.some(e => e.oncelik === 'KRITIK')) return 'error.main';
    if (daireEksiklikleri.some(e => e.durum === 'DEVAM_EDIYOR')) return 'warning.main';
    return 'info.main';
  };

  return (
    <Box sx={{ px: 2 }}>
      {binaYapisi?.bloklar?.[0]?.katlar?.map((kat, index) => (
        <Box
          key={kat.no}
          sx={{
            mb: 3,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: -16,
              top: 8,
              bottom: 8,
              width: 4,
              bgcolor: kat.tip === 'ZEMIN' ? '#ffd54f' : '#90caf9',
              borderRadius: 2,
              boxShadow: '0 0 8px rgba(0,0,0,0.1)'
            }
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: kat.tip === 'ZEMIN' ? 'rgba(255, 213, 79, 0.08)' : 'rgba(144, 202, 249, 0.08)',
              border: '1px solid',
              borderColor: kat.tip === 'ZEMIN' ? 'rgba(255, 213, 79, 0.2)' : 'rgba(144, 202, 249, 0.2)',
              borderRadius: 2,
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                color: kat.tip === 'ZEMIN' ? '#f57c00' : '#1976d2',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              {kat.tip === 'ZEMIN' ? 'Zemin Kat' : `${kat.no}. Kat`}
            </Typography>

            <Grid container spacing={2}>
              {kat.daireler?.map((daire) => (
                <Grid item xs={6} sm={4} md={3} key={daire.no}>
                  <Badge
                    badgeContent={getEksiklikSayisi(daire.no)}
                    color="error"
                    max={99}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.8rem',
                        height: '20px',
                        minWidth: '20px',
                        bgcolor: 'error.light',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <Tooltip title={`${daire.no} Nolu Daire - ${getEksiklikSayisi(daire.no)} Eksiklik`}>
                      <Paper
                        onClick={() => onDaireClick(daire.no)}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          bgcolor: 'background.paper',
                          color: 'text.primary',
                          textAlign: 'center',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: seciliDaire === daire.no 
                            ? 'primary.main'
                            : 'divider',
                          minWidth: '100px',
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                            bgcolor: getDaireRengi(daire.no),
                            opacity: 0.1,
                            borderRadius: 'inherit',
                            transition: 'opacity 0.2s'
                          },
                          boxShadow: seciliDaire === daire.no 
                            ? '0 0 0 1px rgba(25, 118, 210, 0.5), 0 2px 4px rgba(0,0,0,0.05)'
                            : '0 1px 3px rgba(0,0,0,0.05)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: 'primary.main',
                            '&::before': {
                              opacity: 0.15
                            },
                            transform: 'translateY(-1px)',
                            boxShadow: '0 3px 6px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 500,
                            color: seciliDaire === daire.no ? 'primary.main' : 'text.primary'
                          }}
                        >
                          {daire.no}
                        </Typography>
                      </Paper>
                    </Tooltip>
                  </Badge>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      ))}
    </Box>
  );
};

export default BinaGorunumu; 