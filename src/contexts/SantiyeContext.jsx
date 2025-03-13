import React, { createContext, useContext, useState, useEffect } from 'react';
import { binaService } from '../services/binaService';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const SantiyeContext = createContext();

export const SantiyeProvider = ({ children }) => {
  const [santiyeler, setSantiyeler] = useState([]);
  const [seciliSantiye, setSeciliSantiye] = useState(null);
  const [seciliBlok, setSeciliBlok] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Santiyeleri yükle
  useEffect(() => {
    const santiyeleriGetir = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const data = await binaService.getSantiyeler();
        setSantiyeler(data);
      } catch (error) {
        console.error('Santiyeler yüklenirken hata:', error);
        if (error.code === 'permission-denied') {
          navigate('/login');
        }
      } finally {
        setYukleniyor(false);
      }
    };

    santiyeleriGetir();
  }, [currentUser, navigate]);

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