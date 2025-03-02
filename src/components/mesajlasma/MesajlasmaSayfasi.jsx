import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Grid, Divider } from '@mui/material';
import KullaniciListesi from './KullaniciListesi';
import MesajAlani from './MesajAlani';
import { useAuth } from '../../contexts/AuthContext';

const MesajlasmaSayfasi = () => {
  const { currentUser } = useAuth();
  const [seciliKullanici, setSeciliKullanici] = useState(null);

  const handleKullaniciSec = (kullanici) => {
    setSeciliKullanici(kullanici);
  };

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      bgcolor: 'background.default',
      p: 0
    }}>
      <Grid container sx={{ height: '100vh' }}>
        {/* Kullanıcı listesi */}
        <Grid item xs={12} md={3} sx={{ 
          borderRight: 1, 
          borderColor: 'divider',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ 
            p: 2, 
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}>
            <Typography variant="h6" color="text.primary">
              Mesajlaşma
            </Typography>
          </Box>
          <Box sx={{ overflowY: 'auto', height: 'calc(100% - 64px)' }}>
            <KullaniciListesi 
              onKullaniciSec={handleKullaniciSec}
              seciliKullanici={seciliKullanici}
            />
          </Box>
        </Grid>

        {/* Mesaj alanı */}
        <Grid item xs={12} md={9} sx={{ 
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {seciliKullanici ? (
            <MesajAlani 
              seciliKullanici={seciliKullanici}
              currentUser={currentUser}
            />
          ) : (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              bgcolor: 'background.default'
            }}>
              <Typography variant="h6" color="text.secondary">
                Mesajlaşmak için bir kullanıcı seçin
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default MesajlasmaSayfasi;
