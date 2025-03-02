import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Chip,
  Badge,
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

const getRoleText = (role) => {
  switch (role) {
    case 'ADMIN':
      return 'YÖNETİCİ';
    case 'MANAGER':
      return 'MÜDÜR';
    case 'PERSONEL':
      return 'PERSONEL';
    case 'EMPLOYEE':
      return 'ÇALIŞAN';
    default:
      return role || 'PERSONEL';
  }
};

const getRoleColor = (role) => {
  switch (role) {
    case 'ADMIN':
      return '#f44336';
    case 'MANAGER':
      return '#2196f3';
    case 'PERSONEL':
      return '#4caf50';
    case 'EMPLOYEE':
      return '#ff9800';
    default:
      return '#9e9e9e';
  }
};

const KullaniciListesi = ({ onKullaniciSec, seciliKullanici }) => {
  const { currentUser } = useAuth();
  const [kullanicilar, setKullanicilar] = useState([]);
  const [filtreliKullanicilar, setFiltreliKullanicilar] = useState([]);
  const [aramaMetni, setAramaMetni] = useState('');
  const [okunmamisMesajlar, setOkunmamisMesajlar] = useState({});

  useEffect(() => {
    // Tüm kullanıcıları getir
    const kullanicilarRef = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(kullanicilarRef, (snapshot) => {
      const kullaniciListesi = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.id !== currentUser?.uid); // Kendimizi listeden çıkar
      setKullanicilar(kullaniciListesi);
      setFiltreliKullanicilar(kullaniciListesi);
    });

    // Okunmamış mesajları dinle
    if (currentUser?.uid) {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('receiverId', '==', currentUser.uid),
        where('read', '==', false)
      );

      const unsubscribeMessages = onSnapshot(q, (snapshot) => {
        const yeniOkunmamislar = {};
        snapshot.docs.forEach(doc => {
          const mesaj = doc.data();
          yeniOkunmamislar[mesaj.senderId] = (yeniOkunmamislar[mesaj.senderId] || 0) + 1;
        });
        setOkunmamisMesajlar(yeniOkunmamislar);
      });

      return () => {
        unsubscribeUsers();
        unsubscribeMessages();
      };
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    const filtreliListe = kullanicilar.filter(kullanici =>
      kullanici.name?.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      kullanici.surname?.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      kullanici.email?.toLowerCase().includes(aramaMetni.toLowerCase())
    );
    setFiltreliKullanicilar(filtreliListe);
  }, [aramaMetni, kullanicilar]);

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Kullanıcı Ara..."
        value={aramaMetni}
        onChange={(e) => setAramaMetni(e.target.value)}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            bgcolor: 'white',
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      <List sx={{ width: '100%', maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
        {filtreliKullanicilar.map((kullanici, index) => (
          <React.Fragment key={kullanici.id}>
            <ListItem
              button
              selected={seciliKullanici?.id === kullanici.id}
              onClick={() => onKullaniciSec(kullanici)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.12)',
                  },
                },
              }}
            >
              <ListItemAvatar>
                <Badge
                  badgeContent={okunmamisMesajlar[kullanici.id] || 0}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: '#f44336',
                      color: 'white',
                    }
                  }}
                >
                  <Avatar
                    src={kullanici.photoURL || `https://ui-avatars.com/api/?name=${kullanici.name}+${kullanici.surname}&background=1a237e&color=fff`}
                    alt={kullanici.name}
                    sx={{ width: 40, height: 40 }}
                  />
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {kullanici.name} {kullanici.surname}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {kullanici.email}
                    </Typography>
                    <Chip
                      label={getRoleText(kullanici.role)}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        bgcolor: getRoleColor(kullanici.role),
                        color: 'white',
                        alignSelf: 'flex-start'
                      }}
                    />
                  </Box>
                }
              />
            </ListItem>
            {index < filtreliKullanicilar.length - 1 && (
              <Divider variant="inset" component="li" />
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default KullaniciListesi;
