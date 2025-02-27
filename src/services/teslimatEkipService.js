import { db } from '../lib/firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';

const teslimatEkipService = {
  async ekipEkle(santiyeId, ekipData) {
    try {
      const docRef = await addDoc(
        collection(db, 'santiyeler', santiyeId, 'teslimatEkipleri'),
        {
          ...ekipData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      );
      return { id: docRef.id, ...ekipData };
    } catch (error) {
      console.error('Ekip eklenirken hata:', error);
      throw error;
    }
  },

  async ekipleriGetir(santiyeId) {
    try {
      const querySnapshot = await getDocs(
        collection(db, 'santiyeler', santiyeId, 'teslimatEkipleri')
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Ekipler getirilirken hata:', error);
      throw error;
    }
  }
};

export default teslimatEkipService; 