import { db } from '../lib/firebase/config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

class BinaService {
  // Geçici değişiklikleri tutmak için private map
  #geciciDegisiklikler = new Map();

  // Bina yapısını getir
  async getBlokBilgileri(santiyeId, blokId) {
    try {
      const blokRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}`);
      const blokDoc = await getDoc(blokRef);
      
      if (!blokDoc.exists()) return null;

      const blokData = blokDoc.data();
      
      // Eksiklikleri getir ve dairelerle eşleştir
      const eksikliklerRef = collection(db, `santiyeler/${santiyeId}/bloklar/${blokId}/eksiklikler`);
      const eksikliklerSnap = await getDocs(eksikliklerRef);
      
      const eksiklikler = {};
      eksikliklerSnap.docs.forEach(doc => {
        const eksiklik = doc.data();
        if (!eksiklikler[eksiklik.daireNo]) {
          eksiklikler[eksiklik.daireNo] = [];
        }
        eksiklikler[eksiklik.daireNo].push({ id: doc.id, ...eksiklik });
      });

      // Dairelere eksiklikleri ekle
      const katlar = blokData.katlar.map(kat => ({
        ...kat,
        daireler: kat.daireler?.map(daire => ({
          ...daire,
          eksiklikler: eksiklikler[daire.no] || []
        }))
      }));

      return {
        bloklar: [{
          ...blokData,
          katlar
        }]
      };
    } catch (error) {
      console.error('Blok bilgileri alınırken hata:', error);
      throw error;
    }
  }

  // Blok listesini getir
  async getBloklar(santiyeId) {
    try {
      const bloklarRef = collection(db, `santiyeler/${santiyeId}/bloklar`);
      const snapshot = await getDocs(bloklarRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Bloklar alınırken hata:', error);
      throw error;
    }
  }

  // Kat bilgilerini getir
  async getKatBilgileri(santiyeId, blokId, katNo) {
    try {
      const katDoc = await getDoc(
        doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}/katlar/${katNo}`)
      );
      return katDoc.exists() ? { id: katDoc.id, ...katDoc.data() } : null;
    } catch (error) {
      console.error('Kat bilgileri alınırken hata:', error);
      throw error;
    }
  }

  // Daire bilgilerini getir
  async getDaireBilgileri(santiyeId, blokId, katNo, daireNo) {
    try {
      const daireDoc = await getDoc(
        doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}/katlar/${katNo}/daireler/${daireNo}`)
      );
      return daireDoc.exists() ? { id: daireDoc.id, ...daireDoc.data() } : null;
    } catch (error) {
      console.error('Daire bilgileri alınırken hata:', error);
      throw error;
    }
  }

  // Blok adını güncelle
  async blokGuncelle(santiyeId, blokId, yeniAd) {
    try {
      const batch = writeBatch(db);
      
      // Eski blok dokümanını al
      const eskiBlokRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}`);
      const eskiBlokDoc = await getDoc(eskiBlokRef);
      
      if (!eskiBlokDoc.exists()) {
        throw new Error('Blok bulunamadı');
      }

      // Eski blok verilerini al
      const eskiBlokData = eskiBlokDoc.data();

      // Sadece ad ve kod güncellemesi yap, diğer verileri koru
      await updateDoc(eskiBlokRef, {
        ad: yeniAd,
        kod: yeniAd,
        guncellemeTarihi: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Blok güncellenirken hata:', error);
      throw error;
    }
  }

  // Blok sil
  async blokSil(santiyeId, blokId) {
    const response = await fetch(`/api/santiye/${santiyeId}/blok/${blokId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Blok silinemedi');
    return response.json();
  }

  // Şantiyeleri getir
  async getSantiyeler() {
    try {
      const santiyelerRef = collection(db, 'santiyeler');
      const snapshot = await getDocs(santiyelerRef);
      
      const santiyeler = [];
      for (const doc of snapshot.docs) {
        const santiye = { id: doc.id, ...doc.data() };
        
        // Her şantiyenin bloklarını getir
        const bloklarRef = collection(db, `santiyeler/${doc.id}/bloklar`);
        const bloklarSnapshot = await getDocs(bloklarRef);
        
        santiye.bloklar = bloklarSnapshot.docs.map(blokDoc => ({
          id: blokDoc.id,
          ...blokDoc.data()
        }));
        
        santiyeler.push(santiye);
      }
      
      return santiyeler;
    } catch (error) {
      console.error('Şantiyeler getirilirken hata:', error);
      throw error;
    }
  }

  // Kat ekle
  async katEkle(santiyeId, blokId, katTipi = 'NORMAL') {
    try {
      const blokRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}`);
      const blokDoc = await getDoc(blokRef);
      
      if (!blokDoc.exists()) return null;
      
      const blokData = blokDoc.data();
      const katlar = blokData.katlar || [];

      // Kat numarasını belirle
      let yeniKatNo;
      const normalKatlar = katlar.filter(k => !k.no.toString().startsWith('B') && k.no !== '0');
      const bodrumKatlar = katlar.filter(k => k.no.toString().startsWith('B'));
      const zeminKatVar = katlar.some(k => k.no === '0');

      switch (katTipi) {
        case 'BODRUM':
          yeniKatNo = `B${bodrumKatlar.length + 1}`;
          break;
        case 'ZEMIN':
          if (zeminKatVar) return null;
          yeniKatNo = '0';
          break;
        case 'NORMAL':
          yeniKatNo = (normalKatlar.length > 0 
            ? Math.max(...normalKatlar.map(k => parseInt(k.no))) + 1 
            : 1).toString();
          break;
        default:
          return null;
      }

      // Yeni katı ekle
      const yeniKat = {
        no: yeniKatNo,
        tip: katTipi,
        daireler: []
      };

      katlar.push(yeniKat);

      // Katları sırala
      katlar.sort((a, b) => {
        const getKatNo = (no) => {
          if (typeof no === 'string' && no.startsWith('B')) return -parseInt(no.slice(1));
          if (no === '0') return 0;
          return parseInt(no);
        };
        return getKatNo(b.no) - getKatNo(a.no);
      });

      // Güncelle
      await updateDoc(blokRef, { katlar });
      return await this.getBlokBilgileri(santiyeId, blokId);
    } catch (error) {
      console.error('Kat eklenirken hata:', error);
      throw error;
    }
  }

  // Kat sil
  async katSil(santiyeId, blokId, katNo) {
    try {
      const blokRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}`);
      const blokDoc = await getDoc(blokRef);
      
      if (!blokDoc.exists()) return null;
      
      const blokData = blokDoc.data();
      const katlar = blokData.katlar.filter(k => k.no !== katNo);

      await updateDoc(blokRef, { katlar });
      return await this.getBlokBilgileri(santiyeId, blokId);
    } catch (error) {
      console.error('Kat silinirken hata:', error);
      throw error;
    }
  }

  // Daire ekle
  async daireEkle(santiyeId, blokId, katNo) {
    try {
      const blokRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}`);
      const blokDoc = await getDoc(blokRef);
      
      if (!blokDoc.exists()) return null;
      
      const blokData = blokDoc.data();
      const katlar = [...blokData.katlar];
      const katIndex = katlar.findIndex(k => k.no === katNo);
      
      if (katIndex === -1) return null;

      if (!katlar[katIndex].daireler) {
        katlar[katIndex].daireler = [];
      }

      const daireIndex = katlar[katIndex].daireler.length + 1;
      const yeniDaireNo = `${blokId}${katNo}${daireIndex}`;

      katlar[katIndex].daireler.push({
        no: yeniDaireNo,
        tip: 'DAIRE'
      });

      await updateDoc(blokRef, { katlar });
      return await this.getBlokBilgileri(santiyeId, blokId);
    } catch (error) {
      console.error('Daire eklenirken hata:', error);
      throw error;
    }
  }

  // Daire sil
  async daireSil(santiyeId, blokId, katNo, daireIndex) {
    try {
      const blokRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}`);
      const blokDoc = await getDoc(blokRef);
      
      if (!blokDoc.exists()) return null;
      
      const blokData = blokDoc.data();
      const katlar = [...blokData.katlar];
      const katIndex = katlar.findIndex(k => k.no === katNo);
      
      if (katIndex === -1) return null;

      katlar[katIndex].daireler = katlar[katIndex].daireler.filter((_, index) => index !== daireIndex);

      await updateDoc(blokRef, { katlar });
      return await this.getBlokBilgileri(santiyeId, blokId);
    } catch (error) {
      console.error('Daire silinirken hata:', error);
      throw error;
    }
  }

  // Blok ekle/güncelle
  async blokKaydet(santiyeId, blokId, blokData) {
    try {
      const blokRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}`);
      await setDoc(blokRef, {
        ...blokData,
        guncellenmeTarihi: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Blok kaydedilirken hata:', error);
      throw error;
    }
  }

  // Blok istatistiklerini getir
  async getBlokIstatistikleri(santiyeId, blokId) {
    try {
      const eksikliklerRef = collection(
        db, 
        `santiyeler/${santiyeId}/bloklar/${blokId}/eksiklikler`
      );
      const eksiklikQuery = query(eksikliklerRef);
      const eksiklikSnapshot = await getDocs(eksiklikQuery);

      const istatistikler = {
        toplamEksiklik: eksiklikSnapshot.size,
        yeniEksiklik: 0,
        tamamlanan: 0,
        devamEden: 0
      };

      eksiklikSnapshot.forEach(doc => {
        const eksiklik = doc.data();
        if (eksiklik.durum === 'Yeni') istatistikler.yeniEksiklik++;
        else if (eksiklik.durum === 'Tamamlandı') istatistikler.tamamlanan++;
        else if (eksiklik.durum === 'Devam Ediyor') istatistikler.devamEden++;
      });

      return istatistikler;
    } catch (error) {
      console.error('Blok istatistikleri alınırken hata:', error);
      throw error;
    }
  }

  // Mevcut bina yapısını temizle
  async temizleBinaYapisi(santiyeId, blokId) {
    try {
      // Mevcut katları ve daireleri sil
      const katlarRef = collection(db, `santiyeler/${santiyeId}/bloklar/${blokId}/katlar`);
      const katlarSnapshot = await getDocs(katlarRef);
      
      for (const katDoc of katlarSnapshot.docs) {
        // Kattaki daireleri sil
        const dairelerRef = collection(db, `santiyeler/${santiyeId}/bloklar/${blokId}/katlar/${katDoc.id}/daireler`);
        const dairelerSnapshot = await getDocs(dairelerRef);
        
        for (const daireDoc of dairelerSnapshot.docs) {
          await deleteDoc(daireDoc.ref);
        }
        // Katı sil
        await deleteDoc(katDoc.ref);
      }

      // Blok dokümanını güncelle
      const blokRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}`);
      await setDoc(blokRef, {
        guncellenmeTarihi: new Date().toISOString(),
        ortakAlanlar: []
      }, { merge: true });

    } catch (error) {
      console.error('Bina yapısı temizlenirken hata:', error);
      throw error;
    }
  }

  // Blok yapısı oluştur (güncellendi)
  async blokYapisiOlustur(santiyeId, blokId, katSayisi = 8) {
    try {
      // Ana blok dokümanını oluştur
      const blokRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}`);
      await setDoc(blokRef, {
        ad: blokId.toUpperCase() + " BLOK",
        kod: blokId,
        durum: "aktif",
        katSayisi: katSayisi,
        olusturmaTarihi: serverTimestamp(),
        guncellemeTarihi: serverTimestamp()
      });

      // Katları ayrı koleksiyonda oluştur
      for (let katNo = katSayisi; katNo >= 0; katNo--) {
        const katRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}/katlar/${katNo}`);
        const katData = {
          no: katNo.toString(),
          tip: katNo === 0 ? "ZEMIN" : "NORMAL",
          olusturmaTarihi: serverTimestamp(),
          guncellemeTarihi: serverTimestamp()
        };
        await setDoc(katRef, katData);

        // Zemin kat hariç her kata 4 daire ekle
        if (katNo !== 0) {
          for (let daireIndex = 0; daireIndex < 4; daireIndex++) {
            // Daire numarası formatı: B81, B82, B83, B84 şeklinde
            const daireNo = `${blokId}${katNo}${daireIndex + 1}`;
            const daireRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}/katlar/${katNo}/daireler/${daireNo}`);
            await setDoc(daireRef, {
              no: daireNo,
              tip: "DAIRE",
              isim: `${blokId}${katNo}${daireIndex + 1} Nolu Daire`,
              olusturmaTarihi: serverTimestamp(),
              guncellemeTarihi: serverTimestamp()
            });
          }
        }
      }

      return await this.getBlokBilgileri(santiyeId, blokId);
    } catch (error) {
      console.error('Blok yapısı oluşturulurken hata:', error);
      throw error;
    }
  }

  // Yeni blok oluştur
  async yeniBlokOlustur(santiyeId, blokAd, katSayisi = 8, daireSayisi = 4) {
    try {
      // Blok referansını oluştur
      const blokRef = doc(collection(db, `santiyeler/${santiyeId}/bloklar`));

      // Blok verilerini hazırla
      const blokData = {
        ad: blokAd,
        kod: blokAd,
        durum: "aktif",
        katlar: [],
        olusturmaTarihi: serverTimestamp(),
        guncellemeTarihi: serverTimestamp()
      };

      // Katları oluştur
      for (let i = 1; i <= katSayisi; i++) {
        const daireler = [];
        // Her kat için daireleri oluştur
        for (let j = 1; j <= daireSayisi; j++) {
          daireler.push({
            no: `${blokAd}${i}${j.toString().padStart(2, '0')}`,
            tip: 'DAIRE'
          });
        }

        blokData.katlar.push({
          no: i.toString(),
          tip: 'NORMAL',
          daireler: daireler
        });
      }

      // Bloğu kaydet
      await setDoc(blokRef, blokData);
      
      return blokRef.id;
    } catch (error) {
      console.error('Yeni blok oluşturulurken hata:', error);
      throw error;
    }
  }

  // Yeni kat tipleri
  KAT_TIPLERI = {
    NORMAL: "NORMAL",
    ZEMIN: "ZEMIN",
    CATI: "CATI",
    BODRUM: "BODRUM"
  };

  // Geçici değişiklik ekle
  geciciDegisiklikEkle(santiyeId, blokId, degisiklik) {
    const key = `${santiyeId}_${blokId}`;
    const mevcutDegisiklikler = this.#geciciDegisiklikler.get(key) || [];
    this.#geciciDegisiklikler.set(key, [...mevcutDegisiklikler, degisiklik]);
  }

  // Kat ekle (geçici)
  async katEkleGecici(santiyeId, blokId, katData) {
    this.geciciDegisiklikEkle(santiyeId, blokId, {
      tip: 'KAT_EKLE',
      data: katData
    });
    return await this.getBlokBilgileri(santiyeId, blokId);
  }

  // Kat sil (geçici)
  async katSilGecici(santiyeId, blokId, katNo) {
    this.geciciDegisiklikEkle(santiyeId, blokId, {
      tip: 'KAT_SIL',
      katNo: katNo
    });
    return await this.getBlokBilgileri(santiyeId, blokId);
  }

  // Daire ekle (geçici)
  async daireEkleGecici(santiyeId, blokId, katNo, daire) {
    this.geciciDegisiklikEkle(santiyeId, blokId, {
      tip: 'DAIRE_EKLE',
      katNo: katNo,
      data: daire
    });
    return await this.getBlokBilgileri(santiyeId, blokId);
  }

  // Daire sil (geçici)
  async daireSilGecici(santiyeId, blokId, katNo, daireNo) {
    this.geciciDegisiklikEkle(santiyeId, blokId, {
      tip: 'DAIRE_SIL',
      katNo: katNo,
      daireNo: daireNo
    });
    return await this.getBlokBilgileri(santiyeId, blokId);
  }

  // Tüm değişiklikleri kaydet
  async degisiklikleriKaydet(santiyeId, blokId) {
    try {
      const key = `${santiyeId}_${blokId}`;
      const degisiklikler = this.#geciciDegisiklikler.get(key) || [];
      const blokRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}`);
      const blokDoc = await getDoc(blokRef);
      
      if (!blokDoc.exists()) throw new Error('Blok bulunamadı');
      
      const blokData = blokDoc.data();
      let katlar = [...(blokData.katlar || [])];

      // Değişiklikleri uygula
      for (const degisiklik of degisiklikler) {
        switch (degisiklik.tip) {
          case 'KAT_EKLE':
            katlar.push({ ...degisiklik.data, daireler: [] });
            break;
          case 'KAT_SIL':
            katlar = katlar.filter(k => k.no !== degisiklik.katNo);
            break;
          case 'DAIRE_EKLE':
            const katIndex = katlar.findIndex(k => k.no === degisiklik.katNo);
            if (katIndex !== -1) {
              if (!katlar[katIndex].daireler) katlar[katIndex].daireler = [];
              katlar[katIndex].daireler.push(degisiklik.data);
            }
            break;
          case 'DAIRE_SIL':
            const kat = katlar.find(k => k.no === degisiklik.katNo);
            if (kat && kat.daireler) {
              kat.daireler = kat.daireler.filter(d => d.no !== degisiklik.daireNo);
            }
            break;
        }
      }

      // Katları sırala
      katlar.sort((a, b) => {
        const getKatNo = (no) => {
          if (typeof no === 'string' && no.startsWith('B')) return -parseInt(no.slice(1));
          if (no === '0') return 0;
          return parseInt(no);
        };
        return getKatNo(b.no) - getKatNo(a.no);
      });

      // Değişiklikleri kaydet
      await updateDoc(blokRef, {
        katlar,
        guncellemeTarihi: serverTimestamp()
      });

      // Geçici değişiklikleri temizle
      this.#geciciDegisiklikler.delete(key);
      
      return await this.getBlokBilgileri(santiyeId, blokId);
    } catch (error) {
      console.error('Değişiklikler kaydedilirken hata:', error);
      throw error;
    }
  }

  // Değişiklikleri iptal et
  degisiklikleriIptalEt(santiyeId, blokId) {
    const key = `${santiyeId}_${blokId}`;
    this.#geciciDegisiklikler.delete(key);
  }

  // Bina yapısını kaydet
  async setBinaYapisi(santiyeId, blokId, yeniYapi) {
    try {
      const blokRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}`);
      
      // Sadece katları güncelle, diğer alanları değiştirme
      await updateDoc(blokRef, {
        katlar: yeniYapi.bloklar[0].katlar,
        guncellemeTarihi: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Bina yapısı kaydedilirken hata:', error);
      throw error;
    }
  }

  // Eksiklikleri getir
  async getEksiklikler(santiyeId, blokId) {
    try {
      const eksikliklerRef = collection(db, `santiyeler/${santiyeId}/bloklar/${blokId}/eksiklikler`);
      const snapshot = await getDocs(eksikliklerRef);
      
      const eksiklikler = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          daire: data.daire || '',
          aciklama: data.aciklama || '',
          durum: data.durum || 'YENI',
          oncelik: data.oncelik || 'NORMAL',
          taseron: data.taseron || '',
          fotograflar: data.fotograflar || [],
          olusturmaTarihi: data.olusturmaTarihi?.toDate()
        };
      });

      return eksiklikler;
    } catch (error) {
      console.error('Eksiklikler alınırken hata:', error);
      throw error;
    }
  }

  // Yeni eksiklik ekle
  async eksiklikEkle(santiyeId, blokId, eksiklik) {
    try {
      const eksikliklerRef = collection(db, `santiyeler/${santiyeId}/bloklar/${blokId}/eksiklikler`);
      const yeniEksiklikRef = doc(eksikliklerRef);
      
      const eksiklikData = {
        ...eksiklik,
        id: yeniEksiklikRef.id,
        taseron: eksiklik.taseron || '',
        olusturmaTarihi: serverTimestamp(),
        guncellemeTarihi: serverTimestamp()
      };

      await setDoc(yeniEksiklikRef, eksiklikData);
      
      return {
        ...eksiklikData,
        olusturmaTarihi: new Date(),
        guncellemeTarihi: new Date()
      };
    } catch (error) {
      console.error('Eksiklik eklenirken hata:', error);
      throw error;
    }
  }

  // Eksiklik güncelle
  async eksiklikGuncelle(santiyeId, blokId, eksiklik) {
    try {
      const eksiklikRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}/eksiklikler/${eksiklik.id}`);
      
      const guncelData = {
        ...eksiklik,
        taseron: eksiklik.taseron || '',
        guncellemeTarihi: serverTimestamp()
      };

      await updateDoc(eksiklikRef, guncelData);
      return true;
    } catch (error) {
      console.error('Eksiklik güncellenirken hata:', error);
      throw error;
    }
  }

  // Eksiklik sil
  async eksiklikSil(santiyeId, blokId, eksiklikId) {
    try {
      const eksiklikRef = doc(db, `santiyeler/${santiyeId}/bloklar/${blokId}/eksiklikler/${eksiklikId}`);
      await deleteDoc(eksiklikRef);
      return true;
    } catch (error) {
      console.error('Eksiklik silinirken hata:', error);
      throw error;
    }
  }

  // Eksiklik fotoğrafı ekle
  async eksiklikFotografEkle(santiyeId, blokId, eksiklikId, file) {
    try {
      // Burada storage işlemleri yapılacak
      // Şimdilik sadece dosya adını döndürüyoruz
      return file.name;
    } catch (error) {
      console.error('Fotoğraf eklenirken hata:', error);
      throw error;
    }
  }

  // Eksiklik fotoğrafı sil
  async eksiklikFotografSil(santiyeId, blokId, eksiklikId, fotografUrl) {
    try {
      // Burada storage işlemleri yapılacak
      return true;
    } catch (error) {
      console.error('Fotoğraf silinirken hata:', error);
      throw error;
    }
  }

  // Taşeronları getir
  async getTaseronlar() {
    try {
      const personellerRef = collection(db, 'personeller');
      const snapshot = await getDocs(personellerRef);
      
      // Firma bilgilerini unique olarak topla
      const taseronSet = new Set();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Önce firma, yoksa firmaAdi alanını kontrol et
        const firma = data.firma || data.firmaAdi;
        if (firma) taseronSet.add(firma);
      });

      // Set'i array'e çevir ve id/ad formatına dönüştür
      return Array.from(taseronSet).map(firma => ({
        id: firma,
        ad: firma
      }));
    } catch (error) {
      console.error('Taşeronlar alınırken hata:', error);
      return []; // Hata durumunda boş liste döndür
    }
  }
}

// Tek bir instance oluştur ve export et
export const binaService = new BinaService();
