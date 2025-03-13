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
    orderBy
} from 'firebase/firestore';

const COLLECTION_NAME = 'metrajlar';

// Metraj verilerini hazırla
const prepareMetrajData = (data) => {
    return {
        hakedisId: data.hakedisId || '',
        sozlesmeId: data.sozlesmeId || '',
        birimFiyatId: data.birimFiyatId || '',
        pozNo: data.pozNo || '',
        isGrubu: data.isGrubu || '',
        isKalemi: data.isKalemi || '',
        birim: data.birim || '',
        miktar: parseFloat(data.miktar) || 0,
        birimFiyat: parseFloat(data.birimFiyat) || 0,
        tutar: parseFloat(data.tutar) || 0,
        aciklama: data.aciklama || '',
        
        // Sistem bilgileri
        createdAt: data.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: data.createdBy || null,
        updatedBy: data.updatedBy || null
    };
};

const metrajService = {
    // Metraj oluşturma
    async createMetraj(data) {
        try {
            const metrajData = prepareMetrajData(data);
            const docRef = await addDoc(collection(db, COLLECTION_NAME), metrajData);
            return { id: docRef.id, ...metrajData };
        } catch (error) {
            console.error('Metraj oluşturma hatası:', error);
            throw error;
        }
    },

    // Metraj güncelleme
    async updateMetraj(id, data) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const guncelData = {
                ...data,
                updatedAt: Timestamp.now()
            };
            await updateDoc(docRef, guncelData);
            return { id, ...guncelData };
        } catch (error) {
            console.error('Metraj güncelleme hatası:', error);
            throw error;
        }
    },

    // Metraj silme
    async deleteMetraj(id) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
            return true;
        } catch (error) {
            console.error('Metraj silme hatası:', error);
            throw error;
        }
    },

    // Metraj detaylarını getir
    async getMetrajById(id) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error('Metraj bulunamadı');
            }
            return { id: docSnap.id, ...docSnap.data() };
        } catch (error) {
            console.error('Metraj detayı getirme hatası:', error);
            throw error;
        }
    },

    // Hakedişe ait metrajları getir
    async getMetrajByHakedis(hakedisId) {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('hakedisId', '==', hakedisId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Hakediş metrajları getirme hatası:', error);
            throw error;
        }
    },

    // Sözleşmeye ait metrajları getir
    async getMetrajBySozlesme(sozlesmeId) {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('sozlesmeId', '==', sozlesmeId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Sözleşme metrajları getirme hatası:', error);
            throw error;
        }
    },

    // Birim fiyata ait metrajları getir
    async getMetrajByBirimFiyat(birimFiyatId) {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('birimFiyatId', '==', birimFiyatId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Birim fiyat metrajları getirme hatası:', error);
            throw error;
        }
    },

    // Toplu metraj oluşturma
    async createMetrajBatch(metrajlar) {
        try {
            const promises = metrajlar.map(metraj => this.createMetraj(metraj));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Toplu metraj oluşturma hatası:', error);
            throw error;
        }
    },

    // Toplu metraj güncelleme
    async updateMetrajBatch(metrajlar) {
        try {
            const promises = metrajlar.map(metraj => this.updateMetraj(metraj.id, metraj));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Toplu metraj güncelleme hatası:', error);
            throw error;
        }
    },

    // Toplu metraj silme
    async deleteMetrajBatch(metrajIds) {
        try {
            const promises = metrajIds.map(id => this.deleteMetraj(id));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Toplu metraj silme hatası:', error);
            throw error;
        }
    }
};

export default metrajService;
