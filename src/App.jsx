import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { SnackbarProvider } from 'notistack';
import { SantiyeProvider } from './contexts/SantiyeContext';
import { DepoProvider } from './contexts/DepoContext';
import { PermissionProvider } from './contexts/PermissionContext';
import Layout from './components/layout/Layout';
import { Box, CircularProgress } from '@mui/material';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import ProtectedRoute from './components/ProtectedRoute';

// Tema oluştur
const theme = createTheme({
  palette: {
    primary: {
      main: '#1B5E20', // Koyu yeşil
      light: '#4C8C4A',
      dark: '#003300',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FFA000', // Turuncu
      light: '#FFC107',
      dark: '#FF6F00',
      contrastText: '#000',
    },
    error: {
      main: '#D32F2F',
    },
    warning: {
      main: '#FFA000',
    },
    info: {
      main: '#1976D2',
    },
    success: {
      main: '#388E3C',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.1rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '8px 16px',
        },
      },
    },
  },
});

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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <ProviderWrapper>
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
        </ProviderWrapper>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;