import { db } from '../lib/firebase/config';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    Timestamp
} from 'firebase/firestore';

const COLLECTION_NAME = 'birimFiyatlar';

const createBirimFiyat = async (birimFiyatData) => {
    try {
        // Tarih alanlarını kontrol et ve Timestamp'e çevir
        const data = {
            ...birimFiyatData,
            gecerlilikBaslangic: birimFiyatData.gecerlilikBaslangic || null,
            gecerlilikBitis: birimFiyatData.gecerlilikBitis || null,
            olusturmaTarihi: Timestamp.now(),
            aktif: true
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error('Birim fiyat oluşturulurken hata:', error);
        throw error;
    }
};

const updateBirimFiyat = async (id, birimFiyatData) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const data = {
            ...birimFiyatData,
            gecerlilikBaslangic: birimFiyatData.gecerlilikBaslangic || null,
            gecerlilikBitis: birimFiyatData.gecerlilikBitis || null,
            guncellenmeTarihi: Timestamp.now()
        };

        await updateDoc(docRef, data);
        return { id, ...data };
    } catch (error) {
        console.error('Birim fiyat güncellenirken hata:', error);
        throw error;
    }
};

const deleteBirimFiyat = async (id) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            aktif: false,
            silinmeTarihi: Timestamp.now()
        });
        return id;
    } catch (error) {
        console.error('Birim fiyat silinirken hata:', error);
        throw error;
    }
};

const getBirimFiyatlar = async (filters = {}) => {
    try {
        let q = collection(db, COLLECTION_NAME);
        const conditions = [];

        // Aktif kayıtları getir
        conditions.push(where('aktif', '==', true));

        // Sözleşme ID'ye göre filtrele
        if (filters.sozlesmeId) {
            conditions.push(where('sozlesmeId', '==', filters.sozlesmeId));
        }

        // Yapı/Firma'ya göre filtrele
        if (filters.yapiFirma) {
            conditions.push(where('yapiFirma', '==', filters.yapiFirma));
        }

        // İş grubuna göre filtrele
        if (filters.isGrubu) {
            conditions.push(where('isGrubu', '==', filters.isGrubu));
        }

        // Geçerlilik tarihine göre filtrele
        if (filters.gecerlilikTarihi) {
            const tarih = Timestamp.fromDate(filters.gecerlilikTarihi);
            conditions.push(where('gecerlilikBaslangic', '<=', tarih));
            conditions.push(where('gecerlilikBitis', '>=', tarih));
        }

        if (conditions.length > 0) {
            q = query(q, ...conditions);
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Birim fiyatlar getirilirken hata:', error);
        throw error;
    }
};

export default {
    createBirimFiyat,
    updateBirimFiyat,
    deleteBirimFiyat,
    getBirimFiyatlar
};
