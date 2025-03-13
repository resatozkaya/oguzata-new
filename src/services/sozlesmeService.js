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
    getDoc,
    Timestamp,
    writeBatch,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';

const COLLECTION_NAME = 'sozlesmeler';

// Sözleşme türleri
export const SOZLESME_TURLERI = {
    BIRIM_FIYAT: 'birimFiyat',
    GOTURE_BEDEL: 'gotureBedel',
    MALIYET_KAR: 'maliyetKar',
    KARMA: 'karma'
};

// Sözleşme verilerini hazırla
const prepareSozlesmeData = (data) => {
    // Tarihleri kontrol et ve dönüştür
    const sozlesmeTarihi = data.sozlesmeTarihi instanceof Date ? data.sozlesmeTarihi : data.sozlesmeTarihi ? new Date(data.sozlesmeTarihi) : null;
    const baslangicTarihi = data.baslangicTarihi instanceof Date ? data.baslangicTarihi : data.baslangicTarihi ? new Date(data.baslangicTarihi) : null;
    const bitisTarihi = data.bitisTarihi instanceof Date ? data.bitisTarihi : data.bitisTarihi ? new Date(data.bitisTarihi) : null;

    // Şantiye ve taşeron verilerini kontrol et
    const santiye = data.santiye ? {
        id: data.santiye.id || '',
        ad: data.santiye.ad || '',
        kod: data.santiye.kod || ''
    } : null;

    const taseron = data.taseron ? {
        id: data.taseron.id || '',
        unvan: data.taseron.unvan || '',
        vergiNo: data.taseron.vergiNo || '',
        yetkili: data.taseron.yetkili || ''
    } : null;

    return {
        // Temel bilgiler
        sozlesmeNo: data.sozlesmeNo || '',
        sozlesmeAdi: data.sozlesmeAdi || '',
        sozlesmeTuru: Object.values(SOZLESME_TURLERI).includes(data.sozlesmeTuru) 
            ? data.sozlesmeTuru 
            : SOZLESME_TURLERI.BIRIM_FIYAT,
        kullaniciId: data.kullaniciId || data.olusturanKullanici || null,
        
        // Şantiye ve taşeron bilgileri
        santiye,
        taseron,

        // Tarihler
        sozlesmeTarihi: sozlesmeTarihi ? Timestamp.fromDate(sozlesmeTarihi) : null,
        baslangicTarihi: baslangicTarihi ? Timestamp.fromDate(baslangicTarihi) : null,
        bitisTarihi: bitisTarihi ? Timestamp.fromDate(bitisTarihi) : null,

        // Finansal bilgiler
        toplamBedel: parseFloat(data.toplamBedel) || 0,
        teminatOrani: parseFloat(data.teminatOrani) || 0,
        paraBirimi: data.paraBirimi || 'TRY',

        // Diğer bilgiler
        aciklama: data.aciklama || '',
        dosyaUrl: data.dosyaUrl || '',
        durum: data.durum || 'aktif',
        birimFiyatlar: data.birimFiyatlar || [],

        // Sistem bilgileri
        olusturanKullanici: data.olusturanKullanici || null,
        olusturmaTarihi: data.olusturmaTarihi || serverTimestamp(),
        guncelleyenKullanici: data.guncelleyenKullanici || null,
        guncellemeTarihi: serverTimestamp()
    };
};

