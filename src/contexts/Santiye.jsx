import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/config/firebase';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const SantiyeContext = createContext();

export const useSantiye = () => {
  const context = useContext(SantiyeContext);
  if (!context) {
    throw new Error('useSantiye hook must be used within a SantiyeProvider');
  }
  return context;
};

export const SantiyeProvider = ({ children }) => {
  const [santiyeler, setSantiyeler] = useState([]);
  const [seciliSantiye, setSeciliSantiye] = useState(null);
  const [seciliBlok, setSeciliBlok] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Şantiyeleri getir
  useEffect(() => {
    const santiyeGetir = async () => {
      try {
        console.log('🏗️ Şantiyeler getiriliyor...');
        const santiyeRef = collection(db, 'santiyeler');
        const snapshot = await getDocs(santiyeRef);
        
        const santiyeListesi = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSantiyeler(santiyeListesi);
        console.log(`✅ ${santiyeListesi.length} şantiye başarıyla getirildi`);
      } catch (error) {
        console.error('❌ Şantiyeler getirilirken hata:', error);
      } finally {
        setYukleniyor(false);
      }
    };

    santiyeGetir();
  }, []);

  // Seçili şantiyeyi güncelle
  useEffect(() => {
    if (!seciliSantiye) {
      setSeciliBlok(null);
      return;
    }

    const santiyeDetayGetir = async () => {
      try {
        console.log(`🔍 Şantiye detayları getiriliyor - ID: ${seciliSantiye.id}`);
        const santiyeRef = doc(db, 'santiyeler', seciliSantiye.id);
        const snapshot = await getDoc(santiyeRef);

        if (snapshot.exists()) {
          const santiyeData = {
            id: snapshot.id,
            ...snapshot.data()
          };
          setSeciliSantiye(santiyeData);
          console.log('✅ Şantiye detayları başarıyla getirildi');
        }
      } catch (error) {
        console.error('❌ Şantiye detayları getirilirken hata:', error);
      }
    };

    santiyeDetayGetir();
  }, [seciliSantiye?.id]);

  // Blok ekle
  const addBlok = async (santiyeId, blokData) => {
    try {
      console.log('➕ Yeni blok ekleniyor:', blokData);
      
      const santiyeRef = doc(db, 'santiyeler', santiyeId);
      const snapshot = await getDoc(santiyeRef);
      
      if (!snapshot.exists()) {
        throw new Error('Şantiye bulunamadı');
      }

      const santiyeData = snapshot.data();
      const bloklar = santiyeData.bloklar || [];

      // Blok adının benzersiz olduğunu kontrol et
      if (bloklar.some(blok => blok.ad === blokData.ad)) {
        throw new Error('Bu blok adı zaten kullanılıyor');
      }

      // Yeni blok yapısını oluştur
      const yeniBlok = {
        ...blokData,
        olusturma_tarihi: new Date().toISOString(),
        katlar: Array.from({ length: blokData.katSayisi }, (_, i) => ({
          no: i,
          daireler: Array.from({ length: blokData.daireSayisi }, (_, j) => ({
            no: `${blokData.ad}${i}${j + 1}`,
            tip: 'DAIRE'
          }))
        }))
      };

      // Blokları güncelle
      await updateDoc(santiyeRef, {
        bloklar: [...bloklar, yeniBlok]
      });

      // Seçili şantiyeyi güncelle
      setSeciliSantiye(prev => ({
        ...prev,
        bloklar: [...(prev.bloklar || []), yeniBlok]
      }));

      console.log('✅ Blok başarıyla eklendi');
      return yeniBlok;
    } catch (error) {
      console.error('❌ Blok eklenirken hata:', error);
      throw error;
    }
  };

  const value = {
    santiyeler,
    seciliSantiye,
    setSeciliSantiye,
    seciliBlok,
    setSeciliBlok,
    yukleniyor,
    addBlok
  };

  return (
    <SantiyeContext.Provider value={value}>
      {children}
    </SantiyeContext.Provider>
  );
};
