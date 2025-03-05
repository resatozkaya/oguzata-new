import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { SantiyeProvider } from './contexts/SantiyeContext';
import { DepoProvider } from './contexts/DepoContext';
import Layout from './components/layout/Layout';

// Components
import Login from './pages/auth/Login';
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
import Hakedis from './pages/Hakedis';
import HakedisForm from './pages/hakedis/HakedisForm';

// Özel route bileşeni
const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

// Ana uygulama bileşeni
const App = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <SnackbarProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </SnackbarProvider>
    );
  }

  return (
    <SnackbarProvider>
      <SantiyeProvider>
        <DepoProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/personel" element={<PersonelListesi />} />
              <Route path="/personel-kayit" element={<PersonelKayit />} />
              <Route path="/personel/:id" element={<PersonelKayit />} />
              <Route path="/santiye" element={<Santiye />} />
              <Route path="/santiye/:id" element={<SantiyeDetay />} />
              <Route path="/puantaj" element={
                <PrivateRoute>
                  <Puantaj />
                </PrivateRoute>
              } />
              <Route path="/is-programi" element={<IsProgrami />} />
              <Route path="/depo" element={<DepoYonetimi />} />
              <Route path="/gunluk-rapor" element={<GunlukRapor />} />
              <Route path="/santiye/:santiyeId/blok/:blokId/eksiklikler" element={<EksiklikYonetimi />} />
              <Route path="/teslimat-ekip" element={<EksiklikYonetimi showTeslimatEkip={true} />} />
              <Route path="/mesajlar" element={<MesajlasmaSayfasi />} />
              <Route path="/sozlesme" element={<Sozlesme />} />
              <Route path="/hakedis" element={<Hakedis />} />
              <Route path="/hakedis/duzenle/:id" element={<HakedisForm />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        </DepoProvider>
      </SantiyeProvider>
    </SnackbarProvider>
  );
};

export default App;