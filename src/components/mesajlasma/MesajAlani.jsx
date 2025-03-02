import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import MesajGondermeFormu from './MesajGondermeFormu';
import MesajBalonu from './MesajBalonu';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../firebase';

const MesajAlani = ({ seciliKullanici }) => {
  const [mesajlar, setMesajlar] = useState([]);
  const { currentUser } = useAuth();
  const mesajAlaniRef = useRef(null);

  useEffect(() => {
    if (!seciliKullanici) return;

    const mesajlarRef = collection(db, 'messages');
    const q = query(
      mesajlarRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const yeniMesajlar = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(mesaj => 
          mesaj.participants.includes(seciliKullanici.uid)
        );
      setMesajlar(yeniMesajlar);
    });

    return () => unsubscribe();
  }, [seciliKullanici, currentUser]);

  useEffect(() => {
    if (mesajAlaniRef.current) {
      mesajAlaniRef.current.scrollTop = mesajAlaniRef.current.scrollHeight;
    }
  }, [mesajlar]);

  if (!seciliKullanici) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%' 
      }}>
        <Typography variant="h6" color="textSecondary">
          Mesajlaşmak için bir kullanıcı seçin
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">
          {seciliKullanici.displayName}
        </Typography>
      </Box>

      <Box 
        ref={mesajAlaniRef}
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        {mesajlar.map((mesaj) => (
          <MesajBalonu
            key={mesaj.id}
            mesaj={mesaj}
            benimMi={mesaj.sender === currentUser.uid}
          />
        ))}
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <MesajGondermeFormu alici={seciliKullanici} />
      </Box>
    </Box>
  );
};

export default MesajAlani;
