import { db } from '../lib/firebase/config';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { MASRAF_BEYAN_DURUMLARI } from '../types/masrafBeyan';

const COLLECTION_NAME = 'masrafBeyanlar';

export const masrafBeyanService = {
  /**
   * Yeni masraf beyanı oluştur
   */
  async create(masrafBeyan) {
    try {
      // Masraf tutarlarını sayıya çevir
      const masraflar = masrafBeyan.masraflar.map(m => ({
        ...m,
        tutar: parseFloat(m.tutar) || 0
      }));

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...masrafBeyan,
        masraflar,
        durumu: MASRAF_BEYAN_DURUMLARI.BEKLEMEDE,
        odendi: false,
        tarih: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Masraf beyanı oluşturulurken hata:', error);
      throw error;
    }
  },

  /**
   * Masraf beyanını güncelle
   */
  async update(id, masrafBeyan) {
    try {
      // Masraf tutarlarını sayıya çevir
      const masraflar = masrafBeyan.masraflar.map(m => ({
        ...m,
        tutar: parseFloat(m.tutar) || 0
      }));

      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...masrafBeyan,
        masraflar,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Masraf beyanı güncellenirken hata:', error);
      throw error;
    }
  },

  /**
   * Masraf beyanını sil
   */
  async delete(id) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Masraf beyanı silinirken hata:', error);
      throw error;
    }
  },

  /**
   * Reddedilen masraf beyanını sil
   */
  async deleteRejected(id) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Masraf beyanı bulunamadı');
      }

      const masrafBeyan = docSnap.data();
      if (masrafBeyan.durumu !== MASRAF_BEYAN_DURUMLARI.REDDEDILDI) {
        throw new Error('Sadece reddedilen masraf beyanları silinebilir');
      }

      await deleteDoc(docRef);
    } catch (error) {
      console.error('Reddedilen masraf beyanı silinirken hata:', error);
      throw error;
    }
  },

  /**
   * Masraf beyanını getir
   */
  async getById(id) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Masraf beyanı getirilirken hata:', error);
      throw error;
    }
  },

  /**
   * Kullanıcının masraf beyanlarını getir
   */
  async getByUserId(userId) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('olusturanId', '==', userId),
        orderBy('tarih', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Masraf beyanları getirilirken hata:', error);
      throw error;
    }
  },

  /**
   * Onay bekleyen masraf beyanlarını getir
   */
  async getOnayBekleyenler() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('durumu', '==', MASRAF_BEYAN_DURUMLARI.BEKLEMEDE),
        orderBy('tarih', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Onay bekleyen masraf beyanları getirilirken hata:', error);
      throw error;
    }
  },

  /**
   * Masraf beyanını onayla
   */
  async onayla(id, onaylayanId, onaylayanAdi) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        durumu: MASRAF_BEYAN_DURUMLARI.ONAYLANDI,
        onaylayanId,
        onaylayanAdi,
        onayTarihi: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Masraf beyanı onaylanırken hata:', error);
      throw error;
    }
  },

  /**
   * Masraf beyanını reddet
   */
  async reddet(id, onaylayanId, onaylayanAdi, redNedeni) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        durumu: MASRAF_BEYAN_DURUMLARI.REDDEDILDI,
        onaylayanId,
        onaylayanAdi,
        redNedeni,
        onayTarihi: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Masraf beyanı reddedilirken hata:', error);
      throw error;
    }
  },

  /**
   * Ödeme yap
   */
  async odemeYap(id, odeyenId, odeyenAdi, odemeAciklamasi) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        odendi: true,
        odeyenId,
        odeyenAdi,
        odemeAciklamasi,
        odemeTarihi: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Masraf beyanı ödemesi yapılırken hata:', error);
      throw error;
    }
  },

  /**
   * Onaylanmış ve ödenmemiş masraf beyanlarını getir
   */
  async getOdenmemisOnaylilar() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('durumu', '==', MASRAF_BEYAN_DURUMLARI.ONAYLANDI),
        where('odendi', '==', false),
        orderBy('onayTarihi', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Ödenmemiş onaylı masraf beyanları getirilirken hata:', error);
      throw error;
    }
  }
}; 