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

const COLLECTION_NAME = 'isGruplari';

// İş grubu verilerini hazırla
const prepareIsGrubuData = (data) => {
    return {
        isGrubuKodu: data.isGrubuKodu || '',
        isGrubuAdi: data.isGrubuAdi || '',
        santiyeId: data.santiyeId || '',
        santiyeAdi: data.santiyeAdi || '', // Tam isim
        aciklama: data.aciklama || '',
        aktif: true,
        
        // Sistem bilgileri
        createdAt: data.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: data.createdBy || null,
        updatedBy: data.updatedBy || null
    };
};

const isGrubuService = {
    // İş grubu oluşturma
    async createIsGrubu(data) {
        try {
            const isGrubuData = prepareIsGrubuData(data);
            const docRef = await addDoc(collection(db, COLLECTION_NAME), isGrubuData);
            return { id: docRef.id, ...isGrubuData };
        } catch (error) {
            console.error('İş grubu oluşturma hatası:', error);
            throw error;
        }
    },

    // İş grubu güncelleme
    async updateIsGrubu(id, data) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const guncelData = prepareIsGrubuData({
                ...data,
                updatedAt: Timestamp.now()
            });
            await updateDoc(docRef, guncelData);
            return { id, ...guncelData };
        } catch (error) {
            console.error('İş grubu güncelleme hatası:', error);
            throw error;
        }
    },

    // İş grubu silme (soft delete)
    async deleteIsGrubu(id) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                aktif: false,
                updatedAt: Timestamp.now()
            });
            return true;
        } catch (error) {
            console.error('İş grubu silme hatası:', error);
            throw error;
        }
    },

    // İş grubu detayını getir
    async getIsGrubuById(id) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error('İş grubu bulunamadı');
            }
            return { id: docSnap.id, ...docSnap.data() };
        } catch (error) {
            console.error('İş grubu detayı getirme hatası:', error);
            throw error;
        }
    },

    // Tüm iş gruplarını getir
    async getIsGruplari(filters = {}) {
        try {
            let q = collection(db, COLLECTION_NAME);
            const conditions = [];
            
            // Temel filtreler
            if (filters.santiyeId) {
                conditions.push(where('santiyeId', '==', filters.santiyeId));
            }
            
            if (filters.isGrubuKodu) {
                conditions.push(where('isGrubuKodu', '==', filters.isGrubuKodu));
            }
            
            if (filters.aktif !== undefined) {
                conditions.push(where('aktif', '==', filters.aktif));
            } else {
                conditions.push(where('aktif', '==', true));
            }
            
            // Filtreleri uygula
            if (conditions.length > 0) {
                q = query(q, ...conditions, orderBy('isGrubuKodu', 'asc'));
            } else {
                q = query(q, where('aktif', '==', true), orderBy('isGrubuKodu', 'asc'));
            }
            
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('İş grupları getirme hatası:', error);
            throw error;
        }
    },

    // Şantiyeye ait iş gruplarını getir
    async getIsGruplariBySantiye(santiyeId, filters = {}) {
        return this.getIsGruplari({ ...filters, santiyeId });
    },

    // İş grubu koduna göre iş gruplarını getir
    async getIsGruplariByKod(isGrubuKodu, filters = {}) {
        return this.getIsGruplari({ ...filters, isGrubuKodu });
    },

    // Toplu iş grubu oluşturma
    async createIsGrubuBatch(isGruplari) {
        try {
            const promises = isGruplari.map(isGrubu => this.createIsGrubu(isGrubu));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Toplu iş grubu oluşturma hatası:', error);
            throw error;
        }
    },

    // Toplu iş grubu güncelleme
    async updateIsGrubuBatch(isGruplari) {
        try {
            const promises = isGruplari.map(isGrubu => this.updateIsGrubu(isGrubu.id, isGrubu));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Toplu iş grubu güncelleme hatası:', error);
            throw error;
        }
    }
};

export default isGrubuService;
