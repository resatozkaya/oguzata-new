import React from 'react';
import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const MesajBalonu = ({ mesaj, benimMi }) => {
  const tarih = mesaj.timestamp?.toDate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: benimMi ? 'row-reverse' : 'row',
        mb: 2,
        mx: 2
      }}
    >
      <Box
        sx={{
          maxWidth: '70%',
          minWidth: '100px',
          bgcolor: benimMi ? 'primary.main' : 'grey.100',
          color: benimMi ? 'white' : 'text.primary',
          p: 2,
          borderRadius: 2,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          boxShadow: 1,
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
        {mesaj.text && (
          <Typography 
            variant="body1" 
            sx={{ 
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap'
            }}
          >
            {mesaj.text}
          </Typography>
        )}
        
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'right',
            opacity: 0.7,
            fontSize: '0.75rem',
            mt: 'auto',
            pt: 0.5
          }}
        >
          {tarih ? format(tarih, 'dd MMM yyyy HH:mm', { locale: tr }) : ''}
        </Typography>
      </Box>
    </Box>
  );
};

export default MesajBalonu;
