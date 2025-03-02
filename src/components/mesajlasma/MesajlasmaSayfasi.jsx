import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper } from '@mui/material';
import KullaniciListesi from './KullaniciListesi';
import MesajAlani from './MesajAlani';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const MesajlasmaSayfasi = () => {
  const [seciliKullanici, setSeciliKullanici] = useState(null);
  const [kullanicilar, setKullanicilar] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    const kullanicilariGetir = async () => {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '!=', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const kullaniciListesi = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setKullanicilar(kullaniciListesi);
    };

    if (currentUser) {
      kullanicilariGetir();
    }
  }, [currentUser]);

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', overflow: 'hidden' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        <Grid item xs={3}>
          <Paper sx={{ height: '100%' }}>
            <KullaniciListesi
              kullanicilar={kullanicilar}
              seciliKullanici={seciliKullanici}
              onKullaniciSec={setSeciliKullanici}
            />
          </Paper>
        </Grid>
        <Grid item xs={9}>
          <Paper sx={{ height: '100%' }}>
            <MesajAlani seciliKullanici={seciliKullanici} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MesajlasmaSayfasi;
