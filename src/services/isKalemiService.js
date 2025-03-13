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

const COLLECTION_NAME = 'isKalemleri';

// İş kalemi verilerini hazırla
const prepareIsKalemiData = (data) => {
    return {
        isGrubuId: data.isGrubuId || '',
        isGrubuKodu: data.isGrubuKodu || '',
        isGrubuAdi: data.isGrubuAdi || '', // Tam isim
        pozNo: data.pozNo || '',
        isKalemiAdi: data.isKalemiAdi || '',
        birim: data.birim || '',
        birimFiyat: parseFloat(data.birimFiyat) || 0,
        paraBirimi: data.paraBirimi || 'TRY',
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

const isKalemiService = {
    // İş kalemi oluşturma
    async createIsKalemi(data) {
        try {
            const isKalemiData = prepareIsKalemiData(data);
            const docRef = await addDoc(collection(db, COLLECTION_NAME), isKalemiData);
            return { id: docRef.id, ...isKalemiData };
        } catch (error) {
            console.error('İş kalemi oluşturma hatası:', error);
            throw error;
        }
    },

    // İş kalemi güncelleme
    async updateIsKalemi(id, data) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const guncelData = prepareIsKalemiData({
                ...data,
                updatedAt: Timestamp.now()
            });
            await updateDoc(docRef, guncelData);
            return { id, ...guncelData };
        } catch (error) {
            console.error('İş kalemi güncelleme hatası:', error);
            throw error;
        }
    },

    // İş kalemi silme (soft delete)
    async deleteIsKalemi(id) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                aktif: false,
                updatedAt: Timestamp.now()
            });
            return true;
        } catch (error) {
            console.error('İş kalemi silme hatası:', error);
            throw error;
        }
    },

    // İş kalemi detayını getir
    async getIsKalemiById(id) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error('İş kalemi bulunamadı');
            }
            return { id: docSnap.id, ...docSnap.data() };
        } catch (error) {
            console.error('İş kalemi detayı getirme hatası:', error);
            throw error;
        }
    },

    // Tüm iş kalemlerini getir
    async getIsKalemleri(filters = {}) {
        try {
            let q = collection(db, COLLECTION_NAME);
            const conditions = [];
            
            // Temel filtreler
            if (filters.santiyeId) {
                conditions.push(where('santiyeId', '==', filters.santiyeId));
            }
            
            if (filters.isGrubuId) {
                conditions.push(where('isGrubuId', '==', filters.isGrubuId));
            }
            
            if (filters.pozNo) {
                conditions.push(where('pozNo', '==', filters.pozNo));
            }
            
            if (filters.aktif !== undefined) {
                conditions.push(where('aktif', '==', filters.aktif));
            } else {
                conditions.push(where('aktif', '==', true));
            }
            
            // Filtreleri uygula
            if (conditions.length > 0) {
                q = query(q, ...conditions, orderBy('pozNo', 'asc'));
            } else {
                q = query(q, where('aktif', '==', true), orderBy('pozNo', 'asc'));
            }
            
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('İş kalemleri getirme hatası:', error);
            throw error;
        }
    },

    // Şantiyeye ait iş kalemlerini getir
    async getIsKalemleriBySantiye(santiyeId, filters = {}) {
        return this.getIsKalemleri({ ...filters, santiyeId });
    },

    // İş grubuna ait iş kalemlerini getir
    async getIsKalemleriByIsGrubu(isGrubuId, filters = {}) {
        return this.getIsKalemleri({ ...filters, isGrubuId });
    },

    // Poz numarasına göre iş kalemlerini getir
    async getIsKalemleriByPozNo(pozNo, filters = {}) {
        return this.getIsKalemleri({ ...filters, pozNo });
    },

    // Toplu iş kalemi oluşturma
    async createIsKalemiBatch(isKalemleri) {
        try {
            const promises = isKalemleri.map(isKalemi => this.createIsKalemi(isKalemi));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Toplu iş kalemi oluşturma hatası:', error);
            throw error;
        }
    },

    // Toplu iş kalemi güncelleme
    async updateIsKalemiBatch(isKalemleri) {
        try {
            const promises = isKalemleri.map(isKalemi => this.updateIsKalemi(isKalemi.id, isKalemi));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Toplu iş kalemi güncelleme hatası:', error);
            throw error;
        }
    }
};

export default isKalemiService;
