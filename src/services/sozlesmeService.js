import { db } from '../config/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

// Sözleşme oluşturma
export const createSozlesme = async (sozlesmeData) => {
  try {
    const docRef = await addDoc(collection(db, 'sozlesmeler'), sozlesmeData);
    return docRef.id;
  } catch (error) {
    console.error('Sözleşme oluşturulurken hata:', error);
    throw error;
  }
};

// Sözleşme güncelleme
export const updateSozlesme = async (id, sozlesmeData) => {
  try {
    const sozlesmeRef = doc(db, 'sozlesmeler', id);
    await updateDoc(sozlesmeRef, sozlesmeData);
  } catch (error) {
    console.error('Sözleşme güncellenirken hata:', error);
    throw error;
  }
};

// Sözleşme silme
export const deleteSozlesme = async (id) => {
  try {
    const sozlesmeRef = doc(db, 'sozlesmeler', id);
    await deleteDoc(sozlesmeRef);
  } catch (error) {
    console.error('Sözleşme silinirken hata:', error);
    throw error;
  }
};

// Tüm sözleşmeleri getirme
export const getSozlesmeler = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'sozlesmeler'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Sözleşmeler getirilirken hata:', error);
    throw error;
  }
};

// Tek bir sözleşmeyi getirme
export const getSozlesme = async (id) => {
  try {
    const sozlesmeRef = doc(db, 'sozlesmeler', id);
    const sozlesmeDoc = await getDoc(sozlesmeRef);
    if (sozlesmeDoc.exists()) {
      return {
        id: sozlesmeDoc.id,
        ...sozlesmeDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Sözleşme getirilirken hata:', error);
    throw error;
  }
};
