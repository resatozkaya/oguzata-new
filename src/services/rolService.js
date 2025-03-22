import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const rolService = {
  yetkileriGetir: async (santiyeId, modul) => {
    try {
      const yetkilerRef = doc(db, `santiyeler/${santiyeId}/yetkiler/${modul.toLowerCase()}`);
      const yetkilerSnap = await getDoc(yetkilerRef);

      if (!yetkilerSnap.exists()) {
        // Varsayılan yetki yapısını oluştur
        const varsayilanYetkiler = {
          YÖNETİM: {
            eksiklik_view: true,
            eksiklik_create: true,
            eksiklik_update: true,
            eksiklik_delete: true,
            eksiklik_manage: true,
            eksiklik_view_all: true,
            eksiklik_bina_yapisi: true,
            eksiklik_blok_yonetimi: true
          },
          KULLANICI: {
            eksiklik_view: true,
            eksiklik_create: false,
            eksiklik_update: false,
            eksiklik_delete: false,
            eksiklik_manage: false,
            eksiklik_view_all: false,
            eksiklik_bina_yapisi: false,
            eksiklik_blok_yonetimi: false
          }
        };

        await setDoc(yetkilerRef, varsayilanYetkiler);
        return varsayilanYetkiler;
      }

      return yetkilerSnap.data();
    } catch (error) {
      console.error('Yetkiler getirilirken hata:', error);
      throw error;
    }
  },

  yetkiGuncelle: async (santiyeId, modul, rol, yetki, deger) => {
    try {
      const yetkilerRef = doc(db, `santiyeler/${santiyeId}/yetkiler/${modul.toLowerCase()}`);
      await updateDoc(yetkilerRef, {
        [`${rol}.${yetki}`]: deger
      });
    } catch (error) {
      console.error('Yetki güncellenirken hata:', error);
      throw error;
    }
  }
}; 