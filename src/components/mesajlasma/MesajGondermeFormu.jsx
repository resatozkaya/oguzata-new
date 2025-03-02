import React, { useState } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../../contexts/AuthContext';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const MesajGondermeFormu = ({ alici }) => {
  const [mesaj, setMesaj] = useState('');
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mesaj.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: mesaj,
        sender: currentUser.uid,
        receiver: alici.uid,
        participants: [currentUser.uid, alici.uid],
        timestamp: serverTimestamp(),
      });

      setMesaj('');
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1 }}>
      <TextField
        fullWidth
        value={mesaj}
        onChange={(e) => setMesaj(e.target.value)}
        placeholder="Mesajınızı yazın..."
        variant="outlined"
        size="small"
      />
      <IconButton type="submit" color="primary">
        <SendIcon />
      </IconButton>
    </Box>
  );
};

export default MesajGondermeFormu;