const sozlesmeService = {
    // Sözleşme oluşturma
    async createSozlesme(data) {
        try {
            console.log('Sözleşme oluşturma başladı:', data);
            const sozlesmeData = prepareSozlesmeData(data);
            console.log('Hazırlanan sözleşme verisi:', sozlesmeData);

            // Sözleşme koleksiyonunda yeni bir döküman oluştur
            const docRef = doc(collection(db, COLLECTION_NAME));
            await setDoc(docRef, sozlesmeData);
            console.log('Sözleşme başarıyla oluşturuldu. ID:', docRef.id);

            // Birim fiyatlar alt koleksiyonunu oluştur
            if (data.birimFiyatlar && data.birimFiyatlar.length > 0) {
                console.log('Birim fiyatlar ekleniyor...');
                const birimFiyatlarRef = collection(db, COLLECTION_NAME, docRef.id, 'birimFiyatlar');
                const batch = writeBatch(db);

                data.birimFiyatlar.forEach((birimFiyat) => {
                    const birimFiyatRef = doc(birimFiyatlarRef);
                    batch.set(birimFiyatRef, {
                        ...birimFiyat,
                        olusturmaTarihi: serverTimestamp(),
                        guncellemeTarihi: serverTimestamp()
                    });
                });

                await batch.commit();
                console.log('Birim fiyatlar başarıyla eklendi');
            }

            return { id: docRef.id, ...sozlesmeData };
        } catch (error) {
            console.error('Sözleşme oluşturma hatası:', error);
            throw error;
        }
    },

    // Sözleşme güncelleme
    async updateSozlesme(id, data) {
        try {
            console.log('Sözleşme güncelleme başladı. ID:', id, 'Data:', data);
            const docRef = doc(db, COLLECTION_NAME, id);
            const guncelData = prepareSozlesmeData(data);
            
            // Ana sözleşme verilerini güncelle
            await updateDoc(docRef, guncelData);
            console.log('Sözleşme ana verileri güncellendi');

            // Birim fiyatları güncelle
            if (data.birimFiyatlar && data.birimFiyatlar.length > 0) {
                console.log('Birim fiyatlar güncelleniyor...');
                const birimFiyatlarRef = collection(db, COLLECTION_NAME, id, 'birimFiyatlar');
                
                // Önce mevcut birim fiyatları temizle
                const mevcutBirimFiyatlar = await getDocs(birimFiyatlarRef);
                const batch = writeBatch(db);
                mevcutBirimFiyatlar.forEach((doc) => {
                    batch.delete(doc.ref);
                });

                // Yeni birim fiyatları ekle
                data.birimFiyatlar.forEach((birimFiyat) => {
                    const birimFiyatRef = doc(birimFiyatlarRef);
                    batch.set(birimFiyatRef, {
                        ...birimFiyat,
                        guncellemeTarihi: serverTimestamp()
                    });
                });

                await batch.commit();
                console.log('Birim fiyatlar başarıyla güncellendi');
            }

            return { id, ...guncelData };
        } catch (error) {
            console.error('Sözleşme güncelleme hatası:', error);
            throw error;
        }
    },

    // Sözleşme silme (soft delete)
    async deleteSozlesme(id) {
        try {
            console.log('Sözleşme silme işlemi başladı. ID:', id);
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                durum: 'iptal',
                guncellemeTarihi: serverTimestamp()
            });
            console.log('Sözleşme başarıyla silindi (soft delete)');
            return true;
        } catch (error) {
            console.error('Sözleşme silme hatası:', error);
            throw error;
        }
    },

    // Sözleşme detayını getir
    async getSozlesmeById(id) {
        try {
            console.log('Sözleşme detayı getiriliyor. ID:', id);
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                console.log('Sözleşme bulunamadı');
                throw new Error('Sözleşme bulunamadı');
            }

            // Birim fiyatları getir
            const birimFiyatlarRef = collection(db, COLLECTION_NAME, id, 'birimFiyatlar');
            const birimFiyatlarSnap = await getDocs(birimFiyatlarRef);
            const birimFiyatlar = birimFiyatlarSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log('Sözleşme detayı başarıyla getirildi');
            return { 
                id: docSnap.id, 
                ...docSnap.data(),
                birimFiyatlar 
            };
        } catch (error) {
            console.error('Sözleşme detayı getirme hatası:', error);
            throw error;
        }
    },

    // Tüm sözleşmeleri getir
    async getSozlesmeler(filters = {}) {
        try {
            console.log('Sözleşmeler getiriliyor. Filtreler:', filters);
            let q = collection(db, COLLECTION_NAME);
            const conditions = [];
            
            // Temel filtreler
            if (filters.kullaniciId) {
                conditions.push(where('kullaniciId', '==', filters.kullaniciId));
            }
            
            if (filters.santiyeId) {
                conditions.push(where('santiye.id', '==', filters.santiyeId));
            }
            
            if (filters.taseronId) {
                conditions.push(where('taseron.id', '==', filters.taseronId));
            }
            
            if (filters.durum) {
                conditions.push(where('durum', '==', filters.durum));
            }

            // Koşulları ekle
            if (conditions.length > 0) {
                q = query(q, ...conditions);
            }
            
            console.log('Query oluşturuldu');
            const querySnapshot = await getDocs(q);
            console.log('Query sonucu:', querySnapshot.size);
            
            const sozlesmeler = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                baslangicTarihi: doc.data().baslangicTarihi?.toDate?.() || null,
                bitisTarihi: doc.data().bitisTarihi?.toDate?.() || null
            }));

            console.log(`${sozlesmeler.length} sözleşme bulundu`);
            return sozlesmeler;
        } catch (error) {
            console.error('Sözleşmeleri getirme hatası:', error);
            throw error;
        }
    },

    // Şantiyeye ait sözleşmeleri getir
    async getSozlesmesBySantiye(santiyeId) {
        try {
            console.log('Şantiyeye ait sözleşmeler getiriliyor. Şantiye ID:', santiyeId);
            const q = query(
                collection(db, COLLECTION_NAME),
                where('santiye.id', '==', santiyeId),
                where('durum', '==', 'aktif')
            );
            
            const querySnapshot = await getDocs(q);
            const sozlesmeler = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log(`${sozlesmeler.length} sözleşme bulundu`);
            return sozlesmeler;
        } catch (error) {
            console.error('Şantiye sözleşmeleri getirme hatası:', error);
            throw error;
        }
    },

    // Taşerona ait sözleşmeleri getir
    async getSozlesmesByTaseron(taseronId) {
        try {
            console.log('Taşerona ait sözleşmeler getiriliyor. Taşeron ID:', taseronId);
            const q = query(
                collection(db, COLLECTION_NAME),
                where('taseron.id', '==', taseronId),
                where('durum', '==', 'aktif')
            );
            
            const querySnapshot = await getDocs(q);
            const sozlesmeler = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log(`${sozlesmeler.length} sözleşme bulundu`);
            return sozlesmeler;
        } catch (error) {
            console.error('Taşeron sözleşmeleri getirme hatası:', error);
            throw error;
        }
    }
};

export default sozlesmeService;
