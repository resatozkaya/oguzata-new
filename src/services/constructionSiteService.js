import { db } from '../lib/firebase/config';
import { 
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';

const COLLECTION_NAME = 'santiyeler';

export const constructionSiteService = {
  // Tüm şantiyeleri getir
  async getAllConstructionSites() {
    try {
      console.log('Collection name:', COLLECTION_NAME); // Debug için
      const sitesRef = collection(db, COLLECTION_NAME);
      console.log('Collection reference:', sitesRef); // Debug için
      
      const querySnapshot = await getDocs(sitesRef);
      console.log('Query snapshot:', querySnapshot); // Debug için
      console.log('Number of documents:', querySnapshot.size); // Debug için

      querySnapshot.forEach((doc) => {
        console.log('Document data:', doc.id, doc.data()); // Her dökümanı kontrol et
      });

      const sites = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.ad || '', 
          address: data.adres || '',
          isActive: data.aktif ?? true,
          ...data
        };
      });

      console.log('Final sites array:', sites); // Debug için
      return sites;
    } catch (error) {
      console.error('Error getting construction sites:', error);
      throw error;
    }
  },

  // Aktif şantiyeleri getir
  async getActiveConstructionSites() {
    try {
      console.log('Getting active sites from collection:', COLLECTION_NAME); // Debug için
      const sitesRef = collection(db, COLLECTION_NAME);
      const q = query(sitesRef);  // Şimdilik filtreyi kaldıralım
      
      const querySnapshot = await getDocs(q);
      console.log('Active sites query snapshot size:', querySnapshot.size); // Debug için

      const sites = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Active site document:', doc.id, data); // Debug için
        return {
          id: doc.id,
          name: data.ad || '',
          address: data.adres || '',
          isActive: data.aktif ?? true,
          ...data
        };
      });

      console.log('Final active sites array:', sites); // Debug için
      return sites;
    } catch (error) {
      console.error('Error getting active construction sites:', error);
      throw error;
    }
  }
};
