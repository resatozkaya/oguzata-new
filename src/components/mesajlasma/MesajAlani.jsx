import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, Link } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import MesajGondermeFormu from './MesajGondermeFormu';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const MesajBalonu = ({ mesaj, benimMi }) => {
  const tarih = mesaj.timestamp?.toDate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: benimMi ? 'row-reverse' : 'row',
        mb: 1,
        gap: 1
      }}
    >
      <Box
        sx={{
          maxWidth: '70%',
          bgcolor: benimMi ? 'primary.main' : 'grey.100',
          color: benimMi ? 'white' : 'text.primary',
          p: 2,
          borderRadius: 2,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 10,
            [benimMi ? 'right' : 'left']: -8,
            borderStyle: 'solid',
            borderWidth: '8px 8px 8px 0',
            borderColor: `transparent ${benimMi ? '#1976d2' : '#f5f5f5'} transparent transparent`,
            transform: benimMi ? 'rotate(180deg)' : 'none'
          }
        }}
      >
        {mesaj.fileUrl && (
          <Box sx={{ mb: 1 }}>
            {mesaj.fileType === 'image' ? (
              <Box
                component="img"
                src={mesaj.fileUrl}
                alt="Gönderilen resim"
                sx={{
                  maxWidth: '100%',
                  maxHeight: 200,
                  borderRadius: 1,
                  cursor: 'pointer'
                }}
                onClick={() => window.open(mesaj.fileUrl, '_blank')}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Dosyayı İndir">
                  <IconButton
                    size="small"
                    onClick={() => window.open(mesaj.fileUrl, '_blank')}
                    sx={{ color: benimMi ? 'white' : 'primary.main' }}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Link
                  href={mesaj.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: benimMi ? 'white' : 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {mesaj.fileName}
                </Link>
              </Box>
            )}
          </Box>
        )}
        <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
          {mesaj.text}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'right',
            mt: 0.5,
            opacity: 0.8,
            fontSize: '0.7rem'
          }}
        >
          {tarih ? format(tarih, 'dd MMM yyyy HH:mm', { locale: tr }) : ''}
        </Typography>
      </Box>
    </Box>
  );
};

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
          gap: 1,
          bgcolor: '#f8f9fa'
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
