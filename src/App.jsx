import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { SnackbarProvider } from 'notistack';
import { SantiyeProvider } from './contexts/SantiyeContext';
import { DepoProvider } from './contexts/DepoContext';
import { PermissionProvider } from './contexts/PermissionContext';
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
import DepoYonetimi from './pages/depo/DepoYonetimi';
import GunlukRapor from './pages/GunlukRapor';
import EksiklikYonetimi from './pages/eksiklik/EksiklikYonetimi';
import MesajlasmaSayfasi from './components/mesajlasma/MesajlasmaSayfasi';
import BirimFiyatlar from './pages/BirimFiyatlar';
import YesilDefterList from './pages/yesilDefter/YesilDefterList';
import YesilDefterForm from './pages/yesilDefter/YesilDefterForm';
import Atasmanlar from './pages/Atasmanlar';
import Kesintiler from './pages/Kesintiler';

const App = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Ortak provider wrapper component
  const ProviderWrapper = ({ children }) => (
    <PermissionProvider>
      <SantiyeProvider>
        <DepoProvider>
          {children}
        </DepoProvider>
      </SantiyeProvider>
    </PermissionProvider>
  );

  return (
    <SnackbarProvider 
      maxSnack={3} 
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={3000}
      dense
      preventDuplicate
    >
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" />} />
        
        {/* Protected routes */}
        {currentUser && (
          <Route path="/*" element={
            <ProviderWrapper>
              <Layout>
                <Routes>
                  {/* Basic routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />

                  {/* Feature routes */}
                  <Route path="/personel" element={<PersonelListesi />} />
                  <Route path="/personel-kayit" element={<PersonelKayit />} />
                  <Route path="/personel/:id" element={<PersonelKayit />} />
                  <Route path="/santiye" element={<Santiye />} />
                  <Route path="/santiye/:id" element={<SantiyeDetay />} />
                  <Route path="/puantaj" element={<Puantaj />} />
                  <Route path="/depo" element={<DepoYonetimi />} />
                  <Route path="/gunluk-rapor" element={<GunlukRapor />} />
                  <Route path="/santiye/:santiyeId/blok/:blokId/eksiklikler" element={<EksiklikYonetimi />} />
                  <Route path="/teslimat-ekip" element={<EksiklikYonetimi showTeslimatEkip={true} />} />
                  <Route path="/mesajlar" element={<MesajlasmaSayfasi />} />
                  <Route path="/birim-fiyatlar" element={<BirimFiyatlar />} />
                  <Route path="/yesilDefter" element={<YesilDefterList />} />
                  <Route path="/yesilDefter/yeni" element={<YesilDefterForm />} />
                  <Route path="/yesilDefter/:id" element={<YesilDefterForm />} />
                  <Route path="/atasmanlar" element={<Atasmanlar />} />
                  <Route path="/kesintiler" element={<Kesintiler />} />
                </Routes>
              </Layout>
            </ProviderWrapper>
          } />
        )}

        {/* Redirect to login if not authenticated */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </SnackbarProvider>
  );
};

export default App;