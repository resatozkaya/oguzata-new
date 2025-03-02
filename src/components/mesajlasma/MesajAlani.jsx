import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, Link } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import MesajGondermeFormu from './MesajGondermeFormu';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
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
                  cursor: 'pointer',
                  objectFit: 'contain'
                }}
                onClick={() => window.open(mesaj.fileUrl, '_blank')}
                loading="lazy"
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
        <Typography variant="body1" sx={{ 
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          '& .emoji': {
            width: '1.5em',
            height: '1.5em',
            verticalAlign: 'middle',
            margin: '0 0.1em'
          }
        }}>
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
  const mesajlarSonuRef = useRef(null);

  useEffect(() => {
    if (!seciliKullanici?.id || !currentUser?.uid) return;

    const mesajlarRef = collection(db, 'messages');
    const q = query(
      mesajlarRef,
      where('senderId', 'in', [currentUser.uid, seciliKullanici.id]),
      where('receiverId', 'in', [currentUser.uid, seciliKullanici.id]),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const yeniMesajlar = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(mesaj => 
          (mesaj.senderId === currentUser.uid && mesaj.receiverId === seciliKullanici.id) ||
          (mesaj.senderId === seciliKullanici.id && mesaj.receiverId === currentUser.uid)
        );

      console.log('Gelen mesajlar:', yeniMesajlar); // Debug için
      setMesajlar(yeniMesajlar);

      // Okunmamış mesajları işaretle
      yeniMesajlar.forEach(async (mesaj) => {
        if (!mesaj.read && mesaj.receiverId === currentUser.uid) {
          const mesajRef = doc(db, 'messages', mesaj.id);
          await updateDoc(mesajRef, { read: true });
        }
      });
    });

    return () => unsubscribe();
  }, [seciliKullanici?.id, currentUser?.uid]);

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
        height: '100%',
        bgcolor: 'background.default'
      }}>
        <Typography variant="h6" color="text.primary">
          Mesajlaşmak için bir kullanıcı seçin
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      maxHeight: 'calc(100vh - 200px)', // Header ve diğer alanlar için boşluk
      bgcolor: 'background.default'
    }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Typography variant="h6" color="text.primary">
          {seciliKullanici.name} {seciliKullanici.surname}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {seciliKullanici.email}
        </Typography>
      </Box>

      <Box 
        ref={mesajAlaniRef}
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          maxHeight: 'calc(100vh - 250px)', // Header, footer ve diğer alanlar için boşluk
          bgcolor: 'background.default'
        }}
      >
        <Box sx={{ 
          flex: 1,
          overflowY: 'auto',
          p: 2,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'action.hover',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'primary.main',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          },
        }}>
          {mesajlar.map((mesaj) => (
            <MesajBalonu
              key={mesaj.id}
              mesaj={mesaj}
              benimMi={mesaj.senderId === currentUser.uid}
            />
          ))}
          <div ref={mesajlarSonuRef} />
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <MesajGondermeFormu alici={seciliKullanici} gonderen={currentUser} />
        </Box>
      </Box>
    </Box>
  );
};

export default MesajAlani;
