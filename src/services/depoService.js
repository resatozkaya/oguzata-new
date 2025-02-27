import { db, storage } from '../lib/firebase/config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

class DepoService {
  // Şantiyeye ait depoları getir
  async getDepolar(santiyeId) {
    try {
      const depolarRef = collection(db, `santiyeler/${santiyeId}/depolar`);
      const snapshot = await getDocs(depolarRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Depolar alınırken hata:', error);
      throw error;
    }
  }

  // Depoya ait malzemeleri getir
  async getMalzemeler(santiyeId, depoId) {
    try {
      const malzemelerRef = collection(db, `santiyeler/${santiyeId}/depolar/${depoId}/malzemeler`);
      const snapshot = await getDocs(malzemelerRef);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Tarih alanlarını Date objesine çevir
          tarih: data.tarih?.toDate(),
          olusturmaTarihi: data.olusturmaTarihi?.toDate(),
          guncellemeTarihi: data.guncellemeTarihi?.toDate()
        };
      });
    } catch (error) {
      console.error('Malzemeler alınırken hata:', error);
      throw error;
    }
  }

  // Malzeme ekle
  async malzemeEkle(santiyeId, depoId, malzeme) {
    try {
      const malzemelerRef = collection(db, `santiyeler/${santiyeId}/depolar/${depoId}/malzemeler`);
      
      // Base64 resmi doğrudan Firestore'a kaydet
      const docRef = await addDoc(malzemelerRef, {
        ...malzeme,
        resimUrl: malzeme.resim, // base64 string olarak kaydet
        tarih: serverTimestamp(),
        olusturmaTarihi: serverTimestamp(),
        guncellemeTarihi: serverTimestamp()
      });

      return {
        id: docRef.id,
        ...malzeme,
        resimUrl: malzeme.resim
      };
    } catch (error) {
      console.error('Malzeme eklenirken hata:', error);
      throw error;
    }
  }

  // Resim yükleme fonksiyonu
  async resimYukle(base64String) {
    try {
      // Base64'ü Blob'a çevir
      const response = await fetch(base64String);
      const blob = await response.blob();

      // Storage'a yükle
      const dosyaAdi = `malzeme-resimleri/${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const storageRef = ref(storage, dosyaAdi);
      
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      return { url, path: dosyaAdi };
    } catch (error) {
      console.error('Resim yüklenirken hata:', error);
      throw error;
    }
  }

  // Yeni depo ekle
  async depoEkle(santiyeId, depo) {
    try {
      const depolarRef = collection(db, `santiyeler/${santiyeId}/depolar`);
      const docRef = await addDoc(depolarRef, {
        ...depo,
        olusturmaTarihi: serverTimestamp(),
        guncellemeTarihi: serverTimestamp()
      });
      return { id: docRef.id, ...depo };
    } catch (error) {
      console.error('Depo eklenirken hata:', error);
      throw error;
    }
  }

  // Depo güncelle
  async depoGuncelle(depoId, yeniVeriler) {
    try {
      const depoRef = doc(db, `depolar/${depoId}`);
      await updateDoc(depoRef, {
        ...yeniVeriler,
        guncellemeTarihi: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Depo güncellenirken hata:', error);
      throw error;
    }
  }

  // Depo sil
  async depoSil(santiyeId, depoId) {
    try {
      console.log('Depo silme parametreleri:', { santiyeId, depoId });
      
      // Depoyu sil
      const depoRef = doc(db, `santiyeler/${santiyeId}/depolar/${depoId}`);
      await deleteDoc(depoRef);
      
      return true;
    } catch (error) {
      console.error('Depo silinirken hata:', error);
      throw error;
    }
  }

  // Malzeme güncelle
  async malzemeGuncelle(santiyeId, depoId, malzemeId, yeniVeriler) {
    try {
      const malzemeRef = doc(
        db, 
        `santiyeler/${santiyeId}/depolar/${depoId}/malzemeler/${malzemeId}`
      );

      const guncellenecekVeri = {
        ...yeniVeriler,
        miktar: Number(yeniVeriler.miktar),
        guncellemeTarihi: serverTimestamp()
      };

      // Undefined olan alanları temizle
      Object.keys(guncellenecekVeri).forEach(key => 
        guncellenecekVeri[key] === undefined && delete guncellenecekVeri[key]
      );

      await updateDoc(malzemeRef, guncellenecekVeri);

      return {
        id: malzemeId,
        ...guncellenecekVeri,
        guncellemeTarihi: new Date()
      };
    } catch (error) {
      console.error('Malzeme güncellenirken hata:', error);
      throw error;
    }
  }

  // Malzeme sil
  async malzemeSil(santiyeId, depoId, malzemeId) {
    try {
      const malzemeRef = doc(db, `santiyeler/${santiyeId}/depolar/${depoId}/malzemeler/${malzemeId}`);
      await deleteDoc(malzemeRef);
      return true;
    } catch (error) {
      console.error('Malzeme silinirken hata:', error);
      throw error;
    }
  }

  // Malzeme işlem geçmişini getir
  async getMalzemeIslemler(santiyeId, depoId, malzemeId) {
    try {
      const islemlerRef = collection(
        db, 
        `santiyeler/${santiyeId}/depolar/${depoId}/malzemeler/${malzemeId}/islemler`
      );
      const snapshot = await getDocs(islemlerRef);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          tarih: data.tarih?.toDate(),
          olusturmaTarihi: data.olusturmaTarihi?.toDate()
        };
      });
    } catch (error) {
      console.error('İşlem geçmişi alınırken hata:', error);
      throw error;
    }
  }

  // Malzeme işlemi ekle
  async malzemeIslemEkle(santiyeId, depoId, malzemeId, islem) {
    try {
      const islemlerRef = collection(
        db, 
        `santiyeler/${santiyeId}/depolar/${depoId}/malzemeler/${malzemeId}/islemler`
      );
      
      const islemData = {
        ...islem,
        miktar: Number(islem.miktar),
        tarih: serverTimestamp(),
        olusturmaTarihi: serverTimestamp()
      };

      const docRef = await addDoc(islemlerRef, islemData);
      
      return { 
        id: docRef.id, 
        ...islemData,
        tarih: new Date(),
        olusturmaTarihi: new Date()
      };
    } catch (error) {
      console.error('İşlem eklenirken hata:', error);
      throw error;
    }
  }

  // İşlem güncelleme
  async islemGuncelle(santiyeId, depoId, malzemeId, islemId, yeniIslem) {
    try {
      console.log('İşlem güncelleme parametreleri:', {
        santiyeId,
        depoId,
        malzemeId,
        islemId,
        yeniIslem
      });

      const islemRef = doc(
        db, 
        `santiyeler/${santiyeId}/depolar/${depoId}/malzemeler/${malzemeId}/islemler/${islemId}`
      );

      const guncellenecekVeri = {
        miktar: Number(yeniIslem.miktar),
        islemTuru: yeniIslem.islemTuru,
        aciklama: yeniIslem.aciklama || '',
        guncellemeTarihi: serverTimestamp()
      };

      console.log('Güncellenecek veri:', guncellenecekVeri);

      await updateDoc(islemRef, guncellenecekVeri);

      return true;
    } catch (error) {
      console.error('İşlem güncellenirken hata detayı:', {
        hata: error.message,
        kod: error.code,
        stack: error.stack
      });
      throw error;
    }
  }

  // Malzeme miktarı güncelleme
  async malzemeMiktarGuncelle(santiyeId, depoId, malzemeId, miktarFarki) {
    try {
      const malzemeRef = doc(
        db, 
        `santiyeler/${santiyeId}/depolar/${depoId}/malzemeler/${malzemeId}`
      );

      await updateDoc(malzemeRef, {
        miktar: increment(miktarFarki)
      });

      return true;
    } catch (error) {
      console.error('Malzeme miktarı güncellenirken hata:', error);
      throw error;
    }
  }

  // İşlem silme
  async islemSil(santiyeId, depoId, malzemeId, islemId) {
    try {
      const islemRef = doc(
        db, 
        `santiyeler/${santiyeId}/depolar/${depoId}/malzemeler/${malzemeId}/islemler/${islemId}`
      );

      await deleteDoc(islemRef);
      return true;
    } catch (error) {
      console.error('İşlem silinirken hata:', error);
      throw error;
    }
  }
}

export const depoService = new DepoService(); 