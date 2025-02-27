import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  Assignment as AssignmentIcon,
  NewReleases as NewIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, color }) => (
  <Paper
    elevation={2}
    sx={{
      p: 2,
      height: '100%',
      bgcolor: `${color}.main`,
      color: 'white',
      '&:hover': {
        transform: 'translateY(-2px)',
        transition: 'transform 0.2s'
      }
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {icon}
      <Box>
        <Typography variant="h4">{value}</Typography>
        <Typography variant="body2">{title}</Typography>
      </Box>
    </Box>
  </Paper>
);

const EksiklikIstatistikKartlari = ({ istatistikler }) => {
  const cards = [
    {
      title: 'Toplam Eksiklik',
      value: istatistikler.toplam,
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      color: 'primary'
    },
    {
      title: 'Yeni',
      value: istatistikler.yeni,
      icon: <NewIcon sx={{ fontSize: 40 }} />,
      color: 'info'
    },
    {
      title: 'Devam Eden',
      value: istatistikler.devamEden,
      icon: <RefreshIcon sx={{ fontSize: 40 }} />,
      color: 'warning'
    },
    {
      title: 'Tamamlandı',
      value: istatistikler.tamamlandi,
      icon: <CheckIcon sx={{ fontSize: 40 }} />,
      color: 'success'
    },
    {
      title: 'Kritik',
      value: istatistikler.kritik,
      icon: <WarningIcon sx={{ fontSize: 40 }} />,
      color: 'error'
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {cards.map((card, index) => (
        <Grid item xs={12} sm={6} md={2.4} key={index}>
          <StatCard {...card} />
        </Grid>
      ))}
    </Grid>
  );
};

export default EksiklikIstatistikKartlari; 