import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Grid, Divider, Avatar } from '@mui/material';
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
    if (!currentUser?.uid || !seciliKullanici?.uid) return;

    // Mesajları getir ve dinle
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('senderId', 'in', [currentUser.uid, seciliKullanici.uid]),
      where('receiverId', 'in', [currentUser.uid, seciliKullanici.uid]),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const yeniMesajlar = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp,
          file: data.file ? {
            data: data.file.data,
            type: data.file.type,
            name: data.file.name,
            isImage: data.file.isImage
          } : null
        };
      });

      // Debug için mesajları yazdır
      console.log('Veritabanından gelen mesajlar:', yeniMesajlar);

      // Okunmamış mesajları güncelle
      const guncellenecekMesajlar = yeniMesajlar.filter(
        mesaj => !mesaj.read && mesaj.receiverId === currentUser.uid
      );

      for (const mesaj of guncellenecekMesajlar) {
        await updateDoc(doc(db, 'messages', mesaj.id), {
          read: true
        });
      }

      setMesajlar(yeniMesajlar);
    });

    return () => unsubscribe();
  }, [currentUser?.uid, seciliKullanici?.uid]);

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
              <Typography component="div" variant="h6" sx={{ fontWeight: 500, color: 'primary.main' }}>
                Mesajlaşma
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto', bgcolor: 'white' }}>
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
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                  <Avatar src={seciliKullanici.photoURL} sx={{ mr: 2 }}>
                    {seciliKullanici.displayName?.charAt(0)}
                  </Avatar>
                  <Typography variant="subtitle1">
                    {seciliKullanici.displayName}
                  </Typography>
                </Box>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: 'calc(100vh - 180px)',
                    bgcolor: 'grey.50'
                  }}
                >
                  <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                    <MesajAlani mesajlar={mesajlar} currentUser={currentUser} />
                  </Box>
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
                <Typography component="div" variant="h6" color="text.secondary">
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
