import React, { createContext, useContext, useState, useEffect } from 'react';
import { binaService } from '../services/binaService';

const SantiyeContext = createContext();

export const SantiyeProvider = ({ children }) => {
  const [santiyeler, setSantiyeler] = useState([]);
  const [seciliSantiye, setSeciliSantiye] = useState(null);
  const [seciliBlok, setSeciliBlok] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Santiyeleri yükle
  useEffect(() => {
    const santiyeleriGetir = async () => {
      try {
        const data = await binaService.getSantiyeler();
        setSantiyeler(data);
      } catch (error) {
        console.error('Santiyeler yüklenirken hata:', error);
      } finally {
        setYukleniyor(false);
      }
    };

    santiyeleriGetir();
  }, []);

  const value = {
    santiyeler,
    setSantiyeler,
    seciliSantiye,
    setSeciliSantiye,
    seciliBlok,
    setSeciliBlok,
    yukleniyor
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