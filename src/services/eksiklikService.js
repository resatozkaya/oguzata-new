import { db, storage } from '../lib/firebase/config';
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
  serverTimestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

const COLLECTION_NAME = 'eksiklikler';

export const eksiklikService = {
  // Eksiklikleri getir
  async getEksiklikler(santiyeId, blokId, filters = {}) {
    try {
      const eksikliklerRef = collection(db, `santiyeler/${santiyeId}/bloklar/${blokId}/eksiklikler`);
      let q = query(eksikliklerRef, orderBy('olusturmaTarihi', 'desc'));

      // Filtreleri uygula
      if (filters.durum) {
        q = query(q, where('durum', '==', filters.durum));
      }
      if (filters.oncelik) {
        q = query(q, where('oncelik', '==', filters.oncelik));
      }
      if (filters.kategori) {
        q = query(q, where('kategori', '==', filters.kategori));
      }
      if (filters.taseron) {
        q = query(q, where('taseron', '==', filters.taseron));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        olusturmaTarihi: doc.data().olusturmaTarihi?.toDate(),
        guncellenmeTarihi: doc.data().guncellenmeTarihi?.toDate()
      }));
    } catch (error) {
      console.error('Eksiklikler getirilirken hata:', error);
      throw error;
    }
  },

  // Eksiklik ekle
  async eksiklikEkle(santiyeId, blokId, eksiklikData) {
    try {
      const eksikliklerRef = collection(db, `santiyeler/${santiyeId}/bloklar/${blokId}/eksiklikler`);
      const docRef = await addDoc(eksikliklerRef, {
        ...eksiklikData,
        olusturmaTarihi: serverTimestamp(),
        guncellenmeTarihi: serverTimestamp()
      });

      // Daire eksiklik sayısını güncelle
      if (eksiklikData.daireNo) {
        await this.daireEksiklikSayisiGuncelle(santiyeId, blokId, eksiklikData.daireNo);
      }

      return docRef.id;
    } catch (error) {
      console.error('Eksiklik eklenirken hata:', error);
      throw error;
    }
  },

  // Eksiklik güncelle
  async eksiklikGuncelle(santiyeId, blokId, eksiklikId, eksiklikData) {
    try {
      const eksiklikRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}/eksiklikler/${eksiklikId}`);
      await updateDoc(eksiklikRef, {
        ...eksiklikData,
        guncellenmeTarihi: serverTimestamp()
      });

      // Daire eksiklik sayısını güncelle
      if (eksiklikData.daireNo) {
        await this.daireEksiklikSayisiGuncelle(santiyeId, blokId, eksiklikData.daireNo);
      }
    } catch (error) {
      console.error('Eksiklik güncellenirken hata:', error);
      throw error;
    }
  },

  // Eksiklik sil
  async eksiklikSil(santiyeId, blokId, eksiklikId) {
    try {
      // Önce eksikliğin fotoğraflarını sil
      const eksiklikRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}/eksiklikler/${eksiklikId}`);
      const eksiklikDoc = await getDoc(eksiklikRef);
      
      if (eksiklikDoc.exists()) {
        const eksiklik = eksiklikDoc.data();
        if (eksiklik.fotograflar?.length > 0) {
          for (const foto of eksiklik.fotograflar) {
            await this.fotografSil(foto);
          }
        }
      }

      // Eksikliği sil
      await deleteDoc(eksiklikRef);

      // Daire eksiklik sayısını güncelle
      if (eksiklikDoc.exists() && eksiklikDoc.data().daireNo) {
        await this.daireEksiklikSayisiGuncelle(santiyeId, blokId, eksiklikDoc.data().daireNo);
      }
    } catch (error) {
      console.error('Eksiklik silinirken hata:', error);
      throw error;
    }
  },

  // Fotoğraf yükle
  async fotografYukle(file) {
    try {
      const dosyaAdi = `eksiklik-fotograflari/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, dosyaAdi);
      
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Fotoğraf yüklenirken hata:', error);
      throw error;
    }
  },

  // Fotoğraf sil
  async fotografSil(url) {
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Fotoğraf silinirken hata:', error);
      throw error;
    }
  },

  // Daire eksiklik sayısını güncelle
  async daireEksiklikSayisiGuncelle(santiyeId, blokId, daireNo) {
    try {
      const eksikliklerRef = collection(db, `santiyeler/${santiyeId}/bloklar/${blokId}/eksiklikler`);
      const q = query(eksikliklerRef, where('daireNo', '==', daireNo));
      const snapshot = await getDocs(q);

      const istatistikler = {
        toplamEksiklik: snapshot.size,
        yeniEksiklik: 0,
        tamamlanan: 0,
        devamEden: 0
      };

      snapshot.forEach(doc => {
        const eksiklik = doc.data();
        if (eksiklik.durum === 'Yeni') istatistikler.yeniEksiklik++;
        else if (eksiklik.durum === 'Tamamlandı') istatistikler.tamamlanan++;
        else if (eksiklik.durum === 'Devam Ediyor') istatistikler.devamEden++;
      });

      // Daire bilgilerini güncelle
      const daireRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}/daireler/${daireNo}`);
      await updateDoc(daireRef, { eksiklikIstatistikleri: istatistikler });
    } catch (error) {
      console.error('Daire eksiklik sayısı güncellenirken hata:', error);
      throw error;
    }
  }
};
