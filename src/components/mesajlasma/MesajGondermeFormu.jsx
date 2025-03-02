import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  InsertEmoticon as EmojiIcon,
  Image as ImageIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const MesajGondermeFormu = ({ alici, gonderen }) => {
  const [mesaj, setMesaj] = useState('');
  const [dosyaYukleniyor, setDosyaYukleniyor] = useState(false);
  const [onizlemeDosyasi, setOnizlemeDosyasi] = useState(null);
  const [emojiPickerAcik, setEmojiPickerAcik] = useState(false);
  const [dosyaDialogAcik, setDosyaDialogAcik] = useState(false);
  const dosyaInputRef = useRef();

  const handleMesajGonder = async (e) => {
    e.preventDefault();
    if ((!mesaj.trim() && !onizlemeDosyasi) || !alici) return;

    try {
      setDosyaYukleniyor(true);
      let dosyaUrl = null;
      let dosyaTipi = null;

      // Dosya varsa yükle
      if (onizlemeDosyasi) {
        const dosyaRef = ref(storage, `mesaj-dosyalari/${Date.now()}-${onizlemeDosyasi.name}`);
        await uploadBytes(dosyaRef, onizlemeDosyasi);
        dosyaUrl = await getDownloadURL(dosyaRef);
        dosyaTipi = onizlemeDosyasi.type.startsWith('image/') ? 'image' : 'file';
      }

      // Mesajı veritabanına ekle
      await addDoc(collection(db, 'messages'), {
        text: mesaj.trim(),
        senderId: gonderen.uid,
        receiverId: alici.id,
        timestamp: serverTimestamp(),
        read: false,
        fileUrl: dosyaUrl,
        fileType: dosyaTipi,
        fileName: onizlemeDosyasi?.name,
        participants: [gonderen.uid, alici.id]
      });

      setMesaj('');
      setOnizlemeDosyasi(null);
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
    } finally {
      setDosyaYukleniyor(false);
    }
  };

  const handleDosyaSec = (e) => {
    const dosya = e.target.files[0];
    if (dosya) {
      if (dosya.size > 10 * 1024 * 1024) { // 10MB limit
        alert('Dosya boyutu 10MB\'dan küçük olmalıdır.');
        return;
      }
      setOnizlemeDosyasi(dosya);
      setDosyaDialogAcik(true);
    }
  };

  const handleEmojiSec = (emoji) => {
    setMesaj(prev => prev + emoji.native);
    setEmojiPickerAcik(false);
  };

  return (
    <Box
      component="form"
      onSubmit={handleMesajGonder}
      sx={{
        p: 2,
        bgcolor: 'white',
        borderTop: '1px solid rgba(0, 0, 0, 0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}
    >
      <input
        type="file"
        ref={dosyaInputRef}
        onChange={handleDosyaSec}
        style={{ display: 'none' }}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
      />

      <Tooltip title="Dosya Ekle">
        <IconButton 
          onClick={() => dosyaInputRef.current.click()}
          disabled={dosyaYukleniyor}
        >
          <AttachFileIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Resim Ekle">
        <IconButton 
          onClick={() => {
            dosyaInputRef.current.accept = 'image/*';
            dosyaInputRef.current.click();
          }}
          disabled={dosyaYukleniyor}
        >
          <ImageIcon />
        </IconButton>
      </Tooltip>

      <Box sx={{ position: 'relative' }}>
        <Tooltip title="Emoji Ekle">
          <IconButton 
            onClick={() => setEmojiPickerAcik(!emojiPickerAcik)}
            disabled={dosyaYukleniyor}
          >
            <EmojiIcon />
          </IconButton>
        </Tooltip>
        {emojiPickerAcik && (
          <Box sx={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            zIndex: 1,
            boxShadow: 3,
            borderRadius: 1,
            overflow: 'hidden'
          }}>
            <Picker 
              data={data} 
              onEmojiSelect={handleEmojiSec}
              theme="light"
              set="apple"
            />
          </Box>
        )}
      </Box>

      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={mesaj}
        onChange={(e) => setMesaj(e.target.value)}
        placeholder="Mesajınızı yazın..."
        disabled={dosyaYukleniyor}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          }
        }}
      />

      <Tooltip title="Gönder">
        <IconButton 
          type="submit"
          color="primary"
          disabled={(!mesaj.trim() && !onizlemeDosyasi) || dosyaYukleniyor}
        >
          {dosyaYukleniyor ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Tooltip>

      <Dialog 
        open={dosyaDialogAcik} 
        onClose={() => {
          setDosyaDialogAcik(false);
          setOnizlemeDosyasi(null);
        }}
      >
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Dosya Önizleme</Typography>
            {onizlemeDosyasi?.type.startsWith('image/') ? (
              <Box
                component="img"
                src={URL.createObjectURL(onizlemeDosyasi)}
                alt="Önizleme"
                sx={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachFileIcon />
                <Typography>{onizlemeDosyasi?.name}</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDosyaDialogAcik(false);
              setOnizlemeDosyasi(null);
            }}
            startIcon={<CloseIcon />}
          >
            İptal
          </Button>
          <Button 
            onClick={() => {
              setDosyaDialogAcik(false);
              handleMesajGonder({ preventDefault: () => {} });
            }}
            variant="contained"
            startIcon={<SendIcon />}
          >
            Gönder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MesajGondermeFormu;
