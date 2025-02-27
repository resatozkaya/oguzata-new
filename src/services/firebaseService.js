import { db } from '../lib/firebase/config';
import { binaService } from './binaService';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  getDoc,
  setDoc
} from 'firebase/firestore';

const firebaseService = {
  async addBlokToSantiye(santiyeId, yeniBlok) {
    try {
      const blokRef = doc(db, `santiyeler/${santiyeId}/bloklar/${yeniBlok.ad}`);
      
      // Önce temel blok bilgilerini kaydet
      await setDoc(blokRef, {
        ad: yeniBlok.ad,
        kod: yeniBlok.ad,
        katSayisi: yeniBlok.katSayisi || 8,
        daireSayisi: yeniBlok.daireSayisi || 4,
        durum: 'aktif',
        guncellemeTarihi: serverTimestamp()
      });

      // Bina yapısını oluştur
      return await binaService.blokYapisiOlustur(santiyeId, yeniBlok.ad, yeniBlok.katSayisi);
    } catch (error) {
      console.error('Blok eklenemedi:', error);
      throw error;
    }
  },
};

export default firebaseService; 