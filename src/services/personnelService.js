import { db } from '../config/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const COLLECTION_NAME = 'personeller';

class PersonnelService {
  // Tüm personeli getir
  async getAllPersonnel() {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Eski firma alanını firmaAdi'ye dönüştür
        if (data.firma && !data.firmaAdi) {
          data.firmaAdi = data.firma;
          delete data.firma;
        }
        // name/surname'i ad/soyad'a dönüştür
        if (data.name) {
          data.ad = data.name;
          delete data.name;
        }
        if (data.surname) {
          data.soyad = data.surname;
          delete data.surname;
        }
        return {
          id: doc.id,
          ...data
        };
      });
    } catch (error) {
      console.error('Error getting personnel:', error);
      throw error;
    }
  }

  // Tek bir personeli getir
  async getPersonnelById(id) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Veritabanından gelen ham veri:', data);
        
        // Tarih dönüşüm fonksiyonu
        const convertToDate = (dateValue) => {
          if (!dateValue) return null;
          // Eğer timestamp ise
          if (dateValue?.seconds) {
            return new Date(dateValue.seconds * 1000);
          }
          // Eğer ISO string ise
          if (typeof dateValue === 'string') {
            return new Date(dateValue);
          }
          // Eğer zaten Date objesi ise
          if (dateValue instanceof Date) {
            return dateValue;
          }
          return null;
        };

        // Eski alanları yeni alanlara dönüştür
        const personnel = {
          id: docSnap.id,
          ...data,
          // Kişisel Bilgiler
          ad: data.name || data.ad || '',
          soyad: data.surname || data.soyad || '',
          telefon: data.phone || data.telefon || '',
          adres: data.address || data.adres || '',
          email: data.email || data.eposta || '',
          firmaAdi: data.firma || data.firmaAdi || '',
          
          // İş Bilgileri
          departman: data.department || data.departman || '',
          calismaSekli: data.calisma_sekli || data.calismaSekli || '',
          santiye: data.santiye || data.constructionSite || '',
          maas: data.maas || data.salary || '',
          
          // Tarih Bilgileri
          dogumTarihi: convertToDate(data.dogumTarihi || data.birthDate),
          baslangicTarihi: convertToDate(data.baslangicTarihi || data.startDate),
          
          // Durum Bilgileri
          aktif: data.isActive ?? data.aktif ?? true,
          sigorta: data.sigorta ?? data.hasInsurance ?? true,
          
          // Acil Durum İletişim
          acilDurumKisi: {
            ad: data.acilDurumKisi?.ad || data.emergencyContact?.name || '',
            telefon: data.acilDurumKisi?.telefon || data.emergencyContact?.phone || '',
            yakinlik: data.acilDurumKisi?.yakinlik || data.emergencyContact?.relation || ''
          }
        };
        
        console.log('Dönüştürülmüş personel verisi:', personnel);
        return personnel;
      } else {
        throw new Error('Personnel not found');
      }
    } catch (error) {
      console.error('Error getting personnel by id:', error);
      throw error;
    }
  }

  // Yeni personel ekle
  async addPersonnel(data) {
    try {
      console.log('Kaydedilecek personel verisi:', data); 
      // Tarih alanlarını Firestore Timestamp'e dönüştür
      const newData = {
        ...data,
        dogumTarihi: data.dogumTarihi instanceof Date ? data.dogumTarihi : null,
        baslangicTarihi: data.baslangicTarihi instanceof Date ? data.baslangicTarihi : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      console.log('Firebase\'e kaydedilecek veri:', newData); 
      // Firma alanını firmaAdi olarak kaydet
      if (newData.firma) {
        newData.firmaAdi = newData.firma;
        delete newData.firma;
      }

      // name/surname'i ad/soyad'a dönüştür
      if (newData.name) {
        newData.ad = newData.name;
        delete newData.name;
      }
      if (newData.surname) {
        newData.soyad = newData.surname;
        delete newData.surname;
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), newData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding personnel:', error);
      throw error;
    }
  }

  // Personel güncelle
  async updatePersonnel(id, data) {
    try {
      // Tarih alanlarını Firestore Timestamp'e dönüştür
      const updatedData = {
        ...data,
        dogumTarihi: data.dogumTarihi instanceof Date ? data.dogumTarihi : null,
        baslangicTarihi: data.baslangicTarihi instanceof Date ? data.baslangicTarihi : null,
        updatedAt: new Date()
      };

      // Firma alanını firmaAdi olarak güncelle
      if (updatedData.firma) {
        updatedData.firmaAdi = updatedData.firma;
        delete updatedData.firma;
      }
      // name/surname'i ad/soyad'a dönüştür
      if (updatedData.name) {
        updatedData.ad = updatedData.name;
        delete updatedData.name;
      }
      if (updatedData.surname) {
        updatedData.soyad = updatedData.surname;
        delete updatedData.surname;
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, updatedData);
      return true;
    } catch (error) {
      console.error('Error updating personnel:', error);
      throw error;
    }
  }

  // Personel durumunu güncelle (aktif/pasif)
  async updatePersonnelStatus(id, newStatus) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        aktif: newStatus
      });
      return true;
    } catch (error) {
      console.error('Error updating personnel status:', error);
      throw error;
    }
  }

  // Personel sil
  async deletePersonnel(id) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting personnel:', error);
      throw error;
    }
  }

  // Aktif personeli getir
  async getActivePersonnel() {
    try {
      const q = query(collection(db, COLLECTION_NAME), where("aktif", "==", true));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting active personnel:', error);
      throw error;
    }
  }
}

export const personnelService = new PersonnelService();

// Tüm firma adlarını getir
export const getUniqueCompanyNames = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const companies = new Set();
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      // Hem eski (firma) hem de yeni (firmaAdi) alanları kontrol et
      const companyName = data.firma || data.firmaAdi;
      if (companyName) companies.add(companyName);
    });

    return Array.from(companies).sort();
  } catch (error) {
    console.error('Error getting company names:', error);
    throw error;
  }
};
