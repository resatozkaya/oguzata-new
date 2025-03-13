import { db } from '../config/firebase';
import { 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy,
    Timestamp,
    startAt,
    endAt,
    writeBatch
} from 'firebase/firestore';

const COLLECTION_NAME = 'hakedisler';

// Hakediş verilerini hazırla
const prepareHakedisData = (data) => {
    // Tarih kontrolü ve dönüşümü
    const donem = data.donem instanceof Date ? data.donem : new Date(data.donem);
    const onayTarihi = data.onayTarihi instanceof Date ? data.onayTarihi : data.onayTarihi ? new Date(data.onayTarihi) : null;

    return {
        hakedisNo: data.hakedisNo || '',
        donem: Timestamp.fromDate(donem),
        taseronId: data.taseronId || '',
        taseronAdi: data.taseronAdi || '', // Tam isim
        sozlesmeId: data.sozlesmeId || '',
        sozlesmeNo: data.sozlesmeNo || '',
        santiyeId: data.santiyeId || data.santiye?.id || '',
        santiyeAdi: data.santiyeAdi || data.santiye?.santiyeAdi || '', // Tam isim
        aciklama: data.aciklama || '',
        durum: data.durum || 'taslak',
        toplamTutar: parseFloat(data.toplamTutar) || 0,
        redNedeni: data.redNedeni || '',
        metrajlar: data.metrajlar || [],
        
        // Sistem bilgileri
        createdAt: data.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: data.createdBy || null,
        updatedBy: data.updatedBy || null,
        onaylayanId: data.onaylayanId || null,
        onayTarihi: onayTarihi ? Timestamp.fromDate(onayTarihi) : null
    };
};

const hakedisService = {
    // Hakediş oluşturma
    async createHakedis(data) {
        try {
            const hakedisData = prepareHakedisData(data);
            const docRef = await addDoc(collection(db, COLLECTION_NAME), hakedisData);
            return { id: docRef.id, ...hakedisData };
        } catch (error) {
            console.error('Hakediş oluşturma hatası:', error);
            throw error;
        }
    },

    // Hakediş güncelleme
    async updateHakedis(id, data) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const guncelData = prepareHakedisData({
                ...data,
                updatedAt: Timestamp.now()
            });
            await updateDoc(docRef, guncelData);
            return { id, ...guncelData };
        } catch (error) {
            console.error('Hakediş güncelleme hatası:', error);
            throw error;
        }
    },

    // Hakediş durumu güncelleme
    async updateHakedisDurum(id, yeniDurum, onaylayanId = null) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const updateData = {
                durum: yeniDurum,
                updatedAt: Timestamp.now()
            };
            
            if (onaylayanId && yeniDurum === 'onaylandi') {
                updateData.onaylayanId = onaylayanId;
                updateData.onayTarihi = Timestamp.now();
            } else if (yeniDurum === 'reddedildi') {
                updateData.onaylayanId = null;
                updateData.onayTarihi = null;
            }

            await updateDoc(docRef, updateData);
            return updateData;
        } catch (error) {
            console.error('Hakediş durumu güncelleme hatası:', error);
            throw error;
        }
    },

    // Hakediş detaylarını getir
    async getHakedisById(id) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                throw new Error('Hakediş bulunamadı');
            }
            return { id: docSnap.id, ...docSnap.data() };
        } catch (error) {
            console.error('Hakediş detayı getirme hatası:', error);
            throw error;
        }
    },

    // Tüm hakedişleri getir
    async getHakedisler(filters = {}) {
        try {
            let q = collection(db, COLLECTION_NAME);
            const conditions = [];
            
            // Temel filtreler
            if (filters.santiyeId) {
                conditions.push(where('santiyeId', '==', filters.santiyeId));
            }
            
            if (filters.taseronId) {
                conditions.push(where('taseronId', '==', filters.taseronId));
            }
            
            if (filters.sozlesmeId) {
                conditions.push(where('sozlesmeId', '==', filters.sozlesmeId));
            }
            
            if (filters.durum) {
                conditions.push(where('durum', '==', filters.durum));
            }

            // Tarih aralığı filtresi
            if (filters.baslangicTarihi && filters.bitisTarihi) {
                const baslangic = filters.baslangicTarihi instanceof Date ? filters.baslangicTarihi : new Date(filters.baslangicTarihi);
                const bitis = filters.bitisTarihi instanceof Date ? filters.bitisTarihi : new Date(filters.bitisTarihi);
                
                conditions.push(
                    where('donem', '>=', Timestamp.fromDate(baslangic)),
                    where('donem', '<=', Timestamp.fromDate(bitis))
                );
            }
            
            // Filtreleri uygula
            if (conditions.length > 0) {
                q = query(q, ...conditions, orderBy('donem', 'desc'));
            } else {
                q = query(q, orderBy('donem', 'desc'));
            }
            
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Hakedişler getirilirken hata:', error);
            throw error;
        }
    },

    // Şantiyeye ait hakedişleri getir
    async getHakedisBySantiye(santiyeId, filters = {}) {
        return this.getHakedisler({ ...filters, santiyeId });
    },

    // Taşerona ait hakedişleri getir
    async getHakedisByTaseron(taseronId, filters = {}) {
        return this.getHakedisler({ ...filters, taseronId });
    },

    // Sözleşmeye ait hakedişleri getir
    async getHakedisBySozlesme(sozlesmeId, filters = {}) {
        return this.getHakedisler({ ...filters, sozlesmeId });
    },

    // Toplu hakediş oluşturma
    async createHakedisBatch(hakedisler) {
        try {
            const batch = writeBatch(db);
            hakedisler.forEach(hakedis => {
                const docRef = doc(db, COLLECTION_NAME);
                batch.set(docRef, prepareHakedisData(hakedis));
            });
            await batch.commit();
            return hakedisler.map((hakedis, index) => ({ id: index.toString(), ...hakedis }));
        } catch (error) {
            console.error('Toplu hakediş oluşturma hatası:', error);
            throw error;
        }
    },

    // Toplu hakediş güncelleme
    async updateHakedisBatch(hakedisler) {
        try {
            const batch = writeBatch(db);
            hakedisler.forEach(hakedis => {
                const docRef = doc(db, COLLECTION_NAME, hakedis.id);
                batch.update(docRef, prepareHakedisData(hakedis));
            });
            await batch.commit();
            return hakedisler;
        } catch (error) {
            console.error('Toplu hakediş güncelleme hatası:', error);
            throw error;
        }
    }
};

export default hakedisService;
