import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { SnackbarProvider } from 'notistack';
import { SantiyeProvider } from './contexts/SantiyeContext';
import { DepoProvider } from './contexts/DepoContext';
import Layout from './components/layout/Layout';
import { Box, CircularProgress } from '@mui/material';

// Components
import LoginPage from './pages/auth/LoginPage';
import Register from './pages/auth/Register';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import PersonelListesi from './pages/PersonelListesi';
import PersonelKayit from './pages/PersonelKayit';
import Puantaj from './pages/Puantaj';
import Santiye from './pages/Santiye';
import SantiyeDetay from './pages/SantiyeDetay';
import IsProgrami from './pages/IsProgrami';
import Depo from './pages/Depo';
import GunlukRapor from './pages/GunlukRapor';
import EksiklikYonetimi from './pages/eksiklik/EksiklikYonetimi';
import SantiyeSecici from './components/SantiyeSecici';
import DepoYonetimi from './pages/depo/DepoYonetimi';
import MesajlasmaSayfasi from './components/mesajlasma/MesajlasmaSayfasi';
import Sozlesme from './pages/Sozlesme';
import HakedisPage from './pages/hakedis/HakedisPage';
import HakedisForm from './pages/hakedis/HakedisForm';
import BirimFiyatlar from './pages/BirimFiyatlar';
import SozlesmePage from './pages/sozlesme/SozlesmePage';
import SozlesmeForm from './pages/sozlesme/SozlesmeForm';
import SozlesmeDetay from './pages/sozlesme/SozlesmeDetay';
import YesilDefter from './pages/YesilDefter';
import Atasman from './pages/Atasman';
// import Metraj from './pages/Metraj';
import Kesinti from './pages/Kesinti';
import TaseronYonetimi from './pages/TaseronYonetimi';
import YesilDefterList from './pages/yesilDefter/YesilDefterList';
import YesilDefterForm from './pages/yesilDefter/YesilDefterForm';
import Atasmanlar from './pages/Atasmanlar';
import Kesintiler from './pages/Kesintiler';

const App = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  // Auth yüklenirken loading göster
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <SnackbarProvider 
      maxSnack={3} 
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={3000}
      dense
      preventDuplicate
    >
      <SantiyeProvider>
        <DepoProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" />} />

            {/* Protected routes */}
            <Route element={currentUser ? <Layout /> : <Navigate to="/login" />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/personel" element={<PersonelListesi />} />
              <Route path="/personel-kayit" element={<PersonelKayit />} />
              <Route path="/personel/:id" element={<PersonelKayit />} />
              <Route path="/santiye" element={<Santiye />} />
              <Route path="/santiye/:id" element={<SantiyeDetay />} />
              <Route path="/puantaj" element={<Puantaj />} />
              {/* <Route path="/is-programi" element={<IsProgrami />} /> */}
              <Route path="/depo" element={<DepoYonetimi />} />
              <Route path="/gunluk-rapor" element={<GunlukRapor />} />
              <Route path="/santiye/:santiyeId/blok/:blokId/eksiklikler" element={<EksiklikYonetimi />} />
              <Route path="/teslimat-ekip" element={<EksiklikYonetimi showTeslimatEkip={true} />} />
              <Route path="/mesajlar" element={<MesajlasmaSayfasi />} />
              {/* Sözleşme ve Hakediş ile ilgili tüm sayfalar geçici olarak kapalı
              <Route path="/sozlesme" element={<SozlesmePage />} />
              <Route path="/sozlesme/yeni" element={<SozlesmeForm />} />
              <Route path="/sozlesme/:id" element={<SozlesmeDetay />} />
              <Route path="/sozlesme/:id/duzenle" element={<SozlesmeForm />} />
              <Route path="/hakedis" element={<HakedisPage />} />
              <Route path="/hakedis/yeni" element={<HakedisForm />} />
              <Route path="/hakedis/:id" element={<HakedisForm />} />
              <Route path="/hakedis/:id/duzenle" element={<HakedisForm />} />
              */}
              <Route path="/birim-fiyatlar" element={<BirimFiyatlar />} />
              {/* <Route path="/metraj" element={<Metraj />} /> */}
              <Route path="/yesilDefter" element={<YesilDefterList />} />
              <Route path="/yesilDefter/yeni" element={<YesilDefterForm />} />
              <Route path="/yesilDefter/duzenle/:id" element={<YesilDefterForm />} />
              <Route path="/atasman" element={<Atasman />} />
              <Route path="/kesinti" element={<Kesinti />} />
              <Route path="/taseron-yonetimi" element={<TaseronYonetimi />} />
              <Route path="/atasmanlar" element={<Atasmanlar />} />
              <Route path="/kesintiler" element={<Kesintiler />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to={currentUser ? "/" : "/login"} />} />
          </Routes>
        </DepoProvider>
      </SantiyeProvider>
    </SnackbarProvider>
  );
};

export default App;