import React from 'react';
import { 
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  ReceiptLong as ReceiptLongIcon,
  AccountBalance as AccountBalanceIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Chat as ChatIcon,
  Timeline as TimelineIcon,
  Money as MoneyIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { PAGE_PERMISSIONS } from './permissions';

export const menuItems = [
  {
    title: 'Anasayfa',
    icon: React.createElement(DashboardIcon),
    path: '/',
    permission: 'dashboard_view',
  },
  {
    title: 'Şantiye Yönetimi',
    icon: React.createElement(BusinessIcon),
    path: '/santiye',
    permission: PAGE_PERMISSIONS.SANTIYE.VIEW,
  },
  {
    title: 'Personel Yönetimi',
    icon: React.createElement(PeopleIcon),
    path: '/personel',
    permission: PAGE_PERMISSIONS.PERSONEL.VIEW,
  },
  {
    title: 'Puantaj',
    icon: React.createElement(AccessTimeIcon),
    path: '/puantaj',
    permission: PAGE_PERMISSIONS.PUANTAJ.VIEW,
  },
  {
    title: 'Günlük Rapor',
    icon: React.createElement(DescriptionIcon),
    path: '/gunluk-rapor',
    permission: PAGE_PERMISSIONS.GUNLUK_RAPOR.VIEW,
  },
  {
    title: 'Teslimat Ekip',
    icon: React.createElement(AssignmentIcon),
    path: '/teslimat-ekip',
    permission: PAGE_PERMISSIONS.TESLIMAT.VIEW,
  },
  {
    title: 'Depo Yönetimi',
    icon: React.createElement(InventoryIcon),
    path: '/depo',
    permission: PAGE_PERMISSIONS.DEPO.VIEW,
  }, /*
 {
    title: 'Sözleşme ve Hakediş',
    icon: React.createElement(ReceiptIcon),
    children: [
      { 
        title: 'Sözleşmeler', 
        icon: React.createElement(DescriptionIcon), 
        path: '/sozlesme',
        permission: PAGE_PERMISSIONS.SOZLESME.VIEW,
      },
      { 
        title: 'Yeşil Defter', 
        icon: React.createElement(AssignmentIcon), 
        path: '/yesilDefter',
        permission: PAGE_PERMISSIONS.YESIL_DEFTER.VIEW,
      },
      { 
        title: 'Ataşman', 
        icon: React.createElement(TimelineIcon), 
        path: '/atasmanlar',
        permission: PAGE_PERMISSIONS.ATASMAN.VIEW,
      },
      { 
        title: 'Metraj', 
        icon: React.createElement(TimelineIcon), 
        path: '/metraj',
        permission: PAGE_PERMISSIONS.METRAJ.VIEW,
      },
      { 
        title: 'Kesinti', 
        icon: React.createElement(MoneyIcon), 
        path: '/kesintiler',
        permission: PAGE_PERMISSIONS.KESINTI.VIEW,
      },
      { 
        title: 'Hakediş', 
        icon: React.createElement(AccountBalanceIcon), 
        path: '/hakedis',
        permission: PAGE_PERMISSIONS.HAKEDIS.VIEW,
      },
      { 
        title: 'Birim Fiyatlar', 
        icon: React.createElement(PaymentIcon), 
        path: '/birim-fiyatlar',
        permission: PAGE_PERMISSIONS.BIRIM_FIYAT.VIEW,
      },
      { 
        title: 'Taşeron Yönetimi', 
        icon: React.createElement(BusinessIcon), 
        path: '/taseron-yonetimi',
        permission: PAGE_PERMISSIONS.TASERON.VIEW,
      }
    ]
  },*/
  {
    title: 'Masraf Beyan',
    icon: React.createElement(ReceiptIcon),
    path: '/masraf-beyan',
    permission: PAGE_PERMISSIONS.MASRAF_BEYAN.VIEW,
  },
  {
    title: 'Masraf Onay',
    icon: React.createElement(ReceiptLongIcon),
    path: '/masraf-onay',
    permission: PAGE_PERMISSIONS.MASRAF_BEYAN.ONAY,
  },
  {
    title: 'Masraf Muhasebe',
    icon: React.createElement(AccountBalanceIcon),
    path: '/masraf-muhasebe',
    permission: PAGE_PERMISSIONS.MASRAF_BEYAN.MUHASEBE,
  },
  {
    title: 'Mesajlaşma',
    icon: React.createElement(ChatIcon),
    path: '/mesajlar',
    permission: PAGE_PERMISSIONS.MESAJLASMA.VIEW,
  },
  {
    title: 'Ayarlar',
    icon: React.createElement(SettingsIcon),
    path: '/settings',
    permission: PAGE_PERMISSIONS.AYARLAR.VIEW,
  },
  {
    title: 'Yetki Yönetimi',
    icon: React.createElement(SecurityIcon),
    path: '/yetki-yonetimi',
    permission: PAGE_PERMISSIONS.YONETIM.VIEW
  },
]; 