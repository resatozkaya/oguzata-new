import React, { useState, useRef } from 'react';
import { Box, IconButton, TextField, Tooltip } from '@mui/material';
import { Send, InsertEmoticon } from '@mui/icons-material';
import EmojiPicker from 'emoji-picker-react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const MesajGondermeFormu = ({ alici, gonderen }) => {
  const [mesaj, setMesaj] = useState('');
  const [emojiPickerAcik, setEmojiPickerAcik] = useState(false);
  const mesajInputRef = useRef();

  const handleMesajGonder = async () => {
    if (!mesaj.trim()) return;

    try {
      const yeniMesaj = {
        text: mesaj.trim(),
        senderId: gonderen.uid,
        receiverId: alici.uid,
        timestamp: serverTimestamp(),
        read: false
      };

      await addDoc(collection(db, 'messages'), yeniMesaj);
      setMesaj('');
      setEmojiPickerAcik(false);
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
    }
  };

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const cursorPos = mesajInputRef.current.selectionStart;
    const metinBasi = mesaj.substring(0, cursorPos);
    const metinSonu = mesaj.substring(cursorPos);
    setMesaj(metinBasi + emoji + metinSonu);
    setEmojiPickerAcik(false);
  };

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        handleMesajGonder();
      }}
      sx={{
        p: 2,
        bgcolor: 'white',
        display: 'flex',
        gap: 1,
        alignItems: 'flex-end',
        position: 'relative',
        borderTop: 1,
        borderColor: 'divider',
        mt: 'auto',
        pb: 3
      }}
    >
      <Tooltip title="Emoji Ekle">
        <span>
          <IconButton
            size="small"
            onClick={() => setEmojiPickerAcik(!emojiPickerAcik)}
            sx={{ color: 'primary.main' }}
          >
            <InsertEmoticon />
          </IconButton>
        </span>
      </Tooltip>

      {emojiPickerAcik && (
        <Box sx={{ position: 'absolute', bottom: '100%', left: 0, zIndex: 1 }}>
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </Box>
      )}

      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={mesaj}
        onChange={(e) => setMesaj(e.target.value)}
        placeholder="Mesajınızı yazın..."
        variant="outlined"
        size="small"
        inputRef={mesajInputRef}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '20px',
          }
        }}
      />

      <Tooltip title="Gönder">
        <span>
          <IconButton
            color="primary"
            onClick={handleMesajGonder}
            disabled={!mesaj.trim()}
          >
            <Send />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

export default MesajGondermeFormu;
