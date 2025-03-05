import { db } from '../config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';

class TaseronService {
  constructor() {
    this.collectionPath = 'personel';
  }

  // Aktif taşeronları getir
  async taseronlariGetir() {
    try {
      console.log('👷 Taşeronlar getiriliyor');

      const personelRef = collection(db, this.collectionPath);
      const q = query(
        personelRef,
        where('tip', '==', 'TASERON'),
        where('aktif', '==', true)
      );
      
      const snapshot = await getDocs(q);
      
      // Firma bazında grupla
      const firmaGruplari = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.firma?.trim()) {
          // Normalize firma adı (boşlukları alt tire ile değiştir)
          const normalizedFirma = data.firma.trim().replace(/\s+/g, '_').toUpperCase();
          if (!firmaGruplari[normalizedFirma]) {
            firmaGruplari[normalizedFirma] = {
              id: normalizedFirma,  // ID olarak normalize edilmiş adı kullan
              ad: normalizedFirma,  // Gösterim için de normalize edilmiş adı kullan
              personeller: []
            };
          }
          firmaGruplari[normalizedFirma].personeller.push({
            id: doc.id,
            ...data
          });
        }
      });

      const taseronlar = Object.values(firmaGruplari);
      console.log(`✅ ${taseronlar.length} taşeron firma başarıyla getirildi`);
      return taseronlar;

    } catch (error) {
      console.error('❌ Taşeronlar getirilirken hata:', error);
      throw error;
    }
  }

  // Yeni taşeron ekle
  async taseronEkle(taseronData) {
    try {
      console.log('➕ Yeni taşeron ekleniyor:', taseronData);

      const yeniTaseron = {
        ...taseronData,
        tip: 'TASERON',
        aktif: true,
        olusturma_tarihi: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collectionPath), yeniTaseron);
      console.log('✅ Taşeron başarıyla eklendi');
      
      return {
        id: docRef.id,
        ...yeniTaseron
      };
    } catch (error) {
      console.error('❌ Taşeron eklenirken hata:', error);
      throw error;
    }
  }

  // Taşeron güncelle
  async taseronGuncelle(taseronId, yeniVeriler) {
    try {
      console.log(`✏️ Taşeron güncelleniyor - ID: ${taseronId}`);
      console.log('Yeni veriler:', yeniVeriler);

      const taseronRef = doc(db, this.collectionPath, taseronId);
      await updateDoc(taseronRef, {
        ...yeniVeriler,
        guncelleme_tarihi: serverTimestamp()
      });

      console.log('✅ Taşeron başarıyla güncellendi');
      return true;
    } catch (error) {
      console.error('❌ Taşeron güncellenirken hata:', error);
      throw error;
    }
  }

  // Taşeron sil (soft delete)
  async taseronSil(taseronId) {
    try {
      console.log(`🗑️ Taşeron siliniyor - ID: ${taseronId}`);

      const taseronRef = doc(db, this.collectionPath, taseronId);
      await updateDoc(taseronRef, {
        aktif: false,
        silme_tarihi: serverTimestamp()
      });

      console.log('✅ Taşeron başarıyla silindi (soft delete)');
      return true;
    } catch (error) {
      console.error('❌ Taşeron silinirken hata:', error);
      throw error;
    }
  }

  // Taşeron detaylarını getir
  async taseronDetayGetir(taseronId) {
    try {
      console.log(`🔍 Taşeron detayları getiriliyor - ID: ${taseronId}`);

      const taseronRef = doc(db, this.collectionPath, taseronId);
      const snapshot = await getDocs(taseronRef);

      if (!snapshot.exists()) {
        console.log('⚠️ Taşeron bulunamadı');
        return null;
      }

      const taseronData = {
        id: snapshot.id,
        ...snapshot.data()
      };

      console.log('✅ Taşeron detayları başarıyla getirildi');
      return taseronData;
    } catch (error) {
      console.error('❌ Taşeron detayları getirilirken hata:', error);
      throw error;
    }
  }
}

export const taseronService = new TaseronService();
