import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
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
  Typography,
  InputAdornment
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
  const theme = useTheme();
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
      let dosyaAdi = null;

      // Dosya varsa yükle
      if (onizlemeDosyasi) {
        const dosyaRef = ref(storage, `mesaj-dosyalari/${Date.now()}-${onizlemeDosyasi.name}`);
        
        if (onizlemeDosyasi.type === 'image') {
          // Base64'ten blob'a çevir
          const response = await fetch(onizlemeDosyasi.base64);
          const blob = await response.blob();
          await uploadBytes(dosyaRef, blob);
        } else {
          await uploadBytes(dosyaRef, onizlemeDosyasi.file);
        }
        
        dosyaUrl = await getDownloadURL(dosyaRef);
        dosyaTipi = onizlemeDosyasi.type;
        dosyaAdi = onizlemeDosyasi.name;
      }

      // Mesajı veritabanına ekle
      await addDoc(collection(db, 'messages'), {
        senderId: gonderen.uid,
        receiverId: alici.id,
        text: mesaj.trim(),
        timestamp: serverTimestamp(),
        read: false,
        fileUrl: dosyaUrl,
        fileType: dosyaTipi,
        fileName: dosyaAdi
      });

      setMesaj('');
      setOnizlemeDosyasi(null);
      setDosyaDialogAcik(false);
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      alert('Mesaj gönderilemedi');
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

      const reader = new FileReader();
      reader.onloadend = () => {
        setOnizlemeDosyasi({
          file: dosya,
          base64: reader.result,
          type: dosya.type.startsWith('image/') ? 'image' : 'file',
          name: dosya.name
        });
        setDosyaDialogAcik(true);
      };
      reader.readAsDataURL(dosya);
    }
  };

  // Emoji seçici için dışarı tıklama kontrolü
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerAcik && !event.target.closest('.emoji-mart')) {
        setEmojiPickerAcik(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [emojiPickerAcik]);

  const renderTooltipContent = (title) => {
    return dosyaYukleniyor ? (
      <Box component="span">
        <CircularProgress size={16} sx={{ mr: 1 }} />
        Yükleniyor...
      </Box>
    ) : title;
  };

  return (
    <Box
      component="form"
      onSubmit={handleMesajGonder}
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        position: 'relative'
      }}
    >
      <input
        type="file"
        ref={dosyaInputRef}
        onChange={handleDosyaSec}
        style={{ display: 'none' }}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
      />

      <Box component="span">
        <Tooltip title={renderTooltipContent("Dosya Ekle")}>
          <span>
            <IconButton 
              onClick={() => {
                dosyaInputRef.current.accept = "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                dosyaInputRef.current.click();
              }}
              disabled={dosyaYukleniyor}
              color="primary"
            >
              <AttachFileIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Box component="span">
        <Tooltip title={renderTooltipContent("Resim Ekle")}>
          <span>
            <IconButton 
              onClick={() => {
                dosyaInputRef.current.accept = 'image/*';
                dosyaInputRef.current.click();
              }}
              disabled={dosyaYukleniyor}
              color="primary"
            >
              <ImageIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Box sx={{ position: 'relative' }}>
        <Tooltip title="Emoji Ekle">
          <IconButton 
            onClick={() => setEmojiPickerAcik(!emojiPickerAcik)}
            disabled={dosyaYukleniyor}
            color="primary"
          >
            <EmojiIcon />
          </IconButton>
        </Tooltip>
        {emojiPickerAcik && (
          <Box
            sx={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              zIndex: 1000,
              boxShadow: 3,
              borderRadius: 1,
              bgcolor: 'background.paper',
              width: '350px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Picker
              data={data}
              onEmojiSelect={(emoji) => {
                setMesaj(prev => prev + emoji.native);
                setEmojiPickerAcik(false);
              }}
              theme={theme.palette.mode}
              set="google"
              previewPosition="none"
              skinTonePosition="none"
              searchPosition="none"
              categories={['frequent', 'people', 'nature', 'foods', 'activity', 'places', 'objects', 'symbols', 'flags']}
              emojiSize={20}
              emojiButtonSize={28}
              maxFrequentRows={0}
              perLine={8}
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
            bgcolor: 'background.paper',
            '&.Mui-focused': {
              borderColor: 'primary.main',
            }
          }
        }}
      />

      <Tooltip title={dosyaYukleniyor ? "Yükleniyor..." : "Gönder"}>
        <span>
          <IconButton
            type="submit"
            disabled={(!mesaj.trim() && !onizlemeDosyasi) || dosyaYukleniyor}
            color="primary"
            size="large"
          >
            {dosyaYukleniyor ? (
              <CircularProgress size={24} />
            ) : (
              <SendIcon />
            )}
          </IconButton>
        </span>
      </Tooltip>

      <Dialog
        open={dosyaDialogAcik}
        onClose={() => {
          setDosyaDialogAcik(false);
          setOnizlemeDosyasi(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Dosya Önizleme</Typography>
            {onizlemeDosyasi?.type === 'image' ? (
              <Box
                component="img"
                src={onizlemeDosyasi.base64}
                alt="Önizleme"
                sx={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  objectFit: 'contain',
                  borderRadius: 1
                }}
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
            onClick={handleMesajGonder}
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
