import { db } from '../config/firebase';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export const santiyeService = {
  // Tüm şantiyeleri getir
  santiyeleriGetir: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'santiyeler'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Şantiyeler getirilirken hata:', error);
      throw error;
    }
  },

  // Şantiye detayını getir
  santiyeDetayGetir: async (santiyeId) => {
    try {
      const docRef = doc(db, 'santiyeler', santiyeId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Şantiye bulunamadı');
      }
    } catch (error) {
      console.error('Şantiye detayı getirilirken hata:', error);
      throw error;
    }
  },

  // Yeni şantiye ekle
  santiyeEkle: async (santiyeData) => {
    try {
      const docRef = await addDoc(collection(db, 'santiyeler'), {
        ...santiyeData,
        olusturmaTarihi: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Şantiye eklenirken hata:', error);
      throw error;
    }
  },

  // Şantiye güncelle
  santiyeGuncelle: async (santiyeId, santiyeData) => {
    try {
      const docRef = doc(db, 'santiyeler', santiyeId);
      await updateDoc(docRef, {
        ...santiyeData,
        guncellenmeTarihi: new Date().toISOString()
      });
    } catch (error) {
      console.error('Şantiye güncellenirken hata:', error);
      throw error;
    }
  },

  // Şantiye sil
  santiyeSil: async (santiyeId) => {
    try {
      const docRef = doc(db, 'santiyeler', santiyeId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Şantiye silinirken hata:', error);
      throw error;
    }
  }
};
