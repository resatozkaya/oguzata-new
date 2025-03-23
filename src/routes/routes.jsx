import MasrafBeyan from '../pages/masrafBeyan/MasrafBeyan';
import MasrafBeyanOnay from '../pages/masrafBeyan/MasrafBeyanOnay';
import MasrafBeyanMuhasebe from '../pages/masrafBeyan/MasrafBeyanMuhasebe';
import YetkiYonetimi from '../pages/YetkiYonetimi';

export const routes = [
  // Masraf Beyan routes
  {
    path: '/masraf-beyan',
    element: <MasrafBeyan />,
    requireAuth: true,
  },
  {
    path: '/masraf-beyan/onay',
    element: <MasrafBeyanOnay />,
    requireAuth: true,
  },
  {
    path: '/masraf-beyan/muhasebe',
    element: <MasrafBeyanMuhasebe />,
    requireAuth: true,
  },
  {
    path: '/yetki-yonetimi',
    element: <YetkiYonetimi />,
    requireAuth: true,
  },
]; 