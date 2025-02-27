import { db } from '../config/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const COLLECTION_NAME = 'santiyeler';

export const constructionService = {
  // Tüm şantiyeleri getir
  async getAll() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting constructions:', error);
      throw error;
    }
  },

  // Aktif şantiyeleri getir
  async getActive() {
    try {
      // Aktif filtresi olmadan tüm şantiyeleri getir (eski veriler için)
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting active constructions:', error);
      throw error;
    }
  },

  // Şantiye istatistiklerini getir
  async getStats() {
    try {
      const stats = {
        aktifSantiye: 0,
        toplamGorev: 0,
        kritikMalzeme: 0,
        ortalamaIlerleme: 0
      };

      // Tüm şantiyeleri getir
      const santiyeler = await this.getAll();
      stats.aktifSantiye = santiyeler.length;

      // Toplam görev ve ortalama ilerleme hesapla
      let toplamIlerleme = 0;
      santiyeler.forEach(santiye => {
        if (santiye.gorevler) {
          stats.toplamGorev += Array.isArray(santiye.gorevler) ? santiye.gorevler.length : 0;
        }
        if (santiye.ilerleme) {
          toplamIlerleme += parseFloat(santiye.ilerleme) || 0;
        }
      });

      // Ortalama ilerleme hesapla
      stats.ortalamaIlerleme = santiyeler.length > 0 
        ? Math.round(toplamIlerleme / santiyeler.length) 
        : 0;

      // Şimdilik kritik malzeme sayısını 0 olarak bırakalım
      stats.kritikMalzeme = 0;

      return stats;
    } catch (error) {
      console.error('Error getting construction stats:', error);
      throw error;
    }
  }
};
