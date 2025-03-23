import React, { createContext, useContext, useState, useEffect } from 'react';
import { binaService } from '../services/binaService';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const SantiyeContext = createContext();

export const SantiyeProvider = ({ children }) => {
  const [santiyeler, setSantiyeler] = useState([]);
  const [seciliSantiye, setSeciliSantiye] = useState(null);
  const [seciliBlok, setSeciliBlok] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Santiyeleri yükle
  useEffect(() => {
    const santiyeleriGetir = async () => {
      if (!currentUser) {
        setYukleniyor(false);
        return;
      }

      try {
        setYukleniyor(true);
        const data = await binaService.getSantiyeler();
        setSantiyeler(data);

        // URL'den santiye ve blok ID'lerini al
        const santiyeMatch = location.pathname.match(/\/santiye\/([^\/]+)/);
        const blokMatch = location.pathname.match(/\/blok\/([^\/]+)/);

        if (santiyeMatch && data.length > 0) {
          const santiyeId = santiyeMatch[1];
          const santiye = data.find(s => s.id === santiyeId);
          if (santiye) {
            setSeciliSantiye(santiye);

            if (blokMatch && santiye.bloklar) {
              const blokId = blokMatch[1];
              const blok = santiye.bloklar.find(b => b.id === blokId);
              if (blok) {
                setSeciliBlok(blok);
              }
            }
          }
        }
      } catch (error) {
        console.error('Santiyeler yüklenirken hata:', error);
      } finally {
        setYukleniyor(false);
      }
    };

    santiyeleriGetir();
  }, [currentUser, location.pathname]);

  // Verileri yenileme fonksiyonu
  const yenileVerileri = async () => {
    try {
      setYukleniyor(true);
      const data = await binaService.getSantiyeler();
      setSantiyeler(data);

      // Seçili santiye ve bloğu güncelle
      if (seciliSantiye) {
        const guncelSantiye = data.find(s => s.id === seciliSantiye.id);
        if (guncelSantiye) {
          setSeciliSantiye(guncelSantiye);
          if (seciliBlok) {
            const guncelBlok = guncelSantiye.bloklar?.find(b => b.id === seciliBlok.id);
            if (guncelBlok) {
              setSeciliBlok({...guncelBlok}); // Zorla yeni referans oluştur
            }
          }
        }
      }
    } catch (error) {
      console.error('Veriler yenilenirken hata:', error);
    } finally {
      setYukleniyor(false);
    }
  };

  const value = {
    santiyeler,
    setSantiyeler,
    seciliSantiye,
    setSeciliSantiye,
    seciliBlok,
    setSeciliBlok,
    yukleniyor,
    yenileVerileri
  };

  return (
    <SantiyeContext.Provider value={value}>
      {children}
    </SantiyeContext.Provider>
  );
};

export const useSantiye = () => {
  const context = useContext(SantiyeContext);
  if (!context) {
    throw new Error('useSantiye hook\'u SantiyeProvider içinde kullanılmalıdır');
  }
  return context;
};