import { db } from '../firebase';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp
} from 'firebase/firestore';

const COLLECTION_NAME = 'personeller';

// Tüm taşeronları getir
export const taseronlariGetir = async () => {
    try {
        // Tüm personel kayıtlarını getir
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        console.log('Firestore\'dan gelen ham personel verileri:', snapshot.docs.length);
        
        const taseronlar = snapshot.docs
            .map(doc => {
                const data = doc.data();
                console.log('Ham personel verisi:', { id: doc.id, ...data });
                
                // Firma adını belirle
                let firma = '';
                if (data.firma && typeof data.firma === 'string') {
                    firma = data.firma.trim();
                } else if (data.unvan && typeof data.unvan === 'string') {
                    firma = data.unvan.trim();
                } else if (data.ad && typeof data.ad === 'string') {
                    firma = data.ad.trim();
                }
                
                const taseron = {
                    id: doc.id,
                    firma: firma,
                    yetkili: data.yetkili || '',
                    telefon: data.telefon || '',
                    vergiDairesi: data.vergiDairesi || '',
                    vergiNo: data.vergiNo || '',
                    tip: (data.tip || '').toLowerCase(),
                    aktif: data.aktif !== false,
                    createdAt: data.createdAt,
                    ...data
                };
                
                console.log(`Personel dönüştürüldü: ${taseron.firma} (${taseron.id}), Tip: ${taseron.tip}, Aktif: ${taseron.aktif}`);
                return taseron;
            })
            .filter(taseron => {
                const isValid = 
                    taseron.firma && 
                    taseron.aktif !== false && 
                    taseron.tip === 'taseron';
                    
                if (!isValid) {
                    console.log(`Personel filtrelendi (geçersiz): ${taseron.firma}, Tip: ${taseron.tip}, Aktif: ${taseron.aktif}`);
                } else {
                    console.log(`Taşeron bulundu: ${taseron.firma} (${taseron.id})`);
                }
                
                return isValid;
            })
            .sort((a, b) => a.firma.localeCompare(b.firma, 'tr')); // Türkçe sıralama
            
        console.log('Filtrelenmiş taşeron listesi:', taseronlar.map(t => ({ id: t.id, firma: t.firma })));
        return taseronlar;
    } catch (error) {
        console.error('Taşeronlar getirilirken hata:', error);
        throw error;
    }
};

// Yeni taşeron ekle
export const createTaseron = async (data) => {
    try {
        const newData = {
            ...data,
            tip: 'taseron',
            aktif: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };
        
        const docRef = await addDoc(collection(db, COLLECTION_NAME), newData);
        return { id: docRef.id, ...newData };
    } catch (error) {
        console.error('Taşeron oluşturulurken hata:', error);
        throw error;
    }
};

// Taşeron güncelle
export const updateTaseron = async (id, data) => {
    try {
        const updateData = {
            ...data,
            updatedAt: Timestamp.now()
        };
        
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, updateData);
        return { id, ...updateData };
    } catch (error) {
        console.error('Taşeron güncellenirken hata:', error);
        throw error;
    }
};

// Taşeron sil (soft delete)
export const deleteTaseron = async (id) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            aktif: false,
            updatedAt: Timestamp.now()
        });
        return id;
    } catch (error) {
        console.error('Taşeron silinirken hata:', error);
        throw error;
    }
};
