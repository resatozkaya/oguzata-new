import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, IconButton } from '@mui/material';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  Assignment as AssignmentIcon,
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  Timer as TimerIcon
} from '@mui/icons-material';

const IsProgrami = () => {
  const [gorevler, setGorevler] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGorevler = async () => {
      try {
        const q = query(collection(db, "gorevler"), orderBy("teslimTarihi", "asc"));
        const querySnapshot = await getDocs(q);
        const gorevlerData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGorevler(gorevlerData);
      } catch (error) {
        console.error("Görevler alınırken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGorevler();
  }, []);

  const formatTarih = (tarih) => {
    if (!tarih) return '-';
    const date = tarih.toDate();
    return new Intl.DateTimeFormat('tr-TR').format(date);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        İş Programı
      </Typography>

      <Grid container spacing={3}>
        {gorevler.map((gorev) => (
          <Grid item xs={12} sm={6} md={4} key={gorev.id}>
            <Paper
              sx={{
                p: 2,
                height: '100%',
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" component="div">
                  {gorev.baslik || 'İsimsiz Görev'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PersonIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {gorev.sorumlu || 'Sorumlu Atanmamış'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarTodayIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Teslim: {formatTarih(gorev.teslimTarihi)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimerIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Durum: {gorev.durum || 'Belirlenmedi'}
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', flex: 1 }}>
                {gorev.aciklama || 'Açıklama eklenmemiş'}
              </Typography>

              <Box sx={{ 
                mt: 2, 
                p: 1, 
                borderRadius: 1,
                bgcolor: gorev.durum === 'tamamlandı' ? 'success.dark' : 
                         gorev.durum === 'devam ediyor' ? 'info.dark' : 
                         gorev.durum === 'beklemede' ? 'warning.dark' : 'error.dark'
              }}>
                <Typography variant="caption" sx={{ color: 'white' }}>
                  {gorev.oncelik || 'Normal Öncelik'}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default IsProgrami;
