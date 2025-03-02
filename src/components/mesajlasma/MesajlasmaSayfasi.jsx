import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Grid, Divider } from '@mui/material';
import KullaniciListesi from './KullaniciListesi';
import MesajAlani from './MesajAlani';
import MesajGondermeFormu from './MesajGondermeFormu';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

const MesajlasmaSayfasi = () => {
  const { currentUser } = useAuth();
  const [seciliKullanici, setSeciliKullanici] = useState(null);
  const [mesajlar, setMesajlar] = useState([]);

  useEffect(() => {
    if (!currentUser?.uid || !seciliKullanici?.id) return;

    // Mesajları getir ve dinle
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const yeniMesajlar = [];
      const guncellenecekMesajlar = [];

      snapshot.docs.forEach(doc => {
        const mesaj = { id: doc.id, ...doc.data() };
        
        // Sadece seçili kullanıcı ile olan mesajları göster
        if ((mesaj.senderId === currentUser.uid && mesaj.receiverId === seciliKullanici.id) ||
            (mesaj.senderId === seciliKullanici.id && mesaj.receiverId === currentUser.uid)) {
          yeniMesajlar.push(mesaj);

          // Gelen okunmamış mesajları okundu olarak işaretle
          if (!mesaj.read && mesaj.receiverId === currentUser.uid) {
            guncellenecekMesajlar.push(doc.id);
          }
        }
      });

      // Okunmamış mesajları güncelle
      for (const mesajId of guncellenecekMesajlar) {
        await updateDoc(doc(db, 'messages', mesajId), {
          read: true
        });
      }

      setMesajlar(yeniMesajlar);
    });

    return () => unsubscribe();
  }, [currentUser?.uid, seciliKullanici?.id]);

  const handleKullaniciSec = (kullanici) => {
    setSeciliKullanici(kullanici);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', p: 2 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          height: '100%', 
          display: 'flex',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: '#f5f5f5'
        }}
      >
        <Grid container>
          <Grid 
            item 
            xs={4} 
            sx={{ 
              borderRight: '1px solid rgba(0, 0, 0, 0.12)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ p: 2, bgcolor: 'white' }}>
              <Typography variant="h6" sx={{ fontWeight: 500, color: 'primary.main' }}>
                Mesajlaşma
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
              <KullaniciListesi
                onKullaniciSec={handleKullaniciSec}
                seciliKullanici={seciliKullanici}
              />
            </Box>
          </Grid>

          <Grid 
            item 
            xs={8} 
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {seciliKullanici ? (
              <>
                <Box sx={{ p: 2, bgcolor: 'white' }}>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {seciliKullanici.name} {seciliKullanici.surname}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {seciliKullanici.email}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <MesajAlani mesajlar={mesajlar} currentUser={currentUser} />
                  <MesajGondermeFormu
                    alici={seciliKullanici}
                    gonderen={currentUser}
                  />
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'white'
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Mesajlaşmak için bir kullanıcı seçin
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default MesajlasmaSayfasi;
