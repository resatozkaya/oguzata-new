import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

export const sozlesmeService = {
    // Sözleşme oluşturma
    async createSozlesme(sozlesmeData) {
        try {
            const docRef = await addDoc(collection(db, 'sozlesmeler'), {
                ...sozlesmeData,
                olusturmaTarihi: new Date(),
                durum: 'aktif'
            });
            return docRef.id;
        } catch (error) {
            console.error('Sözleşme oluşturma hatası:', error);
            throw error;
        }
    },

    // Sözleşme güncelleme
    async updateSozlesme(sozlesmeId, sozlesmeData) {
        try {
            await updateDoc(doc(db, 'sozlesmeler', sozlesmeId), {
                ...sozlesmeData,
                guncellemeTarihi: new Date()
            });
            return sozlesmeId;
        } catch (error) {
            console.error('Sözleşme güncelleme hatası:', error);
            throw error;
        }
    },

    // Tüm sözleşmeleri getirme
    async getAllSozlesmeler() {
        try {
            const q = query(collection(db, 'sozlesmeler'), orderBy('olusturmaTarihi', 'desc'));
            const querySnapshot = await getDocs(q);
            const sozlesmeler = [];
            querySnapshot.forEach(doc => {
                sozlesmeler.push({ id: doc.id, ...doc.data() });
            });
            return sozlesmeler;
        } catch (error) {
            console.error('Sözleşmeleri getirme hatası:', error);
            throw error;
        }
    },

    // Birim fiyat ekleme
    async createBirimFiyat(birimFiyatData) {
        try {
            const docRef = await addDoc(collection(db, 'birimFiyatlar'), {
                ...birimFiyatData,
                olusturmaTarihi: new Date()
            });
            return docRef.id;
        } catch (error) {
            console.error('Birim fiyat ekleme hatası:', error);
            throw error;
        }
    },

    // Birim fiyat güncelleme
    async updateBirimFiyat(birimFiyatId, birimFiyatData) {
        try {
            await updateDoc(doc(db, 'birimFiyatlar', birimFiyatId), {
                ...birimFiyatData,
                guncellemeTarihi: new Date()
            });
            return birimFiyatId;
        } catch (error) {
            console.error('Birim fiyat güncelleme hatası:', error);
            throw error;
        }
    },

    // Tüm birim fiyatları getirme
    async getAllBirimFiyatlar() {
        try {
            const q = query(collection(db, 'birimFiyatlar'), orderBy('olusturmaTarihi', 'desc'));
            const querySnapshot = await getDocs(q);
            const birimFiyatlar = [];
            querySnapshot.forEach(doc => {
                birimFiyatlar.push({ id: doc.id, ...doc.data() });
            });
            return birimFiyatlar;
        } catch (error) {
            console.error('Birim fiyatları getirme hatası:', error);
            throw error;
        }
    },

    // Sözleşme detayları getirme
    async getSozlesmeDetails(sozlesmeId) {
        try {
            const sozlesmeDoc = await getDoc(doc(db, 'sozlesmeler', sozlesmeId));
            if (!sozlesmeDoc.exists()) {
                throw new Error('Sözleşme bulunamadı');
            }

            // Birim fiyatları getir
            const birimFiyatlarSnapshot = await getDocs(
                query(collection(db, 'birimFiyatlar'), 
                where('sozlesmeId', '==', sozlesmeId))
            );

            const birimFiyatlar = [];
            birimFiyatlarSnapshot.forEach(doc => {
                birimFiyatlar.push({ id: doc.id, ...doc.data() });
            });

            return {
                sozlesme: { id: sozlesmeDoc.id, ...sozlesmeDoc.data() },
                birimFiyatlar
            };
        } catch (error) {
            console.error('Sözleşme detayları getirme hatası:', error);
            throw error;
        }
    },

    // Proje sözleşmelerini listeleme
    async getProjeSozlesmeleri(projeId) {
        try {
            if (!projeId) {
                return [];
            }
            
            const sozlesmelerSnapshot = await getDocs(
                query(
                    collection(db, 'sozlesmeler'),
                    where('projeId', '==', projeId)
                )
            );

            const sozlesmeler = [];
            sozlesmelerSnapshot.forEach(doc => {
                sozlesmeler.push({ id: doc.id, ...doc.data() });
            });

            return sozlesmeler;
        } catch (error) {
            console.error('Proje sözleşmeleri getirme hatası:', error);
            throw error;
        }
    }
};
