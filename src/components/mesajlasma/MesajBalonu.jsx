import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const MesajBalonu = ({ mesaj, benimMi }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: benimMi ? 'flex-end' : 'flex-start',
        mb: 1,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          p: 1,
          backgroundColor: benimMi ? 'primary.main' : 'grey.100',
          color: benimMi ? 'white' : 'text.primary',
          maxWidth: '70%',
          borderRadius: 2,
        }}
      >
        <Typography variant="body1">{mesaj.text}</Typography>
        <Typography variant="caption" color={benimMi ? 'grey.200' : 'text.secondary'}>
          {mesaj.timestamp?.toDate().toLocaleTimeString()}
        </Typography>
      </Paper>
    </Box>
  );
};

export default MesajBalonu;
