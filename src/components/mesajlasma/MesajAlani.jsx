import React, { useRef, useEffect } from 'react';
import { Box, Typography, IconButton, Tooltip, Link } from '@mui/material';
import { DownloadRounded as DownloadIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const MesajBalonu = ({ mesaj, benimMi }) => {
  console.log('Mesaj balonu render ediliyor:', mesaj);
  const tarih = mesaj.timestamp?.toDate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: benimMi ? 'row-reverse' : 'row',
        mb: 2, // Boşluk MesajBalonu'na taşındı
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
        <Typography 
          variant="body1" 
          sx={{ 
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            mb: 1
          }}
        >
          {mesaj.text}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'right',
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

const MesajAlani = ({ mesajlar, currentUser }) => {
  const mesajAlaniRef = useRef();

  useEffect(() => {
    if (mesajAlaniRef.current) {
      setTimeout(() => {
        mesajAlaniRef.current.scrollTop = mesajAlaniRef.current.scrollHeight;
      }, 100);
    }
  }, [mesajlar]);

  useEffect(() => {
    if (mesajAlaniRef.current && mesajlar.length > 0) {
      setTimeout(() => {
        mesajAlaniRef.current.scrollTop = mesajAlaniRef.current.scrollHeight;
      }, 100);
    }
  }, []);

  return (
    <Box
      ref={mesajAlaniRef}
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f8f9fa',
        height: 'calc(100vh - 240px)',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: 'grey.100',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'grey.400',
          borderRadius: '4px',
          '&:hover': {
            bgcolor: 'grey.500',
          },
        },
      }}
    >
      {mesajlar.map((mesaj) => (
        <MesajBalonu
          key={mesaj.id}
          mesaj={mesaj}
          benimMi={mesaj.senderId === currentUser.uid}
        />
      ))}
    </Box>
  );
};

export default MesajAlani;
