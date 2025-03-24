import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { SnackbarProvider } from 'notistack';
import { SantiyeProvider } from './contexts/SantiyeContext';
import { DepoProvider } from './contexts/DepoContext';
import { PermissionProvider } from './contexts/PermissionContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import { Box, CircularProgress } from '@mui/material';
import ProtectedRoute from './components/ProtectedRoute';

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
import MasrafBeyan from './pages/masrafBeyan/MasrafBeyan';
import MasrafBeyanOnay from './pages/masrafBeyan/MasrafBeyanOnay';
import MasrafBeyanMuhasebe from './pages/masrafBeyan/MasrafBeyanMuhasebe';
import YetkiYonetimi from './pages/YetkiYonetimi';

const App = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const routes = [
    { path: "/", element: <HomePage /> },
    { path: "/profile", element: <ProfilePage /> },
    { path: "/settings", element: <SettingsPage /> },
    { path: "/personel", element: <PersonelListesi /> },
    { path: "/personel-kayit", element: <PersonelKayit /> },
    { path: "/personel/:id", element: <PersonelKayit /> },
    { path: "/santiye", element: <Santiye /> },
    { path: "/santiye/:id", element: <SantiyeDetay /> },
    { path: "/puantaj", element: <Puantaj /> },
    { path: "/depo", element: <DepoYonetimi /> },
    { path: "/gunluk-rapor", element: <GunlukRapor /> },
    { path: "/santiye/:santiyeId/blok/:blokId/eksiklikler", element: <EksiklikYonetimi /> },
    { path: "/teslimat-ekip", element: <EksiklikYonetimi showTeslimatEkip={true} /> },
    { path: "/mesajlar", element: <MesajlasmaSayfasi /> },
    { path: "/birim-fiyatlar", element: <BirimFiyatlar /> },
    { path: "/yesilDefter", element: <YesilDefterList /> },
    { path: "/yesilDefter/yeni", element: <YesilDefterForm /> },
    { path: "/yesilDefter/:id", element: <YesilDefterForm /> },
    { path: "/atasmanlar", element: <Atasmanlar /> },
    { path: "/kesintiler", element: <Kesintiler /> },
    { path: "/masraf-beyan", element: <MasrafBeyan /> },
    { path: "/masraf-onay", element: <MasrafBeyanOnay /> },
    { path: "/masraf-muhasebe", element: <MasrafBeyanMuhasebe /> },
    { path: "/yetki-yonetimi", element: <YetkiYonetimi /> }
  ];

  return (
    <ThemeProvider>
      <SnackbarProvider maxSnack={3}>
        <PermissionProvider>
          <SantiyeProvider>
            <DepoProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                {currentUser ? (
                  <Route
                    element={
                      <Layout>
                        <Outlet />
                      </Layout>
                    }
                  >
                    {routes.map((route, index) => (
                      <Route
                        key={index}
                        path={route.path}
                        element={
                          <ProtectedRoute permissions={route.permissions}>
                            {route.element}
                          </ProtectedRoute>
                        }
                      />
                    ))}
                  </Route>
                ) : (
                  <Route path="*" element={<Navigate to="/login" />} />
                )}
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </DepoProvider>
          </SantiyeProvider>
        </PermissionProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;