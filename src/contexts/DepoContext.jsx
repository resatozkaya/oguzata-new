import React, { createContext, useContext, useState, useEffect } from 'react';
import { depoService } from '../services/depoService';

const DepoContext = createContext();

export const DepoProvider = ({ children }) => {
  const [seciliSantiye, setSeciliSantiye] = useState(null);
  const [seciliDepo, setSeciliDepo] = useState(null);
  const [depolar, setDepolar] = useState([]);
  const [malzemeler, setMalzemeler] = useState([]);

  // Seçili şantiye değiştiğinde depoları yükle
  useEffect(() => {
    const depolariYukle = async () => {
      if (seciliSantiye?.id) {
        try {
          const depoListesi = await depoService.getDepolar(seciliSantiye.id);
          setDepolar(depoListesi);
          setSeciliDepo(null); // Şantiye değiştiğinde seçili depoyu sıfırla
        } catch (error) {
          console.error('Depolar yüklenirken hata:', error);
        }
      } else {
        setDepolar([]);
        setSeciliDepo(null);
      }
    };

    depolariYukle();
  }, [seciliSantiye]);

  // Seçili depo değiştiğinde malzemeleri yükle
  useEffect(() => {
    const malzemeleriYukle = async () => {
      if (seciliDepo?.id && seciliSantiye?.id) {
        try {
          const malzemeListesi = await depoService.getMalzemeler(seciliSantiye.id, seciliDepo.id);
          setMalzemeler(malzemeListesi);
        } catch (error) {
          console.error('Malzemeler yüklenirken hata:', error);
        }
      } else {
        setMalzemeler([]);
      }
    };

    malzemeleriYukle();
  }, [seciliDepo, seciliSantiye]);

  const yenileDepoVerileri = async () => {
    if (seciliDepo?.id) {
      try {
        const malzemeListesi = await depoService.getMalzemeler(seciliDepo.id);
        setMalzemeler(malzemeListesi);
      } catch (error) {
        console.error('Depo verileri yüklenirken hata:', error);
      }
    }
  };

  const value = {
    seciliSantiye,
    setSeciliSantiye,
    seciliDepo,
    setSeciliDepo,
    depolar,
    setDepolar,
    malzemeler,
    setMalzemeler,
    yenileDepoVerileri
  };

  return (
    <DepoContext.Provider value={value}>
      {children}
    </DepoContext.Provider>
  );
};

export const useDepo = () => useContext(DepoContext); 