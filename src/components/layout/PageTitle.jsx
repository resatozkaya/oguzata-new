import React from 'react';
import { useLocation } from 'react-router-dom';
import { Typography } from '@mui/material';

const getPageTitle = (pathname) => {
  switch (pathname) {
    case '/':
      return 'Ana Sayfa';
    case '/santiye':
      return 'Şantiye Yönetimi';
    case '/personel':
      return 'Personel Yönetimi';
    case '/puantaj':
      return 'Puantaj';
    case '/is-programi':
      return 'İş Programı';
    case '/depo':
      return 'Depo Yönetimi';
    case '/rapor':
      return 'Günlük Rapor';
    case '/hakedis':
      return 'Hakediş Yönetimi';
    case '/teslim-fisi':
      return 'Teslim Fişi';
    case '/odeme-onay':
      return 'Ödeme Onay';
    case '/site-sakinleri':
      return 'Site Sakinleri';
    case '/mesajlar':
      return 'Mesajlaşma';
    case '/ayarlar':
      return 'Ayarlar';
    case '/yonetici':
      return 'Yönetici Sayfası';
    case '/teslimat-ekip':
      return 'Teslimat Ekip';
    default:
      return '';
  }
};

const PageTitle = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  if (!title) return null;

  return (
    <Typography 
      variant="h6" 
      component="div" 
      sx={{ 
        flexGrow: 1,
        color: 'white',
        fontWeight: 500
      }}
    >
      {title}
    </Typography>
  );
};

export default PageTitle;
